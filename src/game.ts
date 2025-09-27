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
