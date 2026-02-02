import { NetEvents } from "./NetEvents";
import { Player, RoomInfo } from "./types";

export type InMessage<T = any> = {
  type: string;
  data?: T;
};

export type OutMessage<T = any> = {
  type: string;
  data?: T;
};

export class GridfallNetClient {
  private _ws?: WebSocket;
  private _player: Player | null = null;
  private _room: RoomInfo | null = null;
  private _isConnected = false;

  public constructor(private _game: Phaser.Game) {}

  public get IsConnected(): boolean {
    return this._isConnected;
  }

  public get Player(): Player | null {
    return this._player;
  }

  public get RoomId(): string | null {
    return this._room?.roomId ?? null;
  }

  public get RoomPlayerList(): string[] {
    return this._room?.currentPlayers ?? [];
  }

  /** Connect to ws://host:port/ws (or wss://...) */
  connect(url: string): Promise<void> {
    if (
      this._ws &&
      (this._ws.readyState === WebSocket.OPEN ||
        this._ws.readyState === WebSocket.CONNECTING)
    ) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      this._ws = ws;

      ws.onopen = () => {
        this._isConnected = true;
        resolve();
      };

      ws.onerror = (ev) => {
        this._isConnected = false;
        reject(ev);
      };

      ws.onclose = () => {
        this._isConnected = false;
        this._player = null;
        this._room = null;
        this.emit("disconnected", {});
      };

      ws.onmessage = (evt) => {
        this.handleMessage(evt.data);
      };
    });
  }

  disconnect(): void {
    if (!this._ws) return;
    try {
      this._ws.close();
    } catch {
      /* ignore */
    }
    this._ws = undefined;
    this._isConnected = false;
  }

  /** Send typed message */
  send<T = any>(type: string, data?: T): void {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) return;

    const msg: OutMessage<T> = { type, data };
    this._ws.send(JSON.stringify(msg));
  }

  hello(clientVersion: string): void {
    this.send("hello", { clientVersion });
  }

  createRoom(mode: "vs" | string = "vs", room: string): void {
    this.send("createRoom", { mode, room });
  }

  joinRoom(roomId: string): void {
    this.send("joinRoom", { roomId });
  }

  leaveRoom(): void {
    this.send("leaveRoom", {});
    this._room = null;
  }

  ready(): void {
    this.send("ready", {});
  }

  unready(): void {
    this.send("unready", {});
  }

  attack(
    lines: number,
    meta?: { b2b?: boolean; combo?: number; tspin?: boolean },
  ): void {
    this.send("attack", { lines, meta, t: Date.now() });
  }

  gameOver(): void {
    this.send("gameOver", { t: Date.now() });
  }

  ping(): void {
    this.send("ping", {});
  }

  // -------- internals --------

  private handleMessage(payload: any): void {
    let msg: any;
    try {
      msg = JSON.parse(payload);
    } catch {
      console.error("[NetClient] Could not parse server message: ", payload);
      return;
    }

    if (!msg?.type) return;

    // Capture Server messages and emit phaser events for subscribers
    switch (msg.type) {
      case "welcome":
        const welcomeMessage = msg.data ?? null;
        console.debug(
          `[NetClient] Server sends Welcome message: ${welcomeMessage}`,
        );
        break;
      case "loginOk":
        const loginOkData = msg.data as Player;
        this._player = loginOkData;
        if (this._player) {
          console.debug(
            `[NetClient] Login successful for player ${this._player.nickname}`,
          );
          this._isConnected = true;
        } else {
          console.warn(
            `[NetClient] LoginOk received but no player data present.`,
          );
          this._isConnected = false;
          this.emit("loginFailed", loginOkData);
        }
        break;
      case "loginFailed":
        const loginFailedData = msg.data;
        console.debug(
          `[NetClient] Login failed for player ${JSON.stringify(loginFailedData)}`,
        );
        this._isConnected = false;
        break;
      case "joinedRoom":
        this._room = msg.data ?? null;
        console.debug(
          `[NetClient] Player ${this.Player} joined room ${this._room}`,
        );
        break;
      case "leftRoom":
        this._room = null;
        console.debug(
          `[NetClient] Player ${this.Player} left room ${this._room}`,
        );
        break;
      case "roomState":
        console.debug("[NetClient] Received roomstate for room: ", msg.data);
        // TODO: Fill this.room with data
        break;
      case "roomCreated":
        // server sends roomCreated after createRoom; joinedRoom comes too
        // keep roomId also from roomCreated for safety
        this._room = msg.data?.roomId ?? this._room;
        console.debug(`[NetClient] Room created: ${this._room}`);
        break;
      case "disconnected":
        console.debug(`[NetClient] Player ${this.Player} disconnected`);
        break;
      default:
        console.warn("[NetClient] Unhandled server message type: ", msg.type);
        break;
    }

    this.emit(msg.type, msg.data);
  }

  /**
   *  Emit a network event to the Phaser event system.
   * @param type A string specifying the message type.
   * @param data Arbitrary data linked to the message.
   */
  private emit(type: string, data: any): void {
    let eventName = NetEvents[type as keyof typeof NetEvents];
    console.debug("[NetClient] emits Server message: ", eventName);
    this._game.events.emit(eventName, data);
  }
}
