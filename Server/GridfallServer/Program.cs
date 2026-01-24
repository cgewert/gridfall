using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<ServerState>();

var app = builder.Build();

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
    var playerId = state.NewPlayerId();
    var player = new PlayerConnection(playerId, socket);

    state.Players[playerId] = player;

    // Send welcome immediately
    await state.SendAsync(player, new OutMessage("welcome", new { playerId }));
    Console.WriteLine("New player connected: " + playerId);

    try
    {
        await ReceiveLoopAsync(player, state, ctx.RequestAborted);
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
        await state.DisconnectAsync(playerId);
    }
});

app.Run();

static async Task ReceiveLoopAsync(PlayerConnection player, ServerState state, CancellationToken ct)
{
    var socket = player.Socket;
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
            await state.SendAsync(player, new OutMessage("error", new { code = "bad_json" }));
            continue;
        }

        if (msg is null || string.IsNullOrWhiteSpace(msg.Type))
        {
            await state.SendAsync(player, new OutMessage("error", new { code = "missing_type" }));
            continue;
        }

        await state.HandleAsync(player, msg, ct);
    }
}

sealed class ServerState
{
    public ConcurrentDictionary<string, PlayerConnection> Players { get; } = new();
    public ConcurrentDictionary<string, Room> Rooms { get; } = new();

    private int _nextPlayer = 0;
    private int _nextRoom = 0;

    public string NewPlayerId() => $"p{Interlocked.Increment(ref _nextPlayer)}";
    public string NewRoomId() => $"r{Interlocked.Increment(ref _nextRoom)}";

    public async Task HandleAsync(PlayerConnection player, InMessage msg, CancellationToken ct)
    {
        switch (msg.Type)
        {
            case "hello":
                player.ClientVersion = msg.Data?.GetPropertyOrNull("clientVersion")?.GetString();
                await SendAsync(player, new OutMessage("helloAck", new { serverTime = DateTimeOffset.UtcNow }));
                break;

            case "createRoom":
                {
                    var roomId = NewRoomId();
                    var mode = msg.Data?.GetPropertyOrNull("mode")?.GetString() ?? "vs";
                    var ruleset = msg.Data?.GetPropertyOrNull("ruleset")?.GetString() ?? "modern";

                    var room = new Room(roomId, mode, ruleset);
                    Rooms[roomId] = room;

                    await JoinRoomAsync(player, room, ct);
                    await SendAsync(player, new OutMessage("roomCreated", new { roomId }));
                    break;
                }

            case "joinRoom":
                {
                    var roomId = msg.Data?.GetPropertyOrNull("roomId")?.GetString();
                    if (string.IsNullOrWhiteSpace(roomId) || !Rooms.TryGetValue(roomId, out var room))
                    {
                        await SendAsync(player, new OutMessage("error", new { code = "room_not_found" }));
                        break;
                    }

                    await JoinRoomAsync(player, room, ct);
                    break;
                }

            case "leaveRoom":
                {
                    if (player.RoomId is null) break;
                    await LeaveRoomAsync(player, ct);
                    break;
                }

            case "ready":
                {
                    if (player.RoomId is null || !Rooms.TryGetValue(player.RoomId, out var room))
                    {
                        await SendAsync(player, new OutMessage("error", new { code = "not_in_room" }));
                        break;
                    }

                    room.SetReady(player.PlayerId, true);
                    await BroadcastRoomStateAsync(room, ct);
                    await TryStartMatchAsync(room, ct);
                    break;
                }

            case "unready":
                {
                    if (player.RoomId is null || !Rooms.TryGetValue(player.RoomId, out var room))
                        break;

                    room.SetReady(player.PlayerId, false);
                    await BroadcastRoomStateAsync(room, ct);
                    break;
                }

            case "attack":
                {
                    if (player.RoomId is null || !Rooms.TryGetValue(player.RoomId, out var room))
                    {
                        await SendAsync(player, new OutMessage("error", new { code = "not_in_room" }));
                        break;
                    }

                    if (!room.InMatch)
                    {
                        await SendAsync(player, new OutMessage("error", new { code = "match_not_started" }));
                        break;
                    }

                    var lines = msg.Data?.GetPropertyOrNull("lines")?.GetInt32() ?? 0;
                    if (lines <= 0 || lines > 20)
                    {
                        await SendAsync(player, new OutMessage("error", new { code = "bad_attack_lines" }));
                        break;
                    }

                    // Relay to all other players in room
                    var payload = new
                    {
                        fromPlayerId = player.PlayerId,
                        lines,
                        t = DateTimeOffset.UtcNow
                    };

                    foreach (var otherId in room.PlayerIds.Where(id => id != player.PlayerId))
                    {
                        if (Players.TryGetValue(otherId, out var other))
                            await SendAsync(other, new OutMessage("garbage", payload));
                    }

                    break;
                }

            case "gameOver":
                {
                    if (player.RoomId is null || !Rooms.TryGetValue(player.RoomId, out var room))
                        break;

                    room.SetAlive(player.PlayerId, false);
                    await BroadcastRoomStateAsync(room, ct);

                    // If only one player alive -> match end
                    var alive = room.Players.Values.Count(p => p.Alive);
                    if (room.InMatch && alive <= 1)
                    {
                        room.InMatch = false;
                        var winnerId = room.Players.Values.FirstOrDefault(p => p.Alive)?.PlayerId;

                        await BroadcastAsync(room, new OutMessage("matchEnd", new { winnerId, t = DateTimeOffset.UtcNow }), ct);

                        // reset readiness for next match
                        room.ResetReady();
                        room.ResetAlive();
                        await BroadcastRoomStateAsync(room, ct);
                    }
                    break;
                }

            case "ping":
                await SendAsync(player, new OutMessage("pong", new { t = DateTimeOffset.UtcNow }));
                break;

            default:
                await SendAsync(player, new OutMessage("error", new { code = "unknown_type", type = msg.Type }));
                break;
        }
    }

