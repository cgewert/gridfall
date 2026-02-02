namespace GridfallServer.Rooms;

public class Ascent: Room
{
    public Ascent(string roomName, string description = "A room for a match of Ascent") : base(RoomType.Ascent)
    {
        RoomName = roomName;
        RoomDescription = description;
    }
}