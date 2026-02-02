namespace GridfallServer.Rooms;

public class Rush: Room
{
    public Rush(string roomName, string description = "A room for a match of Rush") : base(RoomType.Rush)
    {
        RoomName = roomName;
        RoomDescription = description;
    }
}