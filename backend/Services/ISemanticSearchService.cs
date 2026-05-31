using System.Text.Json;

namespace Services
{
    public interface ISemanticSearchService
    {
        Task<JsonElement> SearchAsync(string query);
    }
}
