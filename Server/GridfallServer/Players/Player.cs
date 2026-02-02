namespace GridfallServer.Players;

public enum PlayerStatus
{
    Connected,
    Disconnected,
    InLobby,
    InCustomRoom,
    InMatch,
    Spectating,
}

public sealed class Player
{
    private PlayerStatus _status;
    public string PlayerId { get; }
    public string Nickname { get; private set; }
    public int Discriminator { get; }
    public string FriendId => $"{Nickname}#{Discriminator:D3}";

    public PlayerStatus Status
    {
        get => _status;
        set{
            _status = value;
            switch (value)
            {
                case PlayerStatus.Connected:
                    ConnectedAtUtc = DateTimeOffset.UtcNow;
                    LastSeenUtc = DateTimeOffset.MinValue;
                    break;
                case PlayerStatus.Disconnected:
                    LastSeenUtc = DateTimeOffset.UtcNow;
                    ConnectedAtUtc = DateTimeOffset.MinValue;
                    break;
            }
        }
    }

    public DateTimeOffset ConnectedAtUtc { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset LastSeenUtc { get; private set; } = DateTimeOffset.UtcNow;
    public bool Ready { get; set; } = false;
    public bool Alive { get; set; } = true;
    public bool IsBanned { get; set; } = false;
    public bool IsMuted { get; set; } = false;
    public bool IsPremium { get; set; } = false;

    public Player(string playerId, string nickname, int discriminator)
    {
        PlayerId = playerId;
        Nickname = SanitizeNickname(nickname);
        Discriminator = discriminator;
        Status = PlayerStatus.Disconnected;
    }

    public void SetNickname(string nickname)
    {
        Nickname = SanitizeNickname(nickname);
    }

    private static string SanitizeNickname(string s)
    {
        s = (s ?? "").Trim();
        switch (s.Length)
        {
            case 0:
                return "Player";
            case > 16:
                s = s[..16];
                break;
        }

        return s;
    }
}
