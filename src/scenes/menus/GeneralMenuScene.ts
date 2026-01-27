// src/scenes/menus/GeneralMenuScene.ts
import { BaseMenuScene } from "../../ui/menu/BaseMenu";
import { LanguageSettings, LOCALE_NAME } from "../../services/LanguageSettings";
import { SpawnSettings } from "../../services/SpawnSettings";
import { SPAWN_LABEL } from "../../spawn";
import { t } from "i18next";
import { SkinId, SkinSettings } from "../../services/SkinSettings";
import { SHAPE_TO_BLOCKSKIN_FRAME, SKIN_LABEL } from "../../shapes";
import { DEFAULT_MENU_FONT } from "../../fonts";

export class GeneralMenuScene extends BaseMenuScene {
  public static readonly KEY = "GeneralMenuScene";
  public static readonly HINT = "hints.mnu-general";

  private textLanguage!: Phaser.GameObjects.Text;
  private preview!: Phaser.GameObjects.Container;
  private previewBox!: Phaser.GameObjects.Rectangle;

  private entries: {
    label: Phaser.GameObjects.Text;
    value: Phaser.GameObjects.Text;
    bg: Phaser.GameObjects.Rectangle;
    cx: number;
    cy: number;
    w: number;
    h: number;
  }[] = [];

  private activeIndex = 0;

  // keyboard handler-refs
  private onUp!: () => void;
  private onDown!: () => void;
  private onLeft!: () => void;
  private onRight!: () => void;
  private onEsc!: () => void;

  public constructor() {
    super(GeneralMenuScene.KEY, "labels.mnu-general");
  }

  public create(data: { parentKey?: string } = {}): void {
    super.create(data);

    this.addLanguageRow(0, -20);
    this.addSkinRow(1, 60);
    this.addSpawnRow(2, 140, 560);
    this.setActiveIndex(0);

    // Keyboard
    const k = this.input.keyboard!;
    this.onUp = () => this.setActiveIndex(this.activeIndex - 1);
    this.onDown = () => this.setActiveIndex(this.activeIndex + 1);
    this.onLeft = () => this.onChange(-1);
    this.onRight = () => this.onChange(+1);
    this.onEsc = () => this.close();

    k.on("keydown-UP", this.onUp);
    k.on("keydown-DOWN", this.onDown);
    k.on("keydown-LEFT", this.onLeft);
    k.on("keydown-RIGHT", this.onRight);

    // TODO: Gamepad input will be supported later
    // this.input.gamepad?.on("down", this.onPadDown, this);

    this.buildPreviewArea(this.modal.width / 2, this.modal.height / 2);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);

