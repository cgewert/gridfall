using System.Text.Json;
using System.Text.Json.Serialization;

namespace GridfallServer.Network;

sealed class JsonOptions
{
    public static readonly JsonSerializerOptions Instance = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };
}