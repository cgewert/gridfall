import { t } from "i18next";
import { GridfallNetClient } from "../net/GridfallNetClient";
import { NetEvents } from "../net/NetEvents";
import { RoomStatePayload } from "../net/types";
import Phaser from "phaser";
import { MenuList } from "../ui/menu/MenuList";
import { GameMode } from "../game";

export class LobbyScene extends Phaser.Scene {
  private net!: GridfallNetClient;
  private playerText!: Phaser.GameObjects.Text;
  private menu!: MenuList;

  constructor() {
    super({ key: "LobbyScene" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#070b14");

    this.net = this.registry.get("net") as GridfallNetClient;

    this.add.text(20, 20, "Lobby", {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "28px",
      color: "#ffffff",
    });

    this.add
      .rectangle(20, 70, 320, this.scale.height - 100, 0x101a33, 0.9)
      .setOrigin(0, 0);

    this.add.text(40, 85, t("multiplayer.connectedPlayers"), {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "18px",
      color: "#aaccff",
    });

    this.playerText = this.add.text(40, 120, "-", {
      fontFamily: "Consolas, monospace",
      fontSize: "16px",
      color: "#ffffff",
      lineSpacing: 6,
    });

    this.menu = new MenuList(this, {
      x: this.scale.width / 2,
      y: this.scale.height / 2,
      gap: 64,
      onMoveSoundKey: "ui-move",
      onChooseSoundKey: "ui-choose",
      items: [
        {
          identifier: "mnu-ascent",
          label: "Ascent",
          translatable: false,
          disabled: false,
          description: t("descriptions.mnu-ascent"),
          action: () => {
            this.scene.start("GameScene", {
              gameMode: GameMode.ASCENT,
            });
          },
        },
      ],
    });

    // Back to menu
    const back = this.add
      .text(this.scale.width - 20, 20, "ESC: " + t("labels.back"), {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#cccccc",
      })
      .setOrigin(1, 0);

    this.input.keyboard?.on("keydown-ESC", () => {
      // keep connection open? for now: disconnect and go back
      try {
        this.net.disconnect();
      } catch {}
      this.scene.start("MainMenuScene");
    });

    this.updatePlayersList(null);

    // Event listeners
    this.game.events.on(NetEvents.roomState, this.updatePlayersList, this);
    this.game.events.on(NetEvents.disconnected, this.onDisconnect, this);

    // Cleanup on shutdown
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(NetEvents.roomState, this.updatePlayersList, this);
      this.game.events.off(NetEvents.disconnected, this.onDisconnect, this);
    });
  }

  private updatePlayersList(data: RoomStatePayload | null): void {
    if (!data) {
      const players = (this.net.RoomPlayerList ?? []) as Array<string>;
      if (players.length === 0) {
        this.playerText.setText("-");
        return;
      }

      const lines = players.map((p) => {
        const you = p === this.net.Player?.friendId ? " (you)" : "";
        return `• ${p}${you}`;
      });

      this.playerText.setText(lines.join("\n"));
      return;
    } else {
      const players = data.players;
      if (players.length === 0) {
        this.playerText.setText("-");
        return;
      }
      const lines = players.map((p) => {
        const you = p.playerId === this.net.Player?.friendId ? " (you)" : "";
        return `• ${p.playerId}${you}`;
      });

      this.playerText.setText(lines.join("\n"));
    }
  }

  private onDisconnect(): void {
    const disconnectText = this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2,
        t("errors.connectionLost"),
        {
          fontFamily: "Orbitron, sans-serif",
          fontSize: "32px",
          color: "#ff4444",
        },
      )
      .setOrigin(0.5)
      .setDepth(9999);
    this.time.delayedCall(3000, () => {
      disconnectText.destroy();
      this.scene.start("MainMenuScene");
    });
  }
}
