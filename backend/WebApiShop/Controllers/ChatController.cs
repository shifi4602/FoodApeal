using Microsoft.AspNetCore.Mvc;
using Services;
using System.Text.Json;

namespace WebApiShop.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;

        public ChatController(IChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] JsonElement body)
        {
            var message = body.GetProperty("message").GetString() ?? string.Empty;
            var history = body.GetProperty("history");

            var result = await _chatService.ChatAsync(message, history);
            return Ok(result);
        }
    }
}
