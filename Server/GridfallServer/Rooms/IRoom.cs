using System.Collections.Concurrent;
using GridfallServer.Players;

namespace GridfallServer.Rooms;

public enum RoomType
{
    Ascent,
    Rush,
    Infinity,
    Lobby
}

public interface IRoom
{
    public string RoomId { get; }
    public string RoomName { get; }
    public string RoomDescription { get; set; }
    public RoomType RoomType { get; set; }
    public int MinPlayers { get; set; }
    public int MaxPlayers { get; set; }
    public ConcurrentDictionary<string, Player> Players { get; set; }
    public bool IsPrivate { get; set; }
    public bool InMatch { get; set; }
    
    public void AddPlayer(Player player);
    public void RemovePlayer(string playerId);
    public void SetReady(string playerId, bool ready);
    public void SetAlive(string playerId, bool alive);
    public void ResetReady();
    public void ResetAlive();
}