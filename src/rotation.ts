export enum Rotation {
  SPAWN = 0,
  RIGHT = 1,
  REVERSE = 2,
  LEFT = 3,
}

export type KickOffset = { x: number; y: number };
export type KickData = Record<Rotation, Record<Rotation, KickOffset[]>>;

// Kickdaten nach SRS Standard

export const T_KICK_DATA: KickData = {
  [Rotation.SPAWN]: {
    [Rotation.RIGHT]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: -2 },
      { x: -1, y: -2 },
    ],
    [Rotation.LEFT]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: -2 },
      { x: 1, y: -2 },
    ],
  },
  [Rotation.RIGHT]: {
    [Rotation.REVERSE]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: -1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
    [Rotation.SPAWN]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: -1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
  },
  [Rotation.REVERSE]: {
    [Rotation.LEFT]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: -2 },
      { x: 1, y: -2 },
    ],
    [Rotation.RIGHT]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: -2 },
      { x: -1, y: -2 },
    ],
  },
  [Rotation.LEFT]: {
    [Rotation.SPAWN]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: 2 },
      { x: -1, y: 2 },
    ],
    [Rotation.REVERSE]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: 2 },
      { x: -1, y: 2 },
    ],
  },
} as Record<Rotation, Record<Rotation, KickOffset[]>>;

// I-Kickdaten sind speziell:
export const I_KICK_DATA: KickData = {
  [Rotation.SPAWN]: {
    [Rotation.RIGHT]: [
      { x: 0, y: 0 },
      { x: -2, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: -1 },
      { x: 1, y: 2 },
    ],
    [Rotation.LEFT]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 2, y: 0 },
      { x: -1, y: 2 },
      { x: 2, y: -1 },
    ],
  },
  [Rotation.RIGHT]: {
    [Rotation.REVERSE]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 2, y: 0 },
      { x: -1, y: 2 },
      { x: 2, y: -1 },
    ],
    [Rotation.SPAWN]: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: -1, y: 0 },
      { x: 2, y: 1 },
      { x: -1, y: -2 },
    ],
  },
  [Rotation.REVERSE]: {
    [Rotation.LEFT]: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: -1, y: 0 },
      { x: 2, y: 1 },
      { x: -1, y: -2 },
    ],
    [Rotation.RIGHT]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: 0 },
      { x: 1, y: -2 },
      { x: -2, y: 1 },
    ],
  },
  [Rotation.LEFT]: {
    [Rotation.SPAWN]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: 0 },
      { x: 1, y: -2 },
      { x: -2, y: 1 },
    ],
    [Rotation.REVERSE]: [
      { x: 0, y: 0 },
      { x: -2, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: -1 },
      { x: 1, y: 2 },
    ],
  },
} as Record<Rotation, Record<Rotation, KickOffset[]>>;

// O-Tetrimino: keine Rotation nötig (nur Mittelpunktwechsel), daher keine Kicks nötig
export const O_KICK_DATA: KickData = {
  [Rotation.SPAWN]: {
    [Rotation.RIGHT]: [{ x: 0, y: 0 }],
    [Rotation.LEFT]: [{ x: 0, y: 0 }],
  },
  [Rotation.RIGHT]: {
    [Rotation.REVERSE]: [{ x: 0, y: 0 }],
    [Rotation.SPAWN]: [{ x: 0, y: 0 }],
  },
  [Rotation.REVERSE]: {
    [Rotation.LEFT]: [{ x: 0, y: 0 }],
    [Rotation.RIGHT]: [{ x: 0, y: 0 }],
  },
  [Rotation.LEFT]: {
    [Rotation.SPAWN]: [{ x: 0, y: 0 }],
    [Rotation.REVERSE]: [{ x: 0, y: 0 }],
  },
} as Record<Rotation, Record<Rotation, KickOffset[]>>;

// Alle anderen (J, L, S, Z) verwenden dieselben Kickdaten wie T
export const JLZS_KICK_DATA: KickData = {
  [Rotation.SPAWN]: {
    [Rotation.RIGHT]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: -2 },
      { x: -1, y: -2 },
    ],
    [Rotation.LEFT]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: -2 },
      { x: 1, y: -2 },
    ],
  },
  [Rotation.RIGHT]: {
    [Rotation.REVERSE]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: -1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
    [Rotation.SPAWN]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: -1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
  },
  [Rotation.REVERSE]: {
    [Rotation.LEFT]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: -2 },
      { x: 1, y: -2 },
    ],
    [Rotation.RIGHT]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: -2 },
      { x: -1, y: -2 },
    ],
  },
  [Rotation.LEFT]: {
    [Rotation.SPAWN]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: 2 },
      { x: -1, y: 2 },
    ],
    [Rotation.REVERSE]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: 2 },
      { x: -1, y: 2 },
    ],
  },
} as Record<Rotation, Record<Rotation, KickOffset[]>>;

export function GetKickData(
  type: string,
  from: Rotation,
  to: Rotation
): KickOffset[] {
  switch (type) {
    case "T":
      return T_KICK_DATA[from][to] || [];
    case "I":
      return I_KICK_DATA[from][to] || [];
    case "O":
      return O_KICK_DATA[from][to] || [];
    case "J":
    case "L":
    case "S":
    case "Z":
      return JLZS_KICK_DATA[from][to] || [];
    default:
      return [];
  }
}
