using System.Text.Json;

namespace Services
{
    public interface IChatService
    {
        Task<JsonElement> ChatAsync(string message, JsonElement history);
    }
}
