using System.Text.Json;

namespace GridfallServer.Network;

public static class JsonElementExt
{
    public static JsonElement? GetPropertyOrNull(this JsonElement el, string name)
    {
        if (el.ValueKind != JsonValueKind.Object) return null;
        return el.TryGetProperty(name, out var p) ? p : (JsonElement?)null;
    }

    public static string GetPropertyOrEmpty(this JsonElement el, string name)
    {
        if (el.ValueKind != JsonValueKind.Object) return string.Empty;
        var hasProperty = el.TryGetProperty(name, out var p);
        return hasProperty ? p.GetString() ?? string.Empty : string.Empty;
    }
    
    public static int? GetInt32(this JsonElement? el)
    {
        if (el is null) return null;
        if (el.Value.ValueKind == JsonValueKind.Number && el.Value.TryGetInt32(out var v))
            return v;
        return null;
    }
}