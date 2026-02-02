import { t } from "i18next";
import { GridfallNetClient } from "../net/GridfallNetClient";
import { NetEvents } from "../net/NetEvents";
import { ConnectingIndicator } from "../ui/net/ConnectingIndicator";
import { Game } from "..";
import pkg from "../../package.json";
import {
  ClientMessage,
  LoginCredentials,
  LoginMessagePayload,
  Player,
} from "../net/types";

export class ConnectScene extends Phaser.Scene {
  private net!: GridfallNetClient;
  private indicator!: ConnectingIndicator;
  private statusText!: Phaser.GameObjects.Text;
  private escHintText!: Phaser.GameObjects.Text;
  private loginContainer?: HTMLDivElement;
  private usernameInput?: HTMLInputElement;
  private passwordInput?: HTMLInputElement;
  private loginError?: HTMLDivElement;
  private loginTimeout?: Phaser.Time.TimerEvent;
  private isLoginAttempt = false;
  private readonly loginCaptureKeys = [
    Phaser.Input.Keyboard.KeyCodes.UP,
    Phaser.Input.Keyboard.KeyCodes.DOWN,
    Phaser.Input.Keyboard.KeyCodes.LEFT,
    Phaser.Input.Keyboard.KeyCodes.RIGHT,
    Phaser.Input.Keyboard.KeyCodes.SPACE,
    Phaser.Input.Keyboard.KeyCodes.Z,
    Phaser.Input.Keyboard.KeyCodes.X,
    Phaser.Input.Keyboard.KeyCodes.R,
    Phaser.Input.Keyboard.KeyCodes.C,
    Phaser.Input.Keyboard.KeyCodes.ESC,
    Phaser.Input.Keyboard.KeyCodes.P,
  ];
  private loginHandlers?: {
    onLoginOk: (data: any) => void;
    onLoginFailed: (data?: { message?: string }) => void;
  };

  constructor() {
    super({ key: "ConnectScene" });
  }

  public static getWsUrl(): string {
    const scheme = window.location.protocol === "https:" ? "wss:" : "ws:";
    const isDev = process.env.NODE_ENV !== "production";
    const host = isDev ? "localhost" : Game.SERVER_IP;
    console.debug(
      "Connecting to Gridfall Server:  ",
      `${scheme}//${host}:${Game.SERVER_PORT}/ws`,
    );

    return `${scheme}//${host}:${Game.SERVER_PORT}/ws`;
  }

