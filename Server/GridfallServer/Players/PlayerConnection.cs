using System.Net.WebSockets;
using GridfallServer.Rooms;

namespace GridfallServer.Players;

internal sealed class PlayerConnection
{
    public PlayerConnection(WebSocket socket)
    {
        Socket = socket;
    }

    public PlayerConnection(Player player, WebSocket socket)
    {
        Player = player;
        Socket = socket;
    }

    public Player? Player { get; set; }
    public WebSocket Socket { get; }
    public IRoom Room { get; set; } = new Lobby();

    // Prevent parallel sends on one socket (WebSockets don't like that)
    public SemaphoreSlim SendLock { get; } = new(1, 1);
}