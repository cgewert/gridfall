namespace GridfallServer.Rooms;

public class Infinity: Room
{
    public Infinity(string roomName, string description = "A room for a match of Infinity") : base(RoomType.Ascent)
    {
        RoomName = roomName;
        RoomDescription = description;
    }
}