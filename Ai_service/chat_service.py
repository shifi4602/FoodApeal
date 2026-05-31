import re, json as _json
import os
import httpx
import uvicorn
from functools import lru_cache
from typing import Annotated
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from openai import OpenAI
from pydantic import BaseModel

from semantic_search import SemanticSearchService

load_dotenv()

# Import all prompt configuration from the dedicated config file
from prompt_config import (
    STORE_NAME,
    SYSTEM_PROMPT,
    TEMPERATURE,
    TOPIC_GUARD_PROMPT,
    OFF_TOPIC_RESPONSE,
)

# ---------------------------------------------------------------------------
# OpenAI client
# ---------------------------------------------------------------------------

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY is not set in the environment.")

# SSL verification is disabled to work around corporate proxy certificate issues.
# Remove http_client in environments with a trusted CA chain.
client = OpenAI(
    api_key=OPENAI_API_KEY,
    http_client=httpx.Client(verify=False),
)

# ---------------------------------------------------------------------------
# Dependency-injection provider
# ---------------------------------------------------------------------------
# lru_cache(maxsize=1) on a zero-arg function acts as a singleton:
# the SemanticSearchService (and its embedding cache) is created once and
# the same instance is returned on every subsequent request.

@lru_cache(maxsize=1)
def get_search_service() -> SemanticSearchService:
    return SemanticSearchService(client)


# ---------------------------------------------------------------------------
# Topic guard
# ---------------------------------------------------------------------------

def is_on_topic(message: str) -> bool:
    # Topic guard disabled — Fay's system prompt (STORE_CONTEXT + RULES) already
    # constrains her to on-topic responses, and the LLM guard was unreliable for Hebrew.
    return True


# ---------------------------------------------------------------------------
# Category keyword map — used to detect which product category appears in
# Fay's reply so we can return the right product cards even when she doesn't
# mention the exact catalog product name.
# ---------------------------------------------------------------------------

_CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "pots":               ["סיר", "קלחת", "pot", "pots"],
    "pans":               ["מחבת", "pan", "pans", "frying", "טיגון", "נון-סטיק", "non-stick"],
    "baking":             ["תבנית", "אפייה", "עוגה", "baking", "bake", "cake", "tray"],
    "knives":             ["סכין", "knife", "knives", "blade"],
    "GlassesAndPitchers": ["ספל", "כוס", "קנקן", "glass", "pitcher", "cup", "mug"],
    "tableDesign":        ["מפית", "טבעת מפית", "napkin", "table design"],
    "dinnerware":         ["צלחת", "plate", "dinner", "bowl", "קערה"],
    "servingware":        ["הגשה", "מגש", "serving"],
    "storage":            ["אחסון", "קופסה", "storage", "container"],
    "electric":           ["חשמל", "electric", "appliance"],
    "to-go":              ["תרמוס", "לדרך", "to-go", "travel"],
    "orgenize":           ["ארגון", "organize", "organizer", "מגירה"],
    "trash":              ["פח", "trash", "bin"],
    "amount":             ["כמות", "measuring", "מידה"],
}


def detect_categories_in_text(text: str, available_categories: list[str]) -> list[str]:
    """Return every category whose keywords appear anywhere in `text`."""
    text_lower = text.lower()
    found = []
    for cat in available_categories:
        for kw in _CATEGORY_KEYWORDS.get(cat, []):
            if kw in text_lower:
                found.append(cat)
                break
    return found


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class Message(BaseModel):
    role: str       # "user" or "assistant"
    content: str

class ProductItem(BaseModel):
    id: int = 0
    name: str
    price: float
    description: str | None = None
    category: str | None = None
    inStock: bool = True
    imageUrl: str | None = None

class ChatRequest(BaseModel):
    message: str
    history: list[Message] = []
    products: list[ProductItem] = []

class ChatResponse(BaseModel):
    reply: str
    products: list[ProductItem] = []

class SearchRequest(BaseModel):
    query: str
    products: list[ProductItem] = []

