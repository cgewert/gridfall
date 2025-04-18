import Phaser from "phaser";
import { SHAPE_TYPES } from "./shapes";

export enum SpawnSystem {
  RANDOM,
  SEVEN_BAG,
}

export class ShapesSpawner {
  private bag: string[] = [];
  private _nextQueue: string[] = [];

  constructor(private system: SpawnSystem) {}

  public get NextQueue(): string[] {
    return this._nextQueue;
  }

  public generateNextQueue(count: number): void {
    for (let i = 0; i < count; i++) {
      this._nextQueue.push(this.getNext());
    }
  }

  private refillBag() {
    this.bag = Phaser.Utils.Array.Shuffle(Array.from(SHAPE_TYPES));
  }

  public getNext(): string {
    if (this.system === SpawnSystem.RANDOM) {
      return Phaser.Utils.Array.GetRandom(SHAPE_TYPES as string[]);
    }

    if (this.bag.length === 0) this.refillBag();
    return this.bag.shift()!;
  }

  public peekNext(count: number): string[] {
    while (this.bag.length < count) this.refillBag();
    return this.bag.slice(0, count);
  }
}
