export type InMessage<T = any> = {
  type: string;
  data?: T;
};

export type OutMessage<T = any> = {
  type: string;
  data?: T;
};

type Handler = (data: any, raw: InMessage) => void;

export class GridfallNetClient {
  private ws?: WebSocket;
  private handlers = new Map<string, Set<Handler>>();

  public playerId: string | null = null;
  public roomId: string | null = null;
  public isConnected = false;

  /** Connect to ws://host:port/ws (or wss://...) */
  connect(url: string): Promise<void> {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        this.isConnected = true;
        resolve();
      };

      ws.onerror = (ev) => {
        reject(ev);
      };

      ws.onclose = () => {
        this.isConnected = false;
        this.playerId = null;
        this.roomId = null;
        this.emitLocal("disconnected", {});
      };

      ws.onmessage = (evt) => {
        this.handleMessage(evt.data);
      };
    });
  }

  disconnect(): void {
    if (!this.ws) return;
    try {
      this.ws.close();
    } catch {
      /* ignore */
    }
    this.ws = undefined;
  }

  /** Subscribe to server message type */
  on(type: string, handler: Handler): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler);

    return () => {
      this.handlers.get(type)!.delete(handler);
    };
  }

  /** Send typed message */
  send<T = any>(type: string, data?: T): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const msg: OutMessage<T> = { type, data };
    this.ws.send(JSON.stringify(msg));
  }

  // Convenience API (matches the server skeleton)
  hello(clientVersion: string): void {
    this.send("hello", { clientVersion });
  }

  createRoom(
    mode: "vs" | string = "vs",
    ruleset: "modern" | string = "modern",
  ): void {
    this.send("createRoom", { mode, ruleset });
  }

  joinRoom(roomId: string): void {
    this.send("joinRoom", { roomId });
  }

  leaveRoom(): void {
    this.send("leaveRoom", {});
    this.roomId = null;
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
    let msg: InMessage | null = null;

    try {
      msg = JSON.parse(payload) as InMessage;
    } catch {
      return;
    }

    if (!msg || typeof msg.type !== "string") return;

    // capture a few common states
    if (msg.type === "welcome") {
      this.playerId = msg.data?.playerId ?? null;
    }
    if (msg.type === "joinedRoom") {
      this.roomId = msg.data?.roomId ?? null;
    }
    if (msg.type === "leftRoom") {
      this.roomId = null;
    }
    if (msg.type === "roomCreated") {
      // server sends roomCreated after createRoom; joinedRoom comes too
      // keep roomId also from roomCreated for safety
      this.roomId = msg.data?.roomId ?? this.roomId;
    }

    this.emit(msg.type, msg.data, msg);
  }

  private emit(type: string, data: any, raw: InMessage): void {
    const set = this.handlers.get(type);
    if (!set || set.size === 0) return;
    for (const h of set) {
      try {
        h(data, raw);
      } catch {
        /* ignore handler errors */
      }
    }
  }

  private emitLocal(type: string, data: any): void {
    // for local events like "disconnected"
    this.emit(type, data, { type, data });
  }
}
