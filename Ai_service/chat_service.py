import os
import httpx
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from openai import OpenAI
from pydantic import BaseModel

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
# Topic guard
#
# Classifies the user message before it reaches the main model.
# Returns True if the message is store-related, False otherwise.
# Uses a lightweight LLM call (temperature=0, max_tokens=1) for speed.
# ---------------------------------------------------------------------------

def is_on_topic(message: str) -> bool:
    try:
        result = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": TOPIC_GUARD_PROMPT},
                {"role": "user", "content": message},
            ],
            temperature=0,
            max_tokens=1,
        )
        answer = result.choices[0].message.content.strip().upper()
        return answer == "YES"
    except Exception:
        # If the guard call fails, allow the message through
        return True

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class Message(BaseModel):
    role: str       # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: list[Message] = []

class ChatResponse(BaseModel):
    reply: str

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
async def chat(request: ChatRequest) -> ChatResponse:
    """
    1. Run topic guard — if off-topic, return fixed message immediately.
    2. If on-topic, build message array with system prompt and call gpt-4o.
    """
    # Step 1: Topic guard — intercept before reaching the main model
    if not is_on_topic(request.message):
        return ChatResponse(reply=OFF_TOPIC_RESPONSE)

    # Step 2: Build message array and call main model
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend({"role": m.role, "content": m.content} for m in request.history)
    messages.append({"role": "user", "content": request.message})

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=TEMPERATURE,
            max_tokens=400,
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"OpenAI request failed: {e}")

    reply = response.choices[0].message.content
    return ChatResponse(reply=reply)

# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run("chat_service:app", host="0.0.0.0", port=8001, reload=True)
