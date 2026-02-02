using System.Collections.Concurrent;
using GridfallServer.Players;

namespace GridfallServer.Rooms;

public abstract class Room : IRoom
{
    protected Room(RoomType roomType, int minPlayers = 1, int maxPlayers = 2)
    {
        RoomType = roomType;
    }

    public string RoomId { get; } = Guid.NewGuid().ToString();
    public string RoomName { get; set; } = string.Empty;
    public string RoomDescription { get; set; } = string.Empty;
    public RoomType RoomType { get; set; }
    public int MinPlayers { get; set; } = 1;
    public int MaxPlayers { get; set; } = 2;
    public ConcurrentDictionary<string, Player> Players { get; set; } = new();
    public List<string> PlayerList => Players.Values.Select(x => x.Nickname).ToList();
    public bool IsPrivate { get; set; } = false;
    public bool InMatch { get; set; }
    public void AddPlayer(Player player)
    {
        player.Status = PlayerStatus.InCustomRoom;
        player.Alive = true;
        player.Ready = false;
        Players[player.PlayerId] = player;
    }
    
    public void RemovePlayer(string playerId)
    {
        Players.TryRemove(playerId, out _);
        
        // TODO: Check what to do in case of player leaves
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