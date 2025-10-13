import { t } from "i18next";
import { BaseMenuScene } from "../../ui/menu/BaseMenu";
import { MenuList } from "../../ui/menu/MenuList";

export class OptionsScene extends BaseMenuScene {
  public static readonly KEY = "OptionsScene";
  public static readonly HINT = "hints.mnu-options";

  constructor() {
    super(OptionsScene.KEY, "labels.mnu-options", OptionsScene.HINT);
  }

  public create(data: { parentKey?: string } = {}): void {
    super.create(data);

    this.menuList = new MenuList(this, {
      x: 0,
      y: -20,
      gap: 64,
      onMoveSoundKey: "ui-move",
      onChooseSoundKey: "ui-choose",
      items: [
        {
          label: "Controls",
          disabled: false,
          action: () => this.openControls(),
          identifier: "mnu-controls",
          translatable: true,
        },
        {
          label: "Audio",
          disabled: false,
          action: () => this.openAudio(),
          identifier: "mnu-audio",
          translatable: true,
        },
        {
          label: "General",
          disabled: false,
          action: () => this.openGeneral(),
          identifier: "mnu-general",
          translatable: true,
        },
      ],
    });
    this.modal.add(this.menuList);
  }

  private openAudio() {
    const main = this.scene.get("MainMenuScene") as any;
    main.openSubmenu?.("AudioMenuScene", { parentKey: "OptionsScene" });
  }

  private openControls() {
    const main = this.scene.get("MainMenuScene") as any;
    main.openSubmenu?.("ControlsMenuScene", { parentKey: "OptionsScene" });
  }

  private openGeneral() {
    const main = this.scene.get("MainMenuScene") as any;
    main.openSubmenu?.("GeneralMenuScene", { parentKey: "OptionsScene" });
  }

  protected onEntranceCompleted(): void {}
  protected beforeClose(): void {}
}
