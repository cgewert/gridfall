import { Soundtrack } from "../audio";
import { COLORS } from "../colors";
import { BaseScene } from "./base-scene";
import * as Phaser from "phaser";

export type TetriminoShape = number[][];

const TETRIMINOS: Record<string, TetriminoShape[]> = {
  I: [[[1, 1, 1, 1]], [[1], [1], [1], [1]]],
  O: [
    [
      [1, 1],
      [1, 1],
    ],
  ],
  T: [
    [
      [0, 1, 0],
      [1, 1, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 0],
    ],
    [
      [1, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1],
      [1, 1],
      [0, 1],
    ],
  ],
  S: [
    [
      [0, 1, 1],
      [1, 1, 0],
    ],
    [
      [1, 0],
      [1, 1],
      [0, 1],
    ],
  ],
  Z: [
    [
      [1, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 1],
      [1, 1],
      [1, 0],
    ],
  ],
  J: [
    [
      [1, 0, 0],
      [1, 1, 1],
    ],
    [
      [1, 1],
      [1, 0],
      [1, 0],
    ],
    [
      [1, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1],
      [0, 1],
      [1, 1],
    ],
  ],
  L: [
    [
      [0, 0, 1],
      [1, 1, 1],
    ],
    [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
    [
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 1],
      [0, 1],
      [0, 1],
    ],
  ],
};

export class GameScene extends BaseScene {
  private static CONFIG: Phaser.Types.Scenes.SettingsConfig = {
    key: "GameScene",
  };
  private currentTetrimino!: Phaser.GameObjects.Group;
  private ghostGroup!: Phaser.GameObjects.Group;
  private previewGroup!: Phaser.GameObjects.Group;
  private lockedBlocksGroup!: Phaser.GameObjects.Group;
  private currentShape!: TetriminoShape;
  private currentPosition = { x: 3, y: 0 }; // Startposition
  private currentRotationIndex = 0;
  private currentTetriminoType = "T"; // Start mit T-Tetrimino
  private fallInterval = 1000; // 1 Sekunde pro Block
  private lastFallTime = 0;
  private nextQueue: string[] = [];

  private music!: Phaser.Sound.BaseSound;

  private gameOver: boolean = false;
  private static readonly previewSize = 5; // Größe der Tetrimino Vorschau
  private static readonly emptyGridValue = "Q"; // Platzhalter für leere Felder
  private static readonly gridWidth = 10;
  private static readonly gridHeight = 20;
  private static readonly blockSize = 40; // Größe in Pixel
  private static readonly totalGridWidth =
    GameScene.gridWidth * GameScene.blockSize;
  private static readonly totalGridHeight =
    GameScene.gridHeight * GameScene.blockSize;
  private gridOffsetX = 0;
  private gridOffsetY = 0;

  private grid!: string[][];
  private blocksGroup!: Phaser.GameObjects.Group;

  constructor() {
    super(GameScene.CONFIG);
  }

  /* Scene initialization logic. */
  public init(data: unknown) {
    this.gameOver = false;
    this.generateNextQueue();
  }

  public preload() {
    this.load.audio("track2", Soundtrack.track2);
  }

  /*
   * @param data - Custom data provided to the scene.
   */
  public create(data: unknown) {
    this._main = this.cameras.main;
    this._viewPortHalfHeight = this._main.height / 2;
    this._viewPortHalfWidth = this._main.width / 2;
    this._viewPortHeight = this._main.height;
    this._viewPortWidth = this._main.width;

    this.gridOffsetX = this._viewPortHalfWidth - GameScene.totalGridWidth / 2;
    this.gridOffsetY = this._viewPortHalfHeight - GameScene.totalGridHeight / 2;

    this.generateNextQueue();
    this.renderNextQueue();
    this.lockedBlocksGroup = this.add.group();

    this.music = this.sound.add("track2", {
      loop: true,
      volume: 0.5, // Lautstärke anpassbar
    });
    this.music.play();

    this.initializeGrid();
    this.createGridGraphics();
    this.spawnTetrimino();
    if (this.input?.keyboard) {
      this.input.keyboard.on("keydown", (event: KeyboardEvent) => {
        switch (event.key.toLowerCase()) {
          case "arrowleft":
            this.moveTetrimino(-1);
            break;
          case "arrowright":
            this.moveTetrimino(1);
            break;
          case "y":
            this.rotateTetrimino(-1);
            break;
          case "x":
            this.rotateTetrimino(1);
            break;
          case "arrowdown":
            this.softDrop();
            break;
          case "arrowup":
            this.hardDrop();
            break;
          case " ":
            // this.holdTetrimino();
            break;
        }
      });
    }
  }

