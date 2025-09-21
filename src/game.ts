export enum GameMode {
  MARATHON = 1,
  SPRINT = 2,
  ENDLESS = 3,
}

export const GameModeToString = (mode: GameMode): string => {
  switch (mode) {
    case GameMode.MARATHON:
      return "Marathon";
    case GameMode.SPRINT:
      return "Sprint";
    case GameMode.ENDLESS:
      return "Endless";
    default:
      return "Unknown";
  }
};

export enum GameActions {
  CHECK_FOR_LINE_CLEAR,
  CHECK_FOR_WIN_CONDITION,
  HARD_DROP,
  LINE_CLEAR,
  LOCK_PIECE,
  VICTORY,
  MARATHON_VICTORY,
  SPRINT_VICTORY,
}

export const LogGameAction = (action: GameActions) => {
  console.debug(`Game Action: ${GameActionsToString(action)}`);
};

export const GameActionsToString = (action: GameActions): string => {
  switch (action) {
    case GameActions.LINE_CLEAR:
      return "Line Clear";
    case GameActions.VICTORY:
      return "Victory";
    case GameActions.HARD_DROP:
      return "Hard Drop";
    case GameActions.LOCK_PIECE:
      return "Lock Piece";
    case GameActions.CHECK_FOR_LINE_CLEAR:
      return "Check for Line Clear";
    case GameActions.MARATHON_VICTORY:
      return "Marathon Victory detected";
    case GameActions.SPRINT_VICTORY:
      return "Sprint Victory detected";
    case GameActions.CHECK_FOR_WIN_CONDITION:
      return "Check for Win Condition";
    default:
      return "Unknown";
  }
};