    this.refreshPreview();
  }

  private addLanguageRow(idx: number, y: number) {
    const cx = 0,
      w = 560,
      h = 48;

    const bg = this.add
      .rectangle(cx, y, w, h, 0xffffff, 0.06)
      .setOrigin(0.5)
      .setStrokeStyle(1, 0x00ffff, 0.6);
    this.textLanguage = this.add
      .text(cx - w / 2 + 14, y, t("labels.settings.language"), {
        fontFamily: DEFAULT_MENU_FONT,
        fontSize: "22px",
        color: "#9ad",
      })
      .setOrigin(0, 0.5);
    const val = LOCALE_NAME[LanguageSettings.get()];
    const value = this.add
      .text(cx + w / 2 - 14, y, val, {
        fontFamily: DEFAULT_MENU_FONT,
        fontSize: "22px",
        color: "#cfefff",
      })
      .setOrigin(1, 0.5);

    bg.setInteractive({ useHandCursor: true });
    // TODO: Mouse controls will be supported maybe later
    // bg.on("pointerdown", (p: Phaser.Input.Pointer) => {
    //   this.setActiveIndex(idx);
    //   if (p.x < this.cameras.main.centerX) this.changeLanguage(-1);
    //   else this.changeLanguage(+1);
    // });

    this.modal.add([bg, this.textLanguage, value]);
    this.entries.push({ label: this.textLanguage, value, bg, cx, cy: y, w, h });
  }

  /**
   * Add spawn system selection row
   * @param idx: Entry index
   * @param y: Y position inside modal container
   * @param w: Width of the row
   */
  private addSpawnRow(idx: number, y: number, w: number) {
    const cx = 0,
      h = 48;
    const bg = this.add
      .rectangle(cx, y, w, h, 0xffffff, 0.06)
      .setOrigin(0.5)
      .setStrokeStyle(1, 0x00ffff, 0.6);
    const label = this.add
      .text(cx - w / 2 + 14, y, "Spawn System", {
        fontFamily: DEFAULT_MENU_FONT,
        fontSize: "22px",
        color: "#9ad",
      })
      .setOrigin(0, 0.5);
    const value = this.add
      .text(cx + w / 2 - 14, y, SPAWN_LABEL[SpawnSettings.get()], {
        fontFamily: DEFAULT_MENU_FONT,
        fontSize: "22px",
        color: "#cfefff",
      })
      .setOrigin(1, 0.5);

    // Currently only keyboard input is supported for this menu

    // bg.setInteractive({ useHandCursor: true });
    // bg.on("pointerdown", (p: Phaser.Input.Pointer) => {
    //   this.setActiveIndex(idx);
    //   if (p.x < this.cameras.main.centerX) this.prevSpawn();
    //   else this.nextSpawn();
    // });

    this.modal.add([bg, label, value]);
    this.entries.push({ label, value, bg, cx, cy: y, w, h });
  }

  private setActiveIndex(i: number) {
    if (!this.entries.length) return;
    this.activeIndex = (i + this.entries.length) % this.entries.length;

    this.entries.forEach((e, idx) => {
      const focused = idx === this.activeIndex;
      e.bg.setStrokeStyle(focused ? 2 : 1, 0x00ffff, focused ? 1.0 : 0.6);
      e.bg.setScale(focused ? 1.02 : 1.0);
      e.label.setStyle({ color: focused ? "#cfefff" : "#9ad" });
    });
  }

  private onChange(dir: -1 | 1) {
    // index 0 = Language; 1 = Skin; 2 = Spawn System
    if (this.activeIndex === 0) this.changeLanguage(dir);
    else if (this.activeIndex === 1) {
      if (dir < 0) this.prevSkin();
      else this.nextSkin();
    } else if (this.activeIndex === 2) {
      if (dir < -1) this.prevSpawnSystem();
      else this.nextSpawnSystem();
    }
  }

  /**
   * Change to previous spawn system
   */
  private prevSpawnSystem() {
    SpawnSettings.prev();
    const e = this.entries[2];
    e.value.setText(SPAWN_LABEL[SpawnSettings.get()]);
    this.tweens.add({
      targets: e.value,
      scale: 1.06,
      duration: 80,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  /**
   * Change to next spawn system
   */
  private nextSpawnSystem() {
    SpawnSettings.next();
    const e = this.entries[2];
    e.value.setText(SPAWN_LABEL[SpawnSettings.get()]);
    this.tweens.add({
      targets: e.value,
      scale: 1.06,
      duration: 80,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  private changeLanguage(dir: -1 | 1) {
    if (dir < 0) LanguageSettings.prev();
    else LanguageSettings.next();
    const e = this.entries[0];
    e.value.setText(LOCALE_NAME[LanguageSettings.get()]);
    this.tweens.add({
      targets: e.value,
      scale: 1.06,
      duration: 80,
      yoyo: true,
      ease: "Quad.easeOut",
    });
    this.textLanguage.setText(t("labels.settings.language"));
  }

  //   private onPadDown(_pad: any, btn: any, val: number) {
  //     if (val === 0) return;
  //     const idx = typeof btn === "number" ? btn : btn.index;
  //     if (idx === 12) this.setActiveIndex(this.activeIndex - 1); // Dpad Up
  //     if (idx === 13) this.setActiveIndex(this.activeIndex + 1); // Dpad Down
  //     if (idx === 14) this.onChange(-1); // Dpad Left
  //     if (idx === 15) this.onChange(+1); // Dpad Right
  //     if (idx === 1) this.close(); // B / Circle
  //   }

  private onShutdown() {
    const k = this.input.keyboard!;
    k.off("keydown-UP", this.onUp);
    k.off("keydown-W", this.onUp);
    k.off("keydown-DOWN", this.onDown);
    k.off("keydown-S", this.onDown);
    k.off("keydown-LEFT", this.onLeft);
    k.off("keydown-A", this.onLeft);
    k.off("keydown-RIGHT", this.onRight);
    k.off("keydown-D", this.onRight);
    k.off("keydown-ESC", this.onEsc);
    // this.input.gamepad?.off("down", this.onPadDown, this);

    this.tweens.killAll();
    this.entries = [];
    this.time.clearPendingEvents();
    this.input.removeAllListeners();
  }

  private prevSkin() {
    SkinSettings.prev();
    this.updateSkinRowAndPreview();
  }
  private nextSkin() {
    SkinSettings.next();
    this.updateSkinRowAndPreview();
  }

  private updateSkinRowAndPreview() {
    const e = this.entries[1];
    e.value.setText(this.getSkinLabel(SkinSettings.get()));
    this.refreshPreview();
  }

  private buildPreviewArea(rightX: number, topOffset: number) {
    const currentSkin = SKIN_LABEL[SkinSettings.get()];
    this.preview = this.add.container(rightX, topOffset);

    this.modal.add(this.preview);
  }

  private addSkinRow(idx: number, y: number) {
    const cx = 0,
      w = 560,
      h = 48;
    const bg = this.add
      .rectangle(cx, y, w, h, 0xffffff, 0.06)
      .setOrigin(0.5)
      .setStrokeStyle(1, 0x00ffff, 0.6);
    const label = this.add
      .text(-w / 2 + 14, y, "Block Skin", {
        fontFamily: DEFAULT_MENU_FONT,
        fontSize: "22px",
        color: "#9ad",
      })
      .setOrigin(0, 0.5);
    const value = this.add
      .text(w / 2 - 14, y, this.getSkinLabel(SkinSettings.get()), {
        fontFamily: DEFAULT_MENU_FONT,
        fontSize: "22px",
        color: "#cfefff",
      })
      .setOrigin(1, 0.5);

    // bg.setInteractive({ useHandCursor: true });
    // bg.on("pointerdown", (p: Phaser.Input.Pointer) => {
    //   this.setActiveIndex(idx);
    //   if (p.x < this.cameras.main.centerX) this.prevSkin();
    //   else this.nextSkin();
    // });

    this.modal.add([bg, label, value]);
    this.entries.push({ label, value, bg, cx, cy: y, w, h });
  }

  private getSkinLabel(id: SkinId) {
    return SKIN_LABEL[id];
  }

  private refreshPreview() {
    this.preview.iterate((child: any) => {
      if (child !== this.previewBox) child.destroy();
    });

    const skin = SkinSettings.get();

    const pieces: (keyof typeof SHAPE_TO_BLOCKSKIN_FRAME)[] = [
      "I",
      "O",
      "T",
      "S",
      "Z",
      "J",
      "L",
    ];
    const frames = pieces.map((p) => SHAPE_TO_BLOCKSKIN_FRAME[p]);

    const startX = -50,
      startY = 46;
    const cell = 32;
    let col = 0,
      row = 0;

    // TODO: render actual shapes instead of single blocks
    // Example for T piece at (x,y): place four images (0,1 / 1,1 / 2,1 / 1,0) with tighter cell spacing.
    frames.forEach((frame, i) => {
      const img = this.add
        .image(startX + col * cell, startY + row * cell, skin, frame)
        .setOrigin(0, 0)
        .setDisplaySize(32, 32);
      this.preview.add(img);

      col++;
      if (col >= 7) {
        col = 0;
        row++;
      }
    });
  }

  protected onEntranceCompleted(): void {}
  protected beforeClose(): void {}
}
