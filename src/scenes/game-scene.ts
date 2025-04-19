import { Soundtrack } from "../audio";
import { COLORS } from "../colors";
import { SHAPE_TYPES, SHAPES, TetriminoShape } from "../shapes";
import { ShapesSpawner, SpawnSystem } from "../spawn";
import { BaseScene } from "./base-scene";
import Phaser from "phaser";
import { Rotation, GetKickData } from "../rotation";

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
  private currentRotationIndex: Rotation = Rotation.SPAWN; // Startrotation
  private currentTetriminoType = "T"; // Start mit T-Tetrimino
  private fallInterval = 1000; // 1 Sekunde pro Block
  private lastFallTime = 0;
  private tetriminoBag: string[] = [];
  private holdType: string | null = null;
  private holdUsedThisTurn: boolean = false;
  private holdGroup!: Phaser.GameObjects.Group;
  private holdBox!: Phaser.GameObjects.Rectangle;
  private previewBox!: Phaser.GameObjects.Rectangle;
  private linesCleared: number = 0;
  private linesText!: Phaser.GameObjects.Text;
  private currentSpawnSystem: SpawnSystem = SpawnSystem.SEVEN_BAG;
  private _gravity: number = 0; // Schwerkraft

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
  private spawner!: ShapesSpawner;
  private lastMoveWasRotation: boolean = false;

  constructor() {
    super(GameScene.CONFIG);
  }

  /* Scene initialization logic. */
  public init(data: unknown) {
    this.gameOver = false;
    this.initializeGrid();
    //this.generateNextQueue();
    this.spawner = new ShapesSpawner(this.currentSpawnSystem);
  }

  public preload() {
    this.load.audio("track2", Soundtrack.track2);
  }

  private createHoldBox(): void {
    const boxX = this.gridOffsetX - GameScene.blockSize * 4;
    const boxY = this.gridOffsetY;
    const boxWidth = GameScene.blockSize * 3;
    const boxHeight = GameScene.blockSize * 3;

    this.holdBox = this.add
      .rectangle(boxX, boxY, boxWidth, boxHeight, 0x000000, 0.3)
      .setOrigin(0)
      .setStrokeStyle(2, 0xffffff, 0.5); // weißer Rahmen mit 50% Deckkraft
    this.add
      .text(boxX, boxY - 24, "HOLD", {
        fontSize: "16px",
        color: "#ffffff",
        fontFamily: "monospace",
      })
      .setOrigin(0, 0);
  }

  private createPreviewBox(): void {
    const boxX =
      this.gridOffsetX + GameScene.gridWidth * GameScene.blockSize + 32;
    const boxY = this.gridOffsetY;
    const boxWidth = GameScene.blockSize * 4;
    const boxHeight = GameScene.blockSize * 10; // genug für 5 Vorschauen
    this.add
      .text(boxX, boxY - 24, "NEXT", {
        fontSize: "16px",
        color: "#ffffff",
        fontFamily: "monospace",
      })
      .setOrigin(0, 0);

    this.previewBox = this.add
      .rectangle(boxX, boxY, boxWidth, boxHeight, 0x000000, 0.3)
      .setOrigin(0)
      .setStrokeStyle(2, 0xffffff, 0.5); // Weißer Rahmen, halbtransparent
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

    this.spawner.generateNextQueue(5); // Generiere 5 Tetriminos für die Vorschau
    this.previewGroup = this.add.group();
    this.currentTetrimino = this.add.group();
    this.ghostGroup = this.add.group();
    this.holdGroup = this.add.group();
    this.renderNextQueue();
    this.lockedBlocksGroup = this.add.group();

    this.music = this.sound.add("track2", {
      loop: true,
      volume: 0.5, // Lautstärke anpassbar
    });
    this.music.play();

    this.linesText = this.add.text(
      this.gridOffsetX + GameScene.gridWidth * GameScene.blockSize + 32,
      this.gridOffsetY + GameScene.blockSize * 11,
      "LINES: 0",
      {
        fontSize: "24px",
        color: "#ffffff",
        fontFamily: "monospace",
      }
    );

    this.initializeGrid();
    this.createGridGraphics();
    this.spawnTetrimino();
    this.createHoldBox();
    this.createPreviewBox();
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
            this.rotateTetrimino("left");
            break;
          case "x":
            this.rotateTetrimino("right");
            break;
          case "arrowdown":
            this.softDrop();
            break;
          case "arrowup":
            this.hardDrop();
            break;
          case " ":
            this.holdTetrimino();
            break;
        }
      });
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

  private spawnHeldTetrimino(): void {
    this.currentRotationIndex = 0;
    this.currentShape = SHAPES[this.currentTetriminoType][0];
    this.currentPosition = { x: 3, y: 0 };

    if (this.checkCollision(0, 0)) {
      this.handleGameOver();
      return;
    }

    this.createTetriminoBlocks();
    this.updateTetriminoPosition();
    this.updateGhost();
  }

  private createTetriminoBlocks(): void {
    this.currentTetrimino?.clear(true, true);

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
  }

  private spawnTetrimino(): void {
    this.currentTetriminoType = this.spawner.NextQueue.shift()!;
    this.spawner.NextQueue.push(this.spawner.getNext()); // korrekt auffüllen

    this.currentRotationIndex = 0;
    if (SHAPE_TYPES.includes(this.currentTetriminoType)) {
      this.currentShape = SHAPES[this.currentTetriminoType][0];
    } else {
      throw new Error("Invalid Tetrimino Type");
    }

    this.currentPosition = { x: 3, y: 0 };

    this.renderNextQueue(); // aktualisiere die Vorschau
    this.createTetriminoBlocks(); // Erstelle die Blöcke für den aktuellen Tetrimino
    this.updateGhost();

    if (this.checkCollision(0, 0)) {
      this.handleGameOver(); // ⛔️ Spiel beenden
      return;
    }
  }

  private renderHold(): void {
    this.holdGroup?.clear(true, true);
    this.holdGroup = this.add.group();

    if (!this.holdType) return;

    const shape = SHAPES[this.holdType][0];

    const cols = shape[0].length;
    const rows = shape.length;

    // Anzahl belegter Zellen berechnen
    const offsetX =
      (GameScene.blockSize * 3 - cols * (GameScene.blockSize / 2)) / 2;
    const offsetY =
      (GameScene.blockSize * 3 - rows * (GameScene.blockSize / 2)) / 2;

    const startX = this.gridOffsetX - GameScene.blockSize * 4 + offsetX;
    const startY = this.gridOffsetY + offsetY;

    shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const block = this.add
            .rectangle(
              startX + x * (GameScene.blockSize / 2),
              startY + y * (GameScene.blockSize / 2),
              GameScene.blockSize / 2,
              GameScene.blockSize / 2,
              COLORS[this.holdType!]
            )
            .setOrigin(0);

          this.holdGroup.add(block);
        }
      });
    });
  }

  private holdTetrimino(): void {
    if (this.holdUsedThisTurn) return;

    this.holdUsedThisTurn = true;
    this.currentTetrimino?.clear(true, true);

    if (this.holdType) {
      const temp = this.currentTetriminoType;
      this.currentTetriminoType = this.holdType;
      this.holdType = temp;
      this.spawnHeldTetrimino();
    } else {
      this.holdType = this.currentTetriminoType;
      this.spawnTetrimino();
    }

    this.renderHold();
  }

  private renderNextQueue(): void {
    this.previewGroup?.clear(true, true);

    const previewBoxHeight = GameScene.blockSize * 10;
    const tetriminoHeight = GameScene.blockSize * 2;
    const previewContentHeight = GameScene.previewSize * tetriminoHeight;
    const startX =
      this.gridOffsetX + GameScene.gridWidth * GameScene.blockSize + 32;

    const adjustedStartY =
      this.gridOffsetY +
      (previewBoxHeight - previewContentHeight) / 2 -
      GameScene.blockSize;

    this.spawner.NextQueue.slice(0, GameScene.previewSize).forEach(
      (type, index) => {
        const shape = SHAPES[type][0];
        const cols = shape[0].length;
        const rows = shape.length;

        const offsetX =
          (GameScene.blockSize * 4 - cols * (GameScene.blockSize / 2)) / 2;
        const offsetY =
          (GameScene.blockSize * 4 - rows * (GameScene.blockSize / 2)) / 2;

        const previewX = startX + offsetX;
        const previewY =
          adjustedStartY + index * GameScene.blockSize * 2 + offsetY;

        shape.forEach((row, y) => {
          row.forEach((cell, x) => {
            if (cell) {
              const block = this.add
                .rectangle(
                  previewX + x * (GameScene.blockSize / 2),
                  previewY + y * (GameScene.blockSize / 2),
                  GameScene.blockSize / 2,
                  GameScene.blockSize / 2,
                  COLORS[type]
                )
                .setOrigin(0);

              this.previewGroup.add(block);
            }
          });
        });
      }
    );
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

  private rotateTetrimino(direction: "left" | "right"): void {
    const from = this.currentRotationIndex;
    const to = this.getNextRotation(from, direction);
    const kicks = GetKickData(this.currentTetriminoType, from, to);
    const shape = SHAPES[this.currentTetriminoType][to];

    for (const kick of kicks) {
      const newX = this.currentPosition.x + kick.x;
      const newY = this.currentPosition.y + kick.y;

      if (!this.checkCollision(kick.x, kick.y, shape)) {
        this.currentRotationIndex = to;
        this.currentShape = shape;
        this.currentPosition.x = newX;
        this.currentPosition.y = newY;
        this.lastMoveWasRotation = true;
        this.createTetriminoBlocks();
        this.updateGhost();
        return;
      }
    }

    // Kein gültiger Kick → keine Rotation
    console.log(`Rotation ${direction} nicht möglich`);
    this.lastMoveWasRotation = false;
  }

  private getNextRotation(
    from: Rotation,
    direction: "left" | "right"
  ): Rotation {
    if (direction === "right") return (from + 1) % 4;
    if (direction === "left") return (from + 3) % 4; // -1 + 4 = +3
    return from;
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

  private canPlaceAt(x: number, y: number, rotation: Rotation): boolean {
    const shape = this.getRotatedShape(this.currentTetriminoType, rotation);
    return !this.checkCollision(x, y, shape);
  }

  private getRotatedShape(type: string, rotation: Rotation): number[][] {
    return SHAPES[type][rotation];
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
            gridY >= GameScene.gridHeight
          ) {
            return true;
          }

          if (
            gridY >= 0 &&
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
    this.holdUsedThisTurn = false;
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
    let clearedLinesCount = 0;
    for (let y = GameScene.gridHeight - 1; y >= 0; y--) {
      if (this.grid[y].every((cell) => cell !== GameScene.emptyGridValue)) {
        this.clearLine(y);
        clearedLinesCount++;
        y++; // Zeile erneut prüfen, da alles nachgerutscht ist
      }
    }

    if (clearedLinesCount > 0) {
      this.linesCleared += clearedLinesCount;
      this.linesText.setText(`LINES: ${this.linesCleared}`);
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

  // private isTSpin(): boolean {
  //   if (this.currentTetriminoType !== "T") return false;
  //   if (!this.lastMoveWasRotation) return false;

  //   let corners = 0;
  //   const cx = this.tetriminoX + 1;
  //   const cy = this.tetriminoY + 1;

  //   const checks = [
  //     { x: cx - 1, y: cy - 1 },
  //     { x: cx + 1, y: cy - 1 },
  //     { x: cx - 1, y: cy + 1 },
  //     { x: cx + 1, y: cy + 1 },
  //   ];

  //   for (const check of checks) {
  //     if (this.grid[check.y]?.[check.x] !== GameScene.emptyGridValue) corners++;
  //   }

  //   return corners >= 3;
  // }

  /**
   * Updates the scene logic.
   * @param time - Overall time in ms since game started.
   * @param delta - Time in ms since last update call.
   */
  public update(time: number, delta: number) {
    if (time > this.lastFallTime + this.fallInterval) {
      for (let x = 0; x < this._gravity; x++) {
        this.softDrop();
      }
      this.lastFallTime = time;
    }
  }
}
