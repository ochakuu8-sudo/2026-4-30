export const CANVAS_W = 360;
export const CANVAS_H = 580;
export const WORLD_MIN_X = -180;
export const WORLD_MAX_X = 180;
export const WORLD_MIN_Y = -290;
export const WORLD_MAX_Y = 290;
export const MAX_INSTANCES = 20000;
export const INST_FLOATS = 16;

export const SHAPE_BOX = 0;
export const SHAPE_ROUND_BOX = 1;
export const SHAPE_CIRCLE = 2;
export const SHAPE_CAPSULE = 3;
export const SHAPE_TRIANGLE = 4;
export const SHAPE_RING = 5;
export const SHAPE_GLOW = 6;

export type Color = readonly [number, number, number, number];
export const PAL = {
  wallTop: [0.32, 0.16, 0.08, 1] as Color,
  wallBot: [0.10, 0.05, 0.03, 1] as Color,
  counter: [0.48, 0.25, 0.12, 1] as Color,
  counterDark: [0.25, 0.11, 0.06, 1] as Color,
  bowlOuter: [0.95, 0.92, 0.82, 1] as Color,
  bowlRim: [0.20, 0.08, 0.04, 1] as Color,
  bowlInner: [1.00, 0.96, 0.82, 1] as Color,
  soupShoyu: [0.43, 0.20, 0.08, 1] as Color,
  soupMiso: [0.78, 0.45, 0.16, 1] as Color,
  soupShio: [0.95, 0.78, 0.42, 1] as Color,
  soupTonkotsu: [0.92, 0.82, 0.58, 1] as Color,
  noodle: [1.00, 0.82, 0.32, 1] as Color,
  chashu: [0.75, 0.36, 0.22, 1] as Color,
  egg: [1.00, 0.95, 0.72, 1] as Color,
  yolk: [1.00, 0.70, 0.12, 1] as Color,
  nori: [0.05, 0.16, 0.08, 1] as Color,
  negi: [0.45, 0.90, 0.34, 1] as Color,
  menma: [0.72, 0.48, 0.20, 1] as Color,
  naruto: [1.00, 0.92, 0.95, 1] as Color,
  pink: [1.00, 0.25, 0.48, 1] as Color,
  steam: [1.00, 0.94, 0.82, 0.55] as Color,
  tray: [0.12, 0.07, 0.04, 1] as Color,
  text: [1.00, 0.88, 0.50, 1] as Color,
  good: [0.40, 1.00, 0.45, 1] as Color,
  bad: [1.00, 0.24, 0.18, 1] as Color,
  white: [1.00, 1.00, 1.00, 1] as Color,
  shadow: [0.00, 0.00, 0.00, 0.30] as Color,
};
