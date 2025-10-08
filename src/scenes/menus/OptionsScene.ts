import { BaseMenuScene } from "../../ui/menu/BaseMenu";
import { MenuList } from "../../ui/menu/MenuList";

export class OptionsScene extends BaseMenuScene {
  public static readonly KEY = "OptionsScene";

  constructor() {
    super(OptionsScene.KEY, "Options");
  }

  public create(data: { parentKey?: string } = {}): void {
    super.create(data);

    const list = new MenuList(this, {
      x: 0,
      y: -20,
      gap: 64,
      onMoveSoundKey: "ui-move",
      onChooseSoundKey: "ui-choose",
      items: [
        { label: "Controls", disabled: true, action: () => {} },
        { label: "Audio", disabled: false, action: () => this.openAudio() },
        { label: "General", disabled: false, action: () => this.openGeneral() },
      ],
    });
    this.modal.add(list);
  }

  private openAudio() {
    const main = this.scene.get("MainMenuScene") as any;
    main.openSubmenu?.("AudioMenuScene", { parentKey: "OptionsScene" });
  }

  private openGeneral() {
    const main = this.scene.get("MainMenuScene") as any;
    main.openSubmenu?.("GeneralMenuScene", { parentKey: "OptionsScene" });
  }
}