    private async Task JoinRoomAsync(PlayerConnection player, Room room, CancellationToken ct)
    {
        // Leave previous room
        if (player.RoomId is not null)
            await LeaveRoomAsync(player, ct);

        room.AddPlayer(player.PlayerId);
        player.RoomId = room.RoomId;

        await SendAsync(player, new OutMessage("joinedRoom", new { roomId = room.RoomId, mode = room.Mode, ruleset = room.Ruleset }));
        await BroadcastRoomStateAsync(room, ct);
    }

    private async Task LeaveRoomAsync(PlayerConnection player, CancellationToken ct)
    {
        if (player.RoomId is null) return;
        if (!Rooms.TryGetValue(player.RoomId, out var room))
        {
            player.RoomId = null;
            return;
        }

        room.RemovePlayer(player.PlayerId);
        var leftRoomId = player.RoomId;
        player.RoomId = null;

        await SendAsync(player, new OutMessage("leftRoom", new { roomId = leftRoomId }));

        if (room.PlayerIds.Count == 0)
        {
            Rooms.TryRemove(room.RoomId, out _);
        }
        else
        {
            await BroadcastRoomStateAsync(room, ct);
        }
    }

    public async Task DisconnectAsync(string playerId)
    {
        if (!Players.TryRemove(playerId, out var player))
            return;

        try
        {
            if (player.RoomId is not null && Rooms.TryGetValue(player.RoomId, out var room))
            {
                room.RemovePlayer(playerId);

                if (room.PlayerIds.Count == 0)
                    Rooms.TryRemove(room.RoomId, out _);
                else
                    await BroadcastRoomStateAsync(room, CancellationToken.None);
            }
        }
        catch { /* ignore */ }

        try
        {
            if (player.Socket.State == WebSocketState.Open || player.Socket.State == WebSocketState.CloseReceived)
                await player.Socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "bye", CancellationToken.None);
        }
        catch { /* ignore */ }
    }

    private async Task TryStartMatchAsync(Room room, CancellationToken ct)
    {
        if (room.InMatch) return;
        if (room.PlayerIds.Count < 2) return;

        var allReady = room.Players.Values.All(p => p.Ready);
        if (!allReady) return;

        room.InMatch = true;
        room.ResetAlive();

        // Seed and coordinated start time
        var seed = RandomNumberGenerator.GetInt32(int.MinValue, int.MaxValue);
        var startAt = DateTimeOffset.UtcNow.AddSeconds(2);

        await BroadcastAsync(room, new OutMessage("matchStart", new
        {
            seed,
            startAt,
            rules = new { room.Mode, room.Ruleset }
        }), ct);

        await BroadcastRoomStateAsync(room, ct);
    }

    private async Task BroadcastRoomStateAsync(Room room, CancellationToken ct)
    {
        var snapshot = room.Players.Values
            .Select(p => new { playerId = p.PlayerId, ready = p.Ready, alive = p.Alive })
            .ToArray();

        await BroadcastAsync(room, new OutMessage("roomState", new
        {
            roomId = room.RoomId,
            status = room.InMatch ? "in_match" : "lobby",
            players = snapshot
        }), ct);
    }

    private async Task BroadcastAsync(Room room, OutMessage msg, CancellationToken ct)
    {
        foreach (var pid in room.PlayerIds)
        {
            if (Players.TryGetValue(pid, out var p))
                await SendAsync(p, msg);
        }
    }

    public async Task SendAsync(PlayerConnection player, OutMessage msg)
    {
        if (player.Socket.State != WebSocketState.Open)
            return;

        var json = JsonSerializer.Serialize(msg, JsonOptions.Instance);
        var bytes = Encoding.UTF8.GetBytes(json);

        await player.SendLock.WaitAsync();
        try
        {
            await player.Socket.SendAsync(bytes, WebSocketMessageType.Text, true, CancellationToken.None);
        }
        finally
        {
            player.SendLock.Release();
        }
    }
}

