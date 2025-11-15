export enum Rotation {
  SPAWN = 0,
  RIGHT = 1,
  REVERSE = 2,
  LEFT = 3,
}

export type KickOffset = { x: number; y: number };
export type KickData = Record<Rotation, Record<Rotation, KickOffset[]>>;

// <-- SRS+ Kicktables (TETR.IO Compatible) - ERWEITERT für DT Cannon & Fin Spins

// <-- T-Piece: Noch mehr Kicks für DT Cannon und Wand-Spins
export const T_KICK_DATA: KickData = {
  [Rotation.SPAWN]: {
    [Rotation.SPAWN]: [],
    [Rotation.RIGHT]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: -2 },
      { x: -1, y: -2 },
      // <-- SRS+ Erweiterte Kicks für DT Cannon
      { x: -2, y: 0 }, // <-- Wichtig für Wallkicks
      { x: -2, y: 1 }, // <-- Ermöglicht tiefere Spins
      { x: 1, y: 0 }, // <-- Alternativer Kick
      { x: -1, y: -1 }, // <-- Diagonal kick
    ],
    [Rotation.LEFT]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: -2 },
      { x: 1, y: -2 },
      // <-- SRS+ Erweiterte Kicks (spiegelsymmetrisch)
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: -1 },
    ],
    [Rotation.REVERSE]: [],
  },
  [Rotation.RIGHT]: {
    [Rotation.SPAWN]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: -1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      // <-- SRS+ Erweiterte Kicks
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
    ],
    [Rotation.RIGHT]: [],
    [Rotation.REVERSE]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: -1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: -1, y: 0 },
    ],
    [Rotation.LEFT]: [],
  },
  [Rotation.REVERSE]: {
    [Rotation.SPAWN]: [],
    [Rotation.RIGHT]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: -2 },
      { x: -1, y: -2 },
      { x: -2, y: 0 },
      { x: -2, y: 1 },
      { x: 1, y: 0 },
    ],
    [Rotation.REVERSE]: [],
    [Rotation.LEFT]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: -2 },
      { x: 1, y: -2 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: -1, y: 0 },
    ],
  },
  [Rotation.LEFT]: {
    [Rotation.SPAWN]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: 2 },
      { x: -1, y: 2 },
      // <-- WICHTIG: Diese Kicks ermöglichen das "nach unten rotieren"
      { x: 0, y: 1 }, // <-- Nach unten ohne X-Verschiebung
      { x: -1, y: 1 }, // <-- 1 links + 1 runter
      { x: -2, y: 0 }, // <-- 2 links
      { x: -2, y: 1 }, // <-- 2 links + 1 runter (wichtig für DT Cannon!)
      { x: 1, y: 0 }, // <-- Alternativer Kick
      { x: 0, y: 2 }, // <-- Noch weiter runter
      { x: -1, y: 2 }, // <-- 1 links + 2 runter
    ],
    [Rotation.RIGHT]: [],
    [Rotation.REVERSE]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: 2 },
      { x: -1, y: 2 },
      { x: 0, y: 1 },
      { x: -1, y: 1 },
      { x: -2, y: 0 },
      { x: -2, y: 1 },
      { x: 1, y: 0 },
    ],
    [Rotation.LEFT]: [],
  },
};

// <-- I-Piece: Erweiterte Iso-Spin Kicks
export const I_KICK_DATA: KickData = {
  [Rotation.SPAWN]: {
    [Rotation.SPAWN]: [],
    [Rotation.RIGHT]: [
      { x: 0, y: 0 },
      { x: -2, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: -1 },
      { x: 1, y: 2 },
      { x: -1, y: 0 },
      { x: 2, y: 0 },
      { x: -3, y: 0 }, // <-- Noch weiter links
      { x: 3, y: 0 }, // <-- Noch weiter rechts
    ],
    [Rotation.LEFT]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 2, y: 0 },
      { x: -1, y: 2 },
      { x: 2, y: -1 },
      { x: -2, y: 0 },
      { x: 1, y: 0 },
      { x: -3, y: 0 },
      { x: 3, y: 0 },
    ],
    [Rotation.REVERSE]: [],
  },
  [Rotation.RIGHT]: {
    [Rotation.SPAWN]: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: -1, y: 0 },
      { x: 2, y: 1 },
      { x: -1, y: -2 },
      { x: 1, y: 0 },
      { x: -2, y: 0 },
      { x: 3, y: 0 },
      { x: -3, y: 0 },
    ],
    [Rotation.RIGHT]: [],
    [Rotation.REVERSE]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 2, y: 0 },
      { x: -1, y: 2 },
      { x: 2, y: -1 },
      { x: -2, y: 0 },
      { x: 1, y: 0 },
      { x: 3, y: 0 },
      { x: -3, y: 0 },
    ],
    [Rotation.LEFT]: [],
  },
  [Rotation.REVERSE]: {
    [Rotation.SPAWN]: [],
    [Rotation.RIGHT]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: 0 },
      { x: 1, y: -2 },
      { x: -2, y: 1 },
      { x: 2, y: 0 },
      { x: -1, y: 0 },
      { x: 3, y: 0 },
      { x: -3, y: 0 },
    ],
    [Rotation.REVERSE]: [],
    [Rotation.LEFT]: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: -1, y: 0 },
      { x: 2, y: 1 },
      { x: -1, y: -2 },
      { x: 1, y: 0 },
      { x: -2, y: 0 },
      { x: 3, y: 0 },
      { x: -3, y: 0 },
    ],
  },
  [Rotation.LEFT]: {
    [Rotation.SPAWN]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: 0 },
      { x: 1, y: -2 },
      { x: -2, y: 1 },
      { x: 2, y: 0 },
      { x: -1, y: 0 },
      { x: 3, y: 0 },
      { x: -3, y: 0 },
    ],
    [Rotation.RIGHT]: [],
    [Rotation.REVERSE]: [
      { x: 0, y: 0 },
      { x: -2, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: -1 },
      { x: 1, y: 2 },
      { x: -1, y: 0 },
      { x: 2, y: 0 },
      { x: -3, y: 0 },
      { x: 3, y: 0 },
    ],
    [Rotation.LEFT]: [],
  },
};

