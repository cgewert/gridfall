namespace GridfallServer.Rooms;

public class Lobby: Room
{
    public Lobby() : base(RoomType.Lobby)
    {
        MaxPlayers = int.MaxValue;
        RoomName = "Lobby";
        RoomDescription = "Lobby for all Gridfall players currently not in a custom room.";
    }
}