  private generateNextQueue(): void {
    const types = Object.keys(TETRIMINOS);

    while (this.nextQueue.length < GameScene.previewSize + 1) {
      const shuffled = Phaser.Utils.Array.Shuffle(types);
      this.nextQueue.push(...shuffled);
    }
  }

  private initializeGrid(): void {
    this.grid = Array.from({ length: GameScene.gridHeight }, () =>
      Array(GameScene.gridWidth).fill(GameScene.emptyGridValue)
    );
  }

  private createGridGraphics(): void {
    this.blocksGroup = this.add.group();

    // Zentrierung berechnen

    for (let y = 0; y < GameScene.gridHeight; y++) {
      for (let x = 0; x < GameScene.gridWidth; x++) {
        const posX = x * GameScene.blockSize + this.gridOffsetX;
        const posY = y * GameScene.blockSize + this.gridOffsetY;

        const block = this.add.rectangle(
          posX,
          posY,
          GameScene.blockSize,
          GameScene.blockSize,
          0xffffff,
          0.05
        );

        block.setOrigin(0);
        block.setStrokeStyle(1, 0xffffff, 0.1);
        this.blocksGroup.add(block);
      }
    }
  }

  private spawnTetrimino(): void {
    this.generateNextQueue();
    this.currentTetriminoType = this.nextQueue.shift()!; // Hole den nächsten Tetrimino aus der Warteschlange
    this.currentRotationIndex = 0;
    this.currentShape = TETRIMINOS[this.currentTetriminoType][0];
    this.currentPosition = { x: 3, y: 0 };

    this.renderNextQueue(); // aktualisiere die Vorschau

    this.currentTetrimino = this.add.group();
    this.currentShape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const blockX =
            (this.currentPosition.x + x) * GameScene.blockSize +
            this.gridOffsetX;
          const blockY =
            (this.currentPosition.y + y) * GameScene.blockSize +
            this.gridOffsetY;

          const block = this.add
            .rectangle(
              blockX,
              blockY,
              GameScene.blockSize,
              GameScene.blockSize,
              COLORS[this.currentTetriminoType]
            )
            .setOrigin(0);
          this.currentTetrimino.add(block);
        }
      });
    });

    this.updateGhost();

    if (this.checkCollision(0, 0)) {
      this.handleGameOver(); // ⛔️ Spiel beenden
      return;
    }
  }

  private renderNextQueue(): void {
    this.previewGroup?.clear(true, true);
    this.previewGroup = this.add.group();

    const startX =
      this.gridOffsetX + GameScene.gridWidth * GameScene.blockSize + 40;
    const startY = this.gridOffsetY;

    this.nextQueue.slice(0, GameScene.previewSize).forEach((type, index) => {
      const shape = TETRIMINOS[type][0];
      shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            const block = this.add
              .rectangle(
                startX + x * (GameScene.blockSize / 2),
                startY +
                  index * 4 * (GameScene.blockSize / 2) +
                  y * (GameScene.blockSize / 2),
                GameScene.blockSize / 2,
                GameScene.blockSize / 2,
                COLORS[type]
              )
              .setOrigin(0);

            this.previewGroup.add(block);
          }
        });
      });
    });
  }

  private moveTetrimino(direction: number): void {
    if (this.checkCollision(direction, 0)) return;

    this.currentPosition.x += direction;

    this.updateTetriminoPosition();
    this.updateGhost();
  }

  private updateGhost(): void {
    // Clear previous ghost
    this.ghostGroup?.clear(true, true);
    this.ghostGroup = this.add.group();

    let ghostY = this.currentPosition.y;
    while (!this.checkCollision(0, ghostY - this.currentPosition.y + 1)) {
      ghostY++;
    }

    this.currentShape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const posX =
            (this.currentPosition.x + x) * GameScene.blockSize +
            this.gridOffsetX;
          const posY = (ghostY + y) * GameScene.blockSize + this.gridOffsetY;

          const block = this.add
            .rectangle(
              posX,
              posY,
              GameScene.blockSize,
              GameScene.blockSize,
              COLORS[this.currentTetriminoType]
            )
            .setAlpha(0.2)
            .setOrigin(0); // Transparente Darstellung

          this.ghostGroup.add(block);
        }
      });
    });
  }

  private rotateTetrimino(direction: number): void {
    const shapes = TETRIMINOS[this.currentTetriminoType];
    this.currentRotationIndex =
      (this.currentRotationIndex + direction + shapes.length) % shapes.length;

    this.currentShape = shapes[this.currentRotationIndex];

    this.currentTetrimino.clear(true, true); // alte Blöcke entfernen
    this.currentTetrimino = this.add.group();

    this.currentShape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const blockX =
            (this.currentPosition.x + x) * GameScene.blockSize +
            this.gridOffsetX;
          const blockY =
            (this.currentPosition.y + y) * GameScene.blockSize +
            this.gridOffsetY;

          const block = this.add
            .rectangle(
              blockX,
              blockY,
              GameScene.blockSize,
              GameScene.blockSize,
              COLORS[this.currentTetriminoType]
            )
            .setOrigin(0);

          this.currentTetrimino.add(block);
        }
      });
    });

    this.updateGhost();
  }

  private softDrop(): void {
    if (this.checkCollision(0, 1, this.currentShape)) {
      this.lockTetrimino();
    } else {
      this.currentPosition.y += 1;
      this.updateTetriminoPosition();
    }
  }

  private hardDrop(): void {
    while (!this.checkCollision(0, 1, this.currentShape)) {
      this.currentPosition.y += 1;
    }
    this.updateTetriminoPosition();
    this.lockTetrimino();
  }

  private checkCollision(
    offsetX: number,
    offsetY: number,
    shape = this.currentShape
  ): boolean {
    const posX = this.currentPosition.x + offsetX;
    const posY = this.currentPosition.y + offsetY;

    return shape.some((row, y) => {
      return row.some((cell, x) => {
        if (cell) {
          const gridX = posX + x;
          const gridY = posY + y;

          // Prüfe Grid-Grenzen
          if (
            gridX < 0 ||
            gridX >= GameScene.gridWidth ||
            gridY >= GameScene.gridHeight ||
            this.grid[gridY][gridX] !== GameScene.emptyGridValue
          ) {
            return true;
          }
        }
        return false;
      });
    });
  }

  private updateTetriminoPosition(): void {
    let blockIndex = 0;
    this.currentShape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const blockX =
            (this.currentPosition.x + x) * GameScene.blockSize +
            this.gridOffsetX;
          const blockY =
            (this.currentPosition.y + y) * GameScene.blockSize +
            this.gridOffsetY;

          const block = this.currentTetrimino.getChildren()[
            blockIndex
          ] as Phaser.GameObjects.Rectangle;
          block.setPosition(blockX, blockY);

          blockIndex++;
        }
      });
    });
  }

  private lockTetrimino(): void {
    this.currentShape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const gridX = this.currentPosition.x + x;
          const gridY = this.currentPosition.y + y;
          this.grid[gridY][gridX] = this.currentTetriminoType;
        }
      });
    });
    this.currentTetrimino.clear(true, true);
    this.checkAndClearLines();
    this.drawLockedBlocks();
    this.spawnTetrimino();
    // ⏱️ 100ms Delay zum Spawnen (wirkt natürlicher), macht aber wahrscheinlich Probleme bei der Update Methode
    // this.time.delayedCall(100, () => {
    //   this.spawnTetrimino();
    // });
  }

  private drawLockedBlocks(): void {
    this.lockedBlocksGroup.clear(true, true);

    this.grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell !== GameScene.emptyGridValue) {
          const block = this.add
            .rectangle(
              x * GameScene.blockSize + this.gridOffsetX,
              y * GameScene.blockSize + this.gridOffsetY,
              GameScene.blockSize,
              GameScene.blockSize,
              COLORS[cell]
            )
            .setOrigin(0);

          this.lockedBlocksGroup.add(block);
        }
      });
    });
  }

  private checkAndClearLines(): void {
    for (let y = GameScene.gridHeight - 1; y >= 0; y--) {
      if (this.grid[y].every((cell) => cell !== GameScene.emptyGridValue)) {
        this.clearLine(y);
        y++; // Zeile erneut prüfen, da alles nachgerutscht ist
      }
    }
  }

  private clearLine(lineIndex: number): void {
    this.grid.splice(lineIndex, 1);
    this.grid.unshift(
      new Array(GameScene.gridWidth).fill(GameScene.emptyGridValue)
    );

    // Später noch Grafik aktualisieren (für jetzt reicht erstmal die Grid-Logik)
  }

  private handleGameOver(): void {
    this.gameOver = true;
    this.music.stop(); // Musik stoppen
    this.scene.start("GameOverScene"); // oder zeig ein Overlay etc.
  }

  /**
   * Updates the scene logic.
   * @param time - Overall time in ms since game started.
   * @param delta - Time in ms since last update call.
   */
  public update(time: number, delta: number) {
    if (time > this.lastFallTime + this.fallInterval) {
      this.softDrop();
      this.lastFallTime = time;
    }
  }
}
