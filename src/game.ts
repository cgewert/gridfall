import i18next from "i18next";

export const ONE_HOUR_MS = 60 * 60_000;

export enum Rotation {
  SPAWN = 0,
  RIGHT = 1,
  REVERSE = 2,
  LEFT = 3,
}

export type GameConfig = {
  gameMode: GameMode;
};

export enum GameMode {
  ASCENT = 1,
  RUSH = 2,
  INFINITY = 3,
}

export enum RoundPhase {
  Idle,
  Countdown,
  Running,
  Ended,
}

export const DefaultGameModeDecorators: { [key in GameMode]: string[] } = {
  [GameMode.ASCENT]: [
    "TimerDisplay",
    "ScoreDisplay",
    "LevelDisplay",
    "LinesClearedDisplay",
  ],
  [GameMode.RUSH]: [
    "LinesClearedDisplay",
    "TimerDisplay",
    "TargetLineClearsDisplay",
  ],
  [GameMode.INFINITY]: [
    "TimerDisplay",
    "ScoreDisplay",
    "LevelDisplay",
    "LinesClearedDisplay",
  ],
};

export const GameModeToString = (mode: GameMode): string => {
  switch (mode) {
    case GameMode.ASCENT:
      return "Ascent";
    case GameMode.RUSH:
      return "Rush";
    case GameMode.INFINITY:
      return "Infinity";
    default:
      return "Unknown";
  }
};

export const FormatScore = (score: number): string =>
  score.toLocaleString(i18next.language || "en-US");

export enum GameActions {
  CHECK_FOR_LINE_CLEAR,
  CHECK_FOR_WIN_CONDITION,
  HARD_DROP,
  LINE_CLEAR,
  LOCK_PIECE,
  VICTORY,
  ASCENT_VICTORY,
  RUSH_VICTORY,
}

export type InputActions = {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  rotateLeft: Phaser.Input.Keyboard.Key;
  rotateRight: Phaser.Input.Keyboard.Key;
  rotate180: Phaser.Input.Keyboard.Key;
  softDrop: Phaser.Input.Keyboard.Key;
  hardDrop: Phaser.Input.Keyboard.Key;
  hold: Phaser.Input.Keyboard.Key;
  pause: Phaser.Input.Keyboard.Key;
  resetRound: Phaser.Input.Keyboard.Key;
};

export const LogGameAction = (action: GameActions) => {
  console.debug(`Game Action: ${GameActionsToString(action)}`);
};

export const TimeStringToMilliseconds = (time: string): number => {
  const parts = time.split(":").map((part) => parseInt(part, 10));
  const [hours, minutes, seconds, milliseconds] = parts;
  return (
    hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000 + milliseconds
  );
};

export const FormatTime = (timeMs: number): string =>
  timeMs >= ONE_HOUR_MS
    ? MillisecondsToTimeString(timeMs)
    : MillisecondsToTimeStringCompact(timeMs);

export const MillisecondsToTimeString = (msTotal: number): string => {
  const ms = Math.floor(msTotal % 1000);
  const totalSeconds = Math.floor(msTotal / 1000);

  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);

  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const pad2 = (n: number) => n.toString().padStart(2, "0");
  const pad3 = (n: number) => n.toString().padStart(3, "0");

  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}.${pad3(ms)}`;
};

export const MillisecondsToTimeStringCompact = (msTotal: number): string => {
  const ms = Math.floor(msTotal % 1000);
  const totalSeconds = Math.floor(msTotal / 1000);

  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const pad2 = (n: number) => n.toString().padStart(2, "0");
  const pad3 = (n: number) => n.toString().padStart(3, "0");

  return `${pad2(minutes)}:${pad2(seconds)}.${pad3(ms)}`;
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
    case GameActions.ASCENT_VICTORY:
      return "Ascent Victory detected";
    case GameActions.RUSH_VICTORY:
      return "Rush Victory detected";
    case GameActions.CHECK_FOR_WIN_CONDITION:
      return "Check for Win Condition";
    default:
      return "Unknown";
  }
};

export type AudioAnalysis = {
  analyser?: AnalyserNode; // Web Audio API Analyser Node
  disconnect?: () => void; // Function to disconnect the analyser
  data?: Uint8Array; // Optional data array for audio data
};

/***
 * Creates an audio analyser node for the given scene's audio context.
 * Returns an object containing the analyser node and a disconnect function.
 * If the audio context is not available, returns an empty object.
 */
export const CreateAudioAnalysis = (scene: Phaser.Scene): AudioAnalysis => {
  const webAudio = scene.sound as Phaser.Sound.WebAudioSoundManager;
  if (!webAudio) return {};
  const audioCtx = webAudio.context;
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  // analyser.minDecibels = -90;  See https://docs.phaser.io/phaser/concepts/audio
  // analyser.maxDecibels = -10;
  const source = webAudio.locked ? null : webAudio.masterVolumeNode;
  if (source) {
    source.connect(analyser);
  } else {
    return {};
  }

  return {
    analyser,
    disconnect: () => {
      try {
        source && (source as any).disconnect(analyser);
      } catch {}
    },
    data: new Uint8Array(analyser.frequencyBinCount),
  };
};
