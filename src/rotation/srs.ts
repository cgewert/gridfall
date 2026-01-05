export type SrsRotation = 0 | 1 | 2 | 3; // 0=Spawn, 1=R, 2=2, 3=L
export type Kick = Readonly<{ x: number; y: number }>; // y: DOWN-positive

type KickUp = readonly [dx: number, dyUp: number]; // SRS-Tabellen: dy is UP-positive
type KickTable = Record<string, readonly KickUp[]>;

const JLSTZ: KickTable = {
  "0>1": [
    [0, 0],
    [-1, 0],
    [-1, +1],
    [0, -2],
    [-1, -2],
  ],
  "1>0": [
    [0, 0],
    [+1, 0],
    [+1, -1],
    [0, +2],
    [+1, +2],
  ],
  "1>2": [
    [0, 0],
    [+1, 0],
    [+1, -1],
    [0, +2],
    [+1, +2],
  ],
  "2>1": [
    [0, 0],
    [-1, 0],
    [-1, +1],
    [0, -2],
    [-1, -2],
  ],
  "2>3": [
    [0, 0],
    [+1, 0],
    [+1, +1],
    [0, -2],
    [+1, -2],
  ],
  "3>2": [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, +2],
    [-1, +2],
  ],
  "3>0": [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, +2],
    [-1, +2],
  ],
  "0>3": [
    [0, 0],
    [+1, 0],
    [+1, +1],
    [0, -2],
    [+1, -2],
  ],
};

const I: KickTable = {
  "0>1": [
    [0, 0],
    [-2, 0],
    [+1, 0],
    [-2, -1],
    [+1, +2],
  ],
  "1>0": [
    [0, 0],
    [+2, 0],
    [-1, 0],
    [+2, +1],
    [-1, -2],
  ],
  "1>2": [
    [0, 0],
    [-1, 0],
    [+2, 0],
    [-1, +2],
    [+2, -1],
  ],
  "2>1": [
    [0, 0],
    [+1, 0],
    [-2, 0],
    [+1, -2],
    [-2, +1],
  ],
  "2>3": [
    [0, 0],
    [+2, 0],
    [-1, 0],
    [+2, +1],
    [-1, -2],
  ],
  "3>2": [
    [0, 0],
    [-2, 0],
    [+1, 0],
    [-2, -1],
    [+1, +2],
  ],
  "3>0": [
    [0, 0],
    [+1, 0],
    [-2, 0],
    [+1, -2],
    [-2, +1],
  ],
  "0>3": [
    [0, 0],
    [-1, 0],
    [+2, 0],
    [-1, +2],
    [+2, -1],
  ],
};

function tableFor(type: string): KickTable | null {
  if (type === "O") return null; // O: no kicks
  if (type === "I") return I;
  return JLSTZ;
}

export function getSrsKicks(type: string, from: number, to: number): Kick[] {
  const f = (((from % 4) + 4) % 4) as SrsRotation;
  const t = (((to % 4) + 4) % 4) as SrsRotation;

  const tab = tableFor(type);
  if (!tab) return [{ x: 0, y: 0 }];

  const key = `${f}>${t}`;
  const list = tab[key] ?? [[0, 0]];

  // SRS dyUp -> Grid dyDown
  return list.map(([dx, dyUp]) => ({ x: dx, y: -dyUp }));
}
