using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using GridfallServer.Network;
using GridfallServer.Players;
using GridfallServer.Rooms;

namespace GridfallServer;

sealed class ServerState
{
    private readonly Lock _connectionsLock = new();
    private List<PlayerConnection> PlayerConnections { get; } = [];
    private readonly ConcurrentDictionary<string, Room> _rooms = new();
    
    public ConcurrentDictionary<string, Player> PlayerDirectory { get; } = new();

    // Dictionary containing all created rooms names as key and the linked Room object as value. 
    public ConcurrentDictionary<string, IRoom> Rooms { get; } = new();

    public void AddConnection(PlayerConnection conn)
    {
        lock (_connectionsLock)
            PlayerConnections.Add(conn);
    }

    public bool RemoveConnection(PlayerConnection conn)
    {
        lock (_connectionsLock)
            return PlayerConnections.Remove(conn);
    }
    
    public bool RemoveConnectionByPlayerId(string playerId)
    {
        lock (_connectionsLock)
        {
            var idx = PlayerConnections.FindIndex(c => c.Player?.PlayerId == playerId);
            if (idx < 0) return false;
            PlayerConnections.RemoveAt(idx);
            return true;
        }
    }
    
    public PlayerConnection? FindConnectionByPlayerId(string playerId)
    {
        lock (_connectionsLock)
            return PlayerConnections.FirstOrDefault(c => c.Player?.PlayerId == playerId);
    }
    
    /**
     * Returns a threadsafe snapshot of the actual player connections list.
     */
    public IReadOnlyList<PlayerConnection> SnapshotConnections()
    {
        lock (_connectionsLock)
            return PlayerConnections.ToList();
    }
    
