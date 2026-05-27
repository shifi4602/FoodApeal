using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace WebApiShop.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public ChatController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] JsonElement body)
        {
            var client = _httpClientFactory.CreateClient("AiService");

            var json = body.GetRawText();
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync("chat", content);

            var responseBody = await response.Content.ReadAsStringAsync();

            return StatusCode((int)response.StatusCode, JsonSerializer.Deserialize<JsonElement>(responseBody));
        }
    }
}
