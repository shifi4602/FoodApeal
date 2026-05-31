using Microsoft.AspNetCore.Mvc;
using Services;
using System.Text.Json;

namespace WebApiShop.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        private readonly ISemanticSearchService _searchService;

        public SearchController(ISemanticSearchService searchService)
        {
            _searchService = searchService;
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] JsonElement body)
        {
            var query = body.GetProperty("query").GetString() ?? string.Empty;

            var result = await _searchService.SearchAsync(query);
            return Ok(result);
        }
    }
}
