/*
  Speed curve levels in rows/second.
  Normally gravity is defined as 'G' where 1G means 1 row per Frame.
  As Gridfall runs at 60 FPS, 1G = 60 rows/second and 20G = 1200 rows/second.
  These values are used to determine the fall speed of shapes at different levels.
*/
export const gravityLevels: number[] = [
  1.0, // Level 1
  1.26, // Level 2
  1.62, // Level 3
  2.11, // Level 4
  2.82, // Level 5
  3.82, // Level 6
  5.29, // Level 7
  7.46, // Level 8
  11.24, // Level 9
  16.95, // Level 10
  25.64, // Level 11
  38.46, // Level 12
  58.82, // Level 13
  90.91, // Level 14
  142.86, // Level 15 - end of Ascent mode

  // 16+ only for Infinity mode
  200.0, // Level 16
  303.03, // Level 17
  454.55, // Level 18
  666.67, // Level 19
  1000.0, // Level 20

  1020.0, // Level 21
  1040.0, // Level 22
  1060.0, // Level 23
  1080.0, // Level 24
  1100.0, // Level 25
  1120.0, // Level 26
  1140.0, // Level 27
  1160.0, // Level 28
  1180.0, // Level 29
  1200.0, // Level 30 // 20G = 1200 rows/second
];