  public create() {
    this.cameras.main.setBackgroundColor("#0b1020");

    this.indicator = new ConnectingIndicator(
      this,
      this.scale.width / 2,
      this.scale.height / 2,
      t("multiplayer.connecting"),
    ).setVisible(false);
    this.statusText = this.add
      .text(this.scale.width / 2, this.scale.height / 2 + 80, "", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffcccc",
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.escHintText = this.add
      .text(
        this.scale.width / 2,
        this.scale.height - 28,
        `ESC: ${t("labels.back")}`,
        {
          fontFamily: "Arial",
          fontSize: "16px",
          color: "#cccccc",
        },
      )
      .setOrigin(0.5, 1);

    if (this.registry.has("net")) {
      this.net = this.registry.get("net") as GridfallNetClient;
    } else {
      this.net = new GridfallNetClient(this.game);
      this.registry.set("net", this.net);
    }

    this.buildLoginUi();

    // Directly proceed if already connected
    if (this.net.Player) {
      this.onConnectionEstablished(this.net.Player);
    }

    this.input.keyboard?.on("keydown-ESC", () => {
      if (this.isLoginAttempt) return;
      this.clearLoginWaiters();
      this.destroyLoginUi();
      try {
        this.net.disconnect();
      } catch {}
      this.scene.start("MainMenuScene");
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.loginTimeout?.remove(false);
      this.destroyLoginUi();
    });
  }

  private tryLogin(url: string, credentials: LoginCredentials) {
    this.statusText.setText("");
    this.statusText.setVisible(true);

    const sendLoginMessage = () => {
      // A server connection was established, now send login message
      const data: LoginMessagePayload = {
        username: credentials.username,
        password: credentials.password,
        clientVersion: pkg.version,
      };
      const loginMessage: ClientMessage = {
        type: "login",
        data,
      };
      this.net.send(loginMessage.type, loginMessage.data);

      const onLoginOk = (data: Player) => {
        // Login successful
        this.clearLoginWaiters();
        // All logged in players join the global lobby by default
        this.net.createRoom("vs", "lobby");
        this.onConnectionEstablished(data);
      };

      const onLoginFailed = (data?: { message?: string }) => {
        // Login attempt failed
        this.clearLoginWaiters();
        const message =
          data?.message ?? t("errors.loginFailed") ?? "Login failed";
        this.showLoginUi(message);
      };

      this.loginHandlers = { onLoginOk, onLoginFailed };
      this.game.events.once(NetEvents.welcome, onLoginOk, this);
      this.game.events.once(NetEvents.loginOk, onLoginOk, this);
      this.game.events.once(NetEvents.loginFailed, onLoginFailed, this);
      this.game.events.once(NetEvents.disconnected, onLoginFailed, this);

      this.loginTimeout = this.time.delayedCall(10000, () => {
        if (!this.scene.isActive()) return;
        onLoginFailed({ message: t("errors.failedToConnect") });
      });
    };

    if (!this.net.IsConnected) {
      this.net
        .connect(url)
        .then(() => sendLoginMessage())
        .catch(() => {
          this.showLoginUi(t("errors.failedToConnect"));
        });
    } else sendLoginMessage();
  }

  private clearLoginWaiters() {
    if (this.loginHandlers) {
      const { onLoginOk, onLoginFailed } = this.loginHandlers;
      this.game.events.off(NetEvents.welcome, onLoginOk, this);
      this.game.events.off(NetEvents.loginOk, onLoginOk, this);
      this.game.events.off(NetEvents.loginFailed, onLoginFailed, this);
      this.game.events.off(NetEvents.disconnected, onLoginFailed, this);
      this.loginHandlers = undefined;
    }
    this.loginTimeout?.remove(false);
    this.loginTimeout = undefined;
  }

  private showLoginUi(errorMessage?: string) {
    try {
      this.net.disconnect();
    } catch {}

    this.indicator.setVisible(false);
    this.statusText.setVisible(false);
    this.statusText.setText("");
    this.escHintText.setVisible(true);
    this.isLoginAttempt = false;

    if (this.loginError) {
      this.loginError.textContent = errorMessage ?? "";
      this.loginError.style.display = errorMessage ? "block" : "none";
    }
    if (this.loginContainer) {
      this.loginContainer.style.display = "flex";
    }
    if (this.usernameInput) {
      setTimeout(() => this.usernameInput?.focus(), 0);
    }
  }

  private showConnectingUi() {
    if (this.loginContainer) {
      this.loginContainer.style.display = "none";
    }
    this.indicator.setVisible(true);
    this.statusText.setVisible(true);
    this.escHintText.setVisible(false);
    this.isLoginAttempt = true;
  }

  private buildLoginUi() {
    this.input.keyboard?.removeCapture(this.loginCaptureKeys);

    const host = document.getElementById("canvas-container") ?? document.body;
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "0";
    container.style.top = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    container.style.pointerEvents = "auto";

    const panel = document.createElement("div");
    panel.style.minWidth = "320px";
    panel.style.padding = "24px 28px";
    panel.style.borderRadius = "10px";
    panel.style.background = "rgba(10, 18, 36, 0.95)";
    panel.style.border = "1px solid #20335a";
    panel.style.boxShadow = "0 6px 24px rgba(0, 0, 0, 0.45)";
    panel.style.display = "flex";
    panel.style.flexDirection = "column";
    panel.style.gap = "12px";
    panel.style.fontFamily = "Orbitron, sans-serif";
    panel.style.color = "#ffffff";

    const title = document.createElement("div");
    title.textContent = t("multiplayer.login") ?? "Login";
    title.style.fontSize = "20px";

    const username = document.createElement("input");
    username.type = "text";
    username.placeholder = t("labels.username") ?? "Username";
    username.autocomplete = "off";
    username.autocorrect = false;
    username.autocapitalize = "none";
    username.spellcheck = false;
    username.style.padding = "10px 12px";
    username.style.borderRadius = "6px";
    username.style.border = "1px solid #2e3e66";
    username.style.background = "#0b1226";
    username.style.color = "#ffffff";
    username.style.fontSize = "14px";
    username.autofocus = true;

    const password = document.createElement("input");
    password.type = "password";
    password.placeholder = t("labels.password") ?? "Password";
    password.autocomplete = "off";
    password.autocorrect = false;
    password.autocapitalize = "none";
    password.spellcheck = false;
    password.style.padding = "10px 12px";
    password.style.borderRadius = "6px";
    password.style.border = "1px solid #2e3e66";
    password.style.background = "#0b1226";
    password.style.color = "#ffffff";
    password.style.fontSize = "14px";

    const error = document.createElement("div");
    error.style.color = "#ff8888";
    error.style.fontSize = "12px";
    error.style.display = "none";

    const button = document.createElement("button");
    button.textContent = t("labels.login") ?? "Login";
    button.style.padding = "10px 12px";
    button.style.borderRadius = "6px";
    button.style.border = "none";
    button.style.background = "#2a65ff";
    button.style.color = "#ffffff";
    button.style.fontSize = "14px";
    button.style.cursor = "pointer";

    const submit = () => {
      const usernameValue = username.value.trim();
      const passwordValue = password.value;
      if (!usernameValue || !passwordValue) {
        error.textContent =
          t("errors.missingCredentials") ??
          "Please enter username and password.";
        error.style.display = "block";
        return;
      }
      error.textContent = "";
      error.style.display = "none";
      this.showConnectingUi();
      const url = ConnectScene.getWsUrl();
      this.tryLogin(url, {
        username: usernameValue,
        password: passwordValue,
      });
    };

    button.addEventListener("click", submit);
    password.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter") submit();
    });

    panel.appendChild(title);
    panel.appendChild(username);
    panel.appendChild(password);
    panel.appendChild(error);
    panel.appendChild(button);
    container.appendChild(panel);
    host.appendChild(container);

    this.loginContainer = container;
    this.usernameInput = username;
    this.passwordInput = password;
    this.loginError = error;
    setTimeout(() => this.usernameInput?.focus(), 0);
  }

  private destroyLoginUi() {
    this.input.keyboard?.addCapture(this.loginCaptureKeys);
    if (this.loginContainer?.parentElement) {
      this.loginContainer.parentElement.removeChild(this.loginContainer);
    }
    this.loginContainer = undefined;
    this.usernameInput = undefined;
    this.passwordInput = undefined;
    this.loginError = undefined;
  }

  private onConnectionEstablished(data: Player) {
    this.scene.start("LobbyScene", data);
  }
}