    public async Task HandleAsync(PlayerConnection playerConnection, InMessage msg, CancellationToken ct)
    {
        switch (msg.Type)
        {
            case "login":
            {
                var clientVersion = msg.Data?.GetPropertyOrEmpty("clientVersion");
                var username = msg.Data?.GetPropertyOrEmpty("username");
                var password = msg.Data?.GetPropertyOrEmpty("password");
                
                if (clientVersion is not null && !string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
                {
                    // TODO: Refuse login when clientVersion does not match serverVersion
                    // TODO: When login okay: Create a player object and send it back to the client in the response
                    var newPlayer = new Player(Guid.NewGuid().ToString(), username, 123);
                    // TODO: Also update playerConnection to store the created player object reference
                    playerConnection.Player = newPlayer;
                    await SendAsync(playerConnection, new OutMessage("loginOk", newPlayer));
                    Console.WriteLine($"Logged in player {newPlayer.PlayerId} with name {newPlayer.Nickname} and Client {clientVersion}");
                }
                else
                {
                    var reason = "Invalid login data";
                    var response = new[] {
                        username,
                        reason
                    };
                    await SendAsync(playerConnection, new OutMessage("loginFailed", response));
                }
                break;
            }
            // case "createRoom":
            // {
            //         
            //     var mode = msg.Data?.GetPropertyOrNull("mode")?.GetString() ?? "vs";
            //     var ruleset = msg.Data?.GetPropertyOrNull("ruleset")?.GetString() ?? "modern";
            //     var roomId = msg.Data?.GetPropertyOrNull("room")?.GetString() ?? NewRoomId();
            //
            //     if (Rooms.TryGetValue(roomId, out var r))
            //     {
            //         await JoinRoomAsync(player, r, ct);    
            //     }
            //     else
            //     {
            //         var room = new Room(roomId, mode, ruleset);
            //         Rooms[roomId] = room;
            //         await JoinRoomAsync(player, room, ct);
            //     }
            //         
            //     await SendAsync(player, new OutMessage("roomCreated", new { roomId }));
            //     break;
            // }

            // case "joinRoom":
            // {
            //     var roomId = msg.Data?.GetPropertyOrNull("roomId")?.GetString();
            //     if (string.IsNullOrWhiteSpace(roomId) || !Rooms.TryGetValue(roomId, out var room))
            //     {
            //         await SendAsync(player, new OutMessage("error", new { code = "room_not_found" }));
            //         break;
            //     }
            //
            //     await JoinRoomAsync(player, room, ct);
            //     break;
            // }

            // case "leaveRoom":
            // {
            //     if (player.RoomId is null) break;
            //     await LeaveRoomAsync(player, ct);
            //     break;
            // }

            // case "ready":
            // {
            //     if (player.RoomId is null || !Rooms.TryGetValue(player.RoomId, out var room))
            //     {
            //         await SendAsync(player, new OutMessage("error", new { code = "not_in_room" }));
            //         break;
            //     }
            //
            //     room.SetReady(player.PlayerId, true);
            //     await BroadcastRoomStateAsync(room, ct);
            //     await TryStartMatchAsync(room, ct);
            //     break;
            // }

            // case "unready":
            // {
            //     if (player.RoomId is null || !Rooms.TryGetValue(player.RoomId, out var room))
            //         break;
            //
            //     room.SetReady(player.PlayerId, false);
            //     await BroadcastRoomStateAsync(room, ct);
            //     break;
            // }

            // case "attack":
            // {
            //     if (player.RoomId is null || !Rooms.TryGetValue(player.RoomId, out var room))
            //     {
            //         await SendAsync(player, new OutMessage("error", new { code = "not_in_room" }));
            //         break;
            //     }
            //
            //     if (!room.InMatch)
            //     {
            //         await SendAsync(player, new OutMessage("error", new { code = "match_not_started" }));
            //         break;
            //     }
            //
            //     var lines = msg.Data?.GetPropertyOrNull("lines")?.GetInt32() ?? 0;
            //     if (lines <= 0 || lines > 20)
            //     {
            //         await SendAsync(player, new OutMessage("error", new { code = "bad_attack_lines" }));
            //         break;
            //     }
            //
            //     // Relay to all other players in room
            //     var payload = new
            //     {
            //         fromPlayerId = player.PlayerId,
            //         lines,
            //         t = DateTimeOffset.UtcNow
            //     };
            //
            //     foreach (var otherId in room.PlayerIds.Where(id => id != player.PlayerId))
            //     {
            //         if (Connections.TryGetValue(otherId, out var other))
            //             await SendAsync(other, new OutMessage("garbage", payload));
            //     }
            //
            //     break;
            // }

            // case "gameOver":
            // {
            //     if (player.RoomId is null || !Rooms.TryGetValue(player.RoomId, out var room))
            //         break;
            //
            //     room.SetAlive(player.PlayerId, false);
            //     await BroadcastRoomStateAsync(room, ct);
            //
            //     // If only one player alive -> match end
            //     var alive = room.Players.Values.Count(p => p.Alive);
            //     if (room.InMatch && alive <= 1)
            //     {
            //         room.InMatch = false;
            //         var winnerId = room.Players.Values.FirstOrDefault(p => p.Alive)?.PlayerId;
            //
            //         await BroadcastAsync(room, new OutMessage("matchEnd", new { winnerId, t = DateTimeOffset.UtcNow }), ct);
            //
            //         // reset readiness for next match
            //         room.ResetReady();
            //         room.ResetAlive();
            //         await BroadcastRoomStateAsync(room, ct);
            //     }
            //     break;
            // }

            case "ping":
                await SendAsync(playerConnection, new OutMessage("pong", new { t = DateTimeOffset.UtcNow }));
                break;

            default:
                await SendAsync(playerConnection, new OutMessage("error", new { code = "unknown_type", type = msg.Type }));
                break;
        }
    }

    private async Task JoinRoomAsync(PlayerConnection player, Room room, CancellationToken ct)
    {
        // // Leave previous room
        // if (player.RoomId is not null)
        //     await LeaveRoomAsync(player, ct);
        //
        // room.AddPlayer(player.PlayerId);
        // player.RoomId = room.RoomId;
        //
        // await SendAsync(player, new OutMessage("joinedRoom", new { roomId = room.RoomId, mode = room.Mode, ruleset = room.Ruleset }));
        // await BroadcastRoomStateAsync(room, ct);
    }

    private async Task LeaveRoomAsync(PlayerConnection player, CancellationToken ct)
    {
        // if (player.RoomId is null) return;
        // if (!Rooms.TryGetValue(player.RoomId, out var room))
        // {
        //     player.RoomId = null;
        //     return;
        // }
        //
        // room.RemovePlayer(player.PlayerId);
        // var leftRoomId = player.RoomId;
        // player.RoomId = null;
        //
        // await SendAsync(player, new OutMessage("leftRoom", new { roomId = leftRoomId }));
        //
        // if (room.PlayerIds.Count == 0)
        // {
        //     Rooms.TryRemove(room.RoomId, out _);
        // }
        // else
        // {
        //     await BroadcastRoomStateAsync(room, ct);
        // }
    }

    public async Task DisconnectAsync(PlayerConnection playerConnection)
    {
        if (!RemoveConnection(playerConnection))
            return;

        // try
        // {
        //     if (player.RoomId is not null && Rooms.TryGetValue(player.RoomId, out var room))
        //     {
        //         room.RemovePlayer(playerId);
        //
        //         if (room.PlayerIds.Count == 0)
        //             Rooms.TryRemove(room.RoomId, out _);
        //         else
        //             await BroadcastRoomStateAsync(room, CancellationToken.None);
        //     }
        // }
        // catch { /* ignore */ }

        try
        {
            if (playerConnection.Socket.State == WebSocketState.Open 
                || playerConnection.Socket.State == WebSocketState.CloseReceived)
                await playerConnection.Socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "bye", CancellationToken.None);
        }
        catch { /* ignore */ }
    }

