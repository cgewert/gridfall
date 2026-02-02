using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using GridfallServer;
using GridfallServer.Network;
using GridfallServer.Players;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<ServerState>();

var app = builder.Build();
var lifetime = app.Lifetime;
var serverState = app.Services.GetRequiredService<ServerState>();

// Register lifecycle hooks
lifetime.ApplicationStarted.Register(() =>
{
    Console.WriteLine($"[Server] Started at {DateTimeOffset.Now}  (Env={app.Environment.EnvironmentName})");
});

// STOPPING (graceful shutdown begins)
lifetime.ApplicationStopping.Register(() =>
{
    Console.WriteLine($"[Server] Stopping at {DateTimeOffset.Now} ...");
    _ = serverState.ShutdownAsync();
});

// STOPPED (shutdown finished)
lifetime.ApplicationStopped.Register(() =>
{
    Console.WriteLine($"[Server] Stopped at {DateTimeOffset.Now}");
});

app.UseWebSockets(new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromSeconds(20)
});

app.MapGet("/", () => Results.Ok("GridfallServer OK"));

app.Map("/ws", async (HttpContext ctx, ServerState state) =>
{
    if (!ctx.WebSockets.IsWebSocketRequest)
    {
        ctx.Response.StatusCode = StatusCodes.Status400BadRequest;
        await ctx.Response.WriteAsync("WebSocket endpoint. Use ws://.../ws");
        return;
    }

    using var socket = await ctx.WebSockets.AcceptWebSocketAsync();
    // Send welcome immediately after a client connects
    var welcomeMessage = "Welcome to GridfallServer! Please proceed with login.";
    await state.SendAsync(socket, new OutMessage("welcome", welcomeMessage ));
    Console.WriteLine("[Server] New client connected at " + DateTimeOffset.Now);
    
    var playerConnection = new PlayerConnection(socket);
    state.AddConnection(playerConnection);

    try
    {
        await ReceiveLoopAsync(playerConnection, state, ctx.RequestAborted);
    }
    catch (OperationCanceledException)
    {
        // ignore
    }
    catch (WebSocketException)
    {
        // connection dropped
    }
    finally
    {
        await state.DisconnectAsync(playerConnection);
    }
});

app.Run();

static async Task ReceiveLoopAsync(PlayerConnection playerConnection, ServerState state, CancellationToken ct)
{
    var socket = playerConnection.Socket;
    var buffer = new byte[16 * 1024];

    while (socket.State == WebSocketState.Open && !ct.IsCancellationRequested)
    {
        var sb = new StringBuilder();
        WebSocketReceiveResult? result;

        do
        {
            result = await socket.ReceiveAsync(buffer, ct);

            if (result.MessageType == WebSocketMessageType.Close)
                return;

            if (result.MessageType != WebSocketMessageType.Text)
                continue;

            sb.Append(Encoding.UTF8.GetString(buffer, 0, result.Count));
        }
        while (!result.EndOfMessage);

        var json = sb.ToString().Trim();
        if (json.Length == 0) continue;

        InMessage? msg;
        try
        {
            msg = JsonSerializer.Deserialize<InMessage>(json, JsonOptions.Instance);
        }
        catch
        {
            await state.SendAsync(playerConnection, new OutMessage("error", new { code = "bad_json" }));
            continue;
        }

        if (msg is null || string.IsNullOrWhiteSpace(msg.Type))
        {
            await state.SendAsync(playerConnection, new OutMessage("error", new { code = "missing_type" }));
            continue;
        }

        await state.HandleAsync(playerConnection, msg, ct);
    }
}

// Class representing all data the Gridfall Server manages during runtime.

sealed record InMessage(
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("data")] JsonElement? Data);

sealed record OutMessage(
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("data")] object? Data);