// FONTS
export const DEFAULT_MENU_FONT = "Orbitron, sans-serif";

export const DEFAULT_FONT_SIZE = 32;
export const DEFAULT_FONT_COLOR = "#FFFFFF";
export const MENU_ENTRY_FONT_COLOR = "#DAECC1"; // This color will be used for menu entries, it is a pastel green color.
export const MENU_TITLE_FONT_COLOR = DEFAULT_FONT_COLOR;

export const COLOR_BLACK = "#000000";

// FONT STYLES

export const DEFAULT_FONT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: DEFAULT_MENU_FONT,
  fontSize: `${DEFAULT_FONT_SIZE}px`,
  color: DEFAULT_FONT_COLOR,
  align: "center",
  stroke: "#000000",
  strokeThickness: 4,
};
export const PAUSE_OVERLAY_FONT_STYLE: Phaser.Types.GameObjects.Text.TextStyle =
  {
    fontFamily: DEFAULT_MENU_FONT,
    fontSize: "32px",
    color: DEFAULT_FONT_COLOR,
    align: "center",
    stroke: "#000000",
    strokeThickness: 4,
  };
export const PAUSE_OVERLAY_FONT_STYLE_ENTRIES: Phaser.Types.GameObjects.Text.TextStyle =
  {
    fontFamily: DEFAULT_MENU_FONT,
    fontSize: "24px",
    color: MENU_ENTRY_FONT_COLOR,
    align: "center",
    stroke: "#000000",
    strokeThickness: 4,
  };
export const PAUSE_OVERLAY_FONT_STYLE_ACTIVE_ENTRY: Phaser.Types.GameObjects.Text.TextStyle =
  {
    fontFamily: DEFAULT_MENU_FONT,
    fontSize: "36px",
    color: MENU_ENTRY_FONT_COLOR,
    align: "center",
    stroke: "#000000",
    strokeThickness: 5,
  };
export const GUI_LABEL_HOLDBOX_STYLE: Phaser.Types.GameObjects.Text.TextStyle =
  {
    fontSize: "16px",
    fontStyle: "bold",
    color: "#ffffff",
    stroke: "#000000",
    strokeThickness: 6,
    fontFamily: DEFAULT_MENU_FONT,
  };
export const GUI_COMBO_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: DEFAULT_MENU_FONT,
  fontSize: "24px",
  fontStyle: "bold",
  stroke: "#000000",
  strokeThickness: 4,
  color: "#ffcc00",
};
export const TEXTBOX_DEFAULT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: "24px",
  color: "#ffffff",
  fontFamily: DEFAULT_MENU_FONT,
  stroke: "#000000",
  strokeThickness: 2,
};
export const TIMER_DISPLAY_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "Orbitron, monospace",
  fontSize: "32px",
  color: "#FFFFFF",
};