// <-- O-Piece: Keine Rotation
export const O_KICK_DATA: KickData = {
  [Rotation.SPAWN]: {
    [Rotation.SPAWN]: [],
    [Rotation.RIGHT]: [{ x: 0, y: 0 }],
    [Rotation.LEFT]: [{ x: 0, y: 0 }],
    [Rotation.REVERSE]: [{ x: 0, y: 0 }],
  },
  [Rotation.RIGHT]: {
    [Rotation.SPAWN]: [{ x: 0, y: 0 }],
    [Rotation.RIGHT]: [],
    [Rotation.REVERSE]: [{ x: 0, y: 0 }],
    [Rotation.LEFT]: [{ x: 0, y: 0 }],
  },
  [Rotation.REVERSE]: {
    [Rotation.SPAWN]: [{ x: 0, y: 0 }],
    [Rotation.RIGHT]: [{ x: 0, y: 0 }],
    [Rotation.REVERSE]: [],
    [Rotation.LEFT]: [{ x: 0, y: 0 }],
  },
  [Rotation.LEFT]: {
    [Rotation.SPAWN]: [{ x: 0, y: 0 }],
    [Rotation.RIGHT]: [{ x: 0, y: 0 }],
    [Rotation.REVERSE]: [{ x: 0, y: 0 }],
    [Rotation.LEFT]: [],
  },
};

// <-- J/L/S/Z: Erweiterte Kicks für Fin Spins
export const JLZS_KICK_DATA: KickData = {
  [Rotation.SPAWN]: {
    [Rotation.SPAWN]: [],
    [Rotation.RIGHT]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: -2 },
      { x: -1, y: -2 },
      // <-- SRS+ Erweiterte Kicks für Fin Spins
      { x: -2, y: 0 },
      { x: -2, y: 1 },
      { x: 1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: 1 }, // <-- Diagonal nach unten
      { x: -2, y: -1 }, // <-- Noch aggressiver
    ],
    [Rotation.LEFT]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: -2 },
      { x: 1, y: -2 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: -1 },
      { x: 0, y: 1 },
      { x: 2, y: -1 },
    ],
    [Rotation.REVERSE]: [],
  },
  [Rotation.RIGHT]: {
    [Rotation.SPAWN]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: -1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 0 },
      { x: 2, y: -1 },
      { x: -1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: -1 },
      { x: 2, y: 1 },
    ],
    [Rotation.RIGHT]: [],
    [Rotation.REVERSE]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: -1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 0 },
      { x: 2, y: -1 },
      { x: -1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [Rotation.LEFT]: [],
  },
  [Rotation.REVERSE]: {
    [Rotation.SPAWN]: [],
    [Rotation.RIGHT]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: -2 },
      { x: -1, y: -2 },
      { x: -2, y: 0 },
      { x: -2, y: 1 },
      { x: 1, y: 0 },
      { x: -1, y: -1 },
      { x: -2, y: -1 },
    ],
    [Rotation.REVERSE]: [],
    [Rotation.LEFT]: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: -2 },
      { x: 1, y: -2 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: -1 },
      { x: 2, y: -1 },
    ],
  },
  [Rotation.LEFT]: {
    [Rotation.SPAWN]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: 2 },
      { x: -1, y: 2 },
      { x: -2, y: 0 },
      { x: -2, y: -1 },
      { x: 1, y: 0 },
      { x: -1, y: 1 },
      { x: -2, y: 1 },
    ],
    [Rotation.RIGHT]: [],
    [Rotation.REVERSE]: [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: 2 },
      { x: -1, y: 2 },
      { x: -2, y: 0 },
      { x: -2, y: -1 },
      { x: 1, y: 0 },
      { x: -1, y: 1 },
      { x: -2, y: 1 },
    ],
    [Rotation.LEFT]: [],
  },
};

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
