using System.Text;
using System.Text.Json;

namespace Services
{
    public class ChatService : IChatService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IProductService _productService;

        public ChatService(IHttpClientFactory httpClientFactory, IProductService productService)
        {
            _httpClientFactory = httpClientFactory;
            _productService = productService;
        }

        public async Task<JsonElement> ChatAsync(string message, JsonElement history)
        {
            var httpClient = _httpClientFactory.CreateClient("AiService");

            // Fetch all available products (no filters) so every category reaches GPT
            var products = await _productService.GetProducts(1, 300, Array.Empty<int?>(), null, null, null);

            var thinProducts = products.Select(p => new
            {
                id = p.Id,
                name = p.Name,
                price = p.Price,
                description = p.Description,
                category = p.CategoryName,
                inStock = p.IsAvailable,
                imageUrl = p.ImageUrl
            });

            var payload = JsonSerializer.Serialize(new { message, history, products = thinProducts });

            using var content = new StringContent(payload, Encoding.UTF8, "application/json");

            var response = await httpClient.PostAsync("chat", content);
            var responseBody = await response.Content.ReadAsStringAsync();

            return JsonSerializer.Deserialize<JsonElement>(responseBody);
        }
    }
}
