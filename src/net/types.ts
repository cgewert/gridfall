export enum PlayerStatus {
  Connected,
  Disconnected,
  InLobby,
  InCustomRoom,
  InMatch,
  Spectating,
}

export type Player = {
  playerId: string;
  nickname: string;
  discriminator: string;
  friendId: string;
  status: PlayerStatus;
  connectedAtUtc: string;
  lastSeenUtc: string;
  ready: boolean;
  alive: boolean;
  isBanned: boolean;
  isMuted: boolean;
  isPremium: boolean;
};

export type RoomInfo = {
  roomId: string;
  roomName: string;
  roomType: "ascent" | "rush" | "infinity";
  minPlayers: number;
  maxPlayers: number;
  currentPlayers: string[];
  isPrivate: boolean;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

export type RoomStatePayload = {
  roomId: string;
  status: "lobby" | "in_match";
  players: Array<Player>;
};

export type LoginMessagePayload = LoginCredentials & {
  clientVersion: string;
};

export type ClientMessage = { type: "login"; data: LoginMessagePayload };
