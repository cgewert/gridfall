import { describe, it, expect } from "vitest";
import {
  MillisecondsToTimeString,
  MillisecondsToTimeStringCompact,
} from "./game";

describe("MillisecondsToTimeString (hh:mm:ss.mmm)", () => {
  it("formats edge cases", () => {
    const cases: Array<[number, string]> = [
      [0, "00:00:00.000"],
      [1, "00:00:00.001"],
      [999, "00:00:00.999"],
      [1000, "00:00:01.000"],
      [60_000, "00:01:00.000"],
      [3_600_000, "01:00:00.000"],
      [3_726_005, "01:02:06.006"], // 1h 2m 6s 5ms
    ];

    for (const [ms, expected] of cases) {
      expect(MillisecondsToTimeString(ms)).toBe(expected);
    }
  });
});

describe("MillisecondsToTimeStringCompact (mm:ss.mmm)", () => {
  it("formats edge cases", () => {
    const cases: Array<[number, string]> = [
      [0, "00:00.000"],
      [999, "00:00.999"],
      [1000, "00:01.000"],
      [60_000, "01:00.000"],
      [3_599_999, "59:59.999"],
    ];

    for (const [ms, expected] of cases) {
      expect(MillisecondsToTimeStringCompact(ms)).toBe(expected);
    }
  });
});
