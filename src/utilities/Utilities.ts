/*
 *   Collection of Phaser Convienience Utilities
 */
import Phaser from "phaser";

/**
 * Obtains the bounding rectangle that contains all GameObjects in the given group.
 * @param group The group to obtain the bounding box from
 * @returns A Phaser.Geom.Rectangle representing the bounding box of the group
 */
export const GetGroupBounds = (
  group: Phaser.GameObjects.Group
): Phaser.Geom.Rectangle => {
  const bounds = new Phaser.Geom.Rectangle(
    Number.MAX_VALUE,
    Number.MAX_VALUE,
    0,
    0
  );

  group.getChildren().forEach((obj) => {
    const go = obj as Phaser.GameObjects.GameObject & {
      getBounds?: () => Phaser.Geom.Rectangle;
    };
    if (go.getBounds) {
      const b = go.getBounds();
      bounds.x = Math.min(bounds.x, b.x);
      bounds.y = Math.min(bounds.y, b.y);
      bounds.width = Math.max(bounds.width, b.right - bounds.x);
      bounds.height = Math.max(bounds.height, b.bottom - bounds.y);
    }
  });

  return bounds;
};