    private async Task TryStartMatchAsync(Room room, CancellationToken ct)
    {
        // if (room.InMatch) return;
        // if (room.PlayerIds.Count < 2) return;
        //
        // var allReady = room.Players.Values.All(p => p.Ready);
        // if (!allReady) return;
        //
        // room.InMatch = true;
        // room.ResetAlive();
        //
        // // Seed and coordinated start time
        // var seed = RandomNumberGenerator.GetInt32(int.MinValue, int.MaxValue);
        // var startAt = DateTimeOffset.UtcNow.AddSeconds(2);
        //
        // await BroadcastAsync(room, new OutMessage("matchStart", new
        // {
        //     seed,
        //     startAt,
        //     rules = new { room.Mode, room.Ruleset }
        // }), ct);
        //
        // await BroadcastRoomStateAsync(room, ct);
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
        Console.WriteLine("Broadcast room state: " + room.RoomId + ", " + string.Join(",", snapshot.Select(x => x.playerId)));
    }

    private async Task BroadcastAsync(Room room, OutMessage msg, CancellationToken ct)
    {
        // foreach (var pid in room.PlayerIds)
        // {
        //     if (Connections.TryGetValue(pid, out var p))
        //     {
        //         await SendAsync(p, msg);
        //     }
        //         
        // }
    }

    public async Task SendAsync(WebSocket socket, OutMessage msg)
    {
        if (socket.State != WebSocketState.Open)
            return;

        var json = JsonSerializer.Serialize(msg, JsonOptions.Instance);
        var bytes = Encoding.UTF8.GetBytes(json);
        await socket.SendAsync(bytes, WebSocketMessageType.Text, true, CancellationToken.None);
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
    
    public async Task ShutdownAsync()
    {
        try
        {
            Console.WriteLine($"[Server] Closing {PlayerConnections.Count} client(s) ...");

            // Snapshot to avoid concurrent modification issues
            var ids = PlayerConnections.ToArray();

            foreach (var id in ids)
            {
                try
                {
                    await DisconnectAsync(id);
                }
                catch { /* best effort */ }
            }

            Console.WriteLine("[Server] All clients closed.");
        }
        catch (Exception ex)
        {
            Console.WriteLine("[Server] ShutdownAsync error: " + ex);
        }
    }
}