class SearchResultItem(BaseModel):
    id: int
    name: str
    price: float
    description: str | None = None
    imageUrl: str | None = None
    category: str | None = None
    score: float

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(title=f"{STORE_NAME} - AI Chat Service (Fay)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/", include_in_schema=False)
async def root():
    """Redirect browser navigation to the interactive Swagger docs."""
    return RedirectResponse(url="/docs")


@app.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    search_svc: Annotated[SemanticSearchService, Depends(get_search_service)],
) -> ChatResponse:
    """
    1. Run topic guard — if off-topic, return fixed message immediately.
    2. Use semantic search to find the most relevant products for the message.
    3. Build message array with system prompt and call gpt-4o.
    """
    # Step 1: Topic guard — intercept before reaching the main model
    if not is_on_topic(request.message):
        return ChatResponse(reply=OFF_TOPIC_RESPONSE)

    # Step 2: Build effective system prompt — GPT always sees the full catalog.
    # Semantic search is used AFTER the reply to select which product cards to display.
    effective_prompt = SYSTEM_PROMPT
    if request.products:
        catalog_lines = [f"- {p.name} (₪{p.price}): {p.description}" for p in request.products]
        catalog_text = "\n".join(catalog_lines)

        effective_prompt += (
            f"\n\nAvailable products (ALL items below are in stock and ready to purchase — treat this list as the live inventory):\n{catalog_text}"
            "\n\nInstructions for this response:"
            "\n- Every item in the list above IS available. Never tell the customer a product category is out of stock when related items appear here."
            "\n- Match the customer's request broadly: Hebrew terms overlap heavily (סיר / קלחת / מחבת are all types of cooking vessels). If a catalog item satisfies the need, recommend it."
            "\n- Recommend ONLY products from this catalog; always refer to them by their exact catalog name."
            "\n- Keep your reply to 2-3 plain-text sentences."
        )

    # Step 3: Build message array and call main model
    messages = [{"role": "system", "content": effective_prompt}]
    messages.extend({"role": m.role, "content": m.content} for m in request.history)
    messages.append({"role": "user", "content": request.message})

    # Use lower temperature when a catalog is present to reduce random product selection
    effective_temperature = 0.1 if request.products else TEMPERATURE

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=effective_temperature,
            max_tokens=400,
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"OpenAI request failed: {e}")

    reply = response.choices[0].message.content

    # Select product cards to display — three-stage priority:
    # 1. Exact name match: product catalog name appears verbatim in Fay's reply (most precise).
    # 2. Category match: detect which category Fay mentioned in her reply (reliable fallback).
    # 3. Semantic search on Fay's reply text (last resort for general/vague replies).
    matched: list[ProductItem] = []
    if request.products:
        reply_lower = reply.lower()

        # Stage 1 — exact name match
        matched = [p for p in request.products if p.name.lower() in reply_lower]

        if not matched:
            # Stage 2 — category detected from reply keywords
            available_categories = list({p.category for p in request.products if p.category})
            reply_categories = detect_categories_in_text(reply, available_categories)
            if reply_categories:
                matched = [p for p in request.products if p.category in reply_categories]

        if not matched:
            # Stage 3 — semantic search on the reply text
            semantic_results = search_svc.search(reply, request.products, top_k=5)
            result_ids = {r["id"] for r in semantic_results}
            matched = [p for p in request.products if p.id in result_ids]

    return ChatResponse(reply=reply, products=matched)

# ---------------------------------------------------------------------------

@app.post("/search", response_model=list[SearchResultItem])
async def search(
    request: SearchRequest,
    search_svc: Annotated[SemanticSearchService, Depends(get_search_service)],
) -> list[SearchResultItem]:
    """
    Semantic product search via OpenAI embeddings + cosine similarity.
    Delegates entirely to SemanticSearchService (see semantic_search.py).
    """
    try:
        results = search_svc.search(request.query, request.products)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"OpenAI embedding request failed: {e}")
    return [SearchResultItem(**r) for r in results]

# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run("chat_service:app", host="0.0.0.0", port=8001, reload=True)
