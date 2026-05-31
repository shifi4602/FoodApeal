using System.Text;
using System.Text.Json;

namespace Services
{
    public class SemanticSearchService : ISemanticSearchService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IProductService _productService;

        public SemanticSearchService(IHttpClientFactory httpClientFactory, IProductService productService)
        {
            _httpClientFactory = httpClientFactory;
            _productService = productService;
        }

        public async Task<JsonElement> SearchAsync(string query)
        {
            var httpClient = _httpClientFactory.CreateClient("AiService");

            // Fetch up to 50 available products (no filters)
            var products = await _productService.GetProducts(1, 50, Array.Empty<int?>(), null, null, null);

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

            var payload = JsonSerializer.Serialize(new { query, products = thinProducts });

            using var content = new StringContent(payload, Encoding.UTF8, "application/json");

            var response = await httpClient.PostAsync("search", content);
            var responseBody = await response.Content.ReadAsStringAsync();

            return JsonSerializer.Deserialize<JsonElement>(responseBody);
        }
    }
}