sealed class Room
{
    public string RoomId { get; }
    public string Mode { get; }
    public string Ruleset { get; }
    public bool InMatch { get; set; }

    public ConcurrentDictionary<string, RoomPlayer> Players { get; } = new();
    public List<string> PlayerIds => Players.Keys.OrderBy(x => x).ToList();

    public Room(string roomId, string mode, string ruleset)
    {
        RoomId = roomId;
        Mode = mode;
        Ruleset = ruleset;
    }

    public void AddPlayer(string playerId)
    {
        Players[playerId] = new RoomPlayer(playerId) { Ready = false, Alive = true };
    }

    public void RemovePlayer(string playerId)
    {
        Players.TryRemove(playerId, out _);

        // If someone leaves during match, you can decide policy:
        // for MVP: end match if <2 players
        if (InMatch && Players.Count < 2)
            InMatch = false;
    }

    public void SetReady(string playerId, bool ready)
    {
        if (Players.TryGetValue(playerId, out var rp))
            rp.Ready = ready;
    }

    public void SetAlive(string playerId, bool alive)
    {
        if (Players.TryGetValue(playerId, out var rp))
            rp.Alive = alive;
    }

    public void ResetReady()
    {
        foreach (var p in Players.Values) p.Ready = false;
    }

    public void ResetAlive()
    {
        foreach (var p in Players.Values) p.Alive = true;
    }
}

sealed class PlayerConnection
{
    public string PlayerId { get; }
    public WebSocket Socket { get; }
    public string? RoomId { get; set; }
    public string? ClientVersion { get; set; }

    // Prevent parallel sends on one socket (WebSockets don't like that)
    public SemaphoreSlim SendLock { get; } = new(1, 1);

    public PlayerConnection(string playerId, WebSocket socket)
    {
        PlayerId = playerId;
        Socket = socket;
    }
}

sealed class RoomPlayer
{
    public string PlayerId { get; }
    public bool Ready { get; set; }
    public bool Alive { get; set; }

    public RoomPlayer(string playerId) => PlayerId = playerId;
}

sealed record InMessage(
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("data")] JsonElement? Data);

sealed record OutMessage(
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("data")] object? Data);

sealed class JsonOptions
{
    public static readonly JsonSerializerOptions Instance = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };
}

static class JsonElementExt
{
    public static JsonElement? GetPropertyOrNull(this JsonElement el, string name)
    {
        if (el.ValueKind != JsonValueKind.Object) return null;
        return el.TryGetProperty(name, out var p) ? p : (JsonElement?)null;
    }

    public static int? GetInt32(this JsonElement? el)
    {
        if (el is null) return null;
        if (el.Value.ValueKind == JsonValueKind.Number && el.Value.TryGetInt32(out var v))
            return v;
        return null;
    }
}
