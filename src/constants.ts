export const CANVAS_W = 360;
export const CANVAS_H = 580;
export const WORLD_MIN_X = -180;
export const WORLD_MAX_X = 180;
export const WORLD_MIN_Y = -290;
export const WORLD_MAX_Y = 290;
export const MAX_INSTANCES = 20000;
export const INST_FLOATS = 16;

// Shape catalog for this project: retro miniature kaiju pinball.
// params:
// BOX: unused
// ROUND_BOX: x = corner radius
// CIRCLE: unused
// CAPSULE: x = axis, 0 horizontal / 1 vertical
// TRIANGLE: x = direction, 0 up / 1 down
// RING: x = ring thickness ratio 0..0.5
// GLOW: unused, soft radial sprite
export const SHAPE_BOX = 0;
export const SHAPE_ROUND_BOX = 1;
export const SHAPE_CIRCLE = 2;
export const SHAPE_CAPSULE = 3;
export const SHAPE_TRIANGLE = 4;
export const SHAPE_RING = 5;
export const SHAPE_GLOW = 6;

export type Color = readonly [number, number, number, number];
export const PAL = {
  skyTop: [0.14, 0.20, 0.28, 1] as Color,
  skyBot: [0.08, 0.06, 0.04, 1] as Color,
  ground: [0.12, 0.19, 0.12, 1] as Color,
  road: [0.20, 0.20, 0.20, 1] as Color,
  roadLine: [0.75, 0.72, 0.45, 0.78] as Color,
  shadow: [0.00, 0.00, 0.00, 0.28] as Color,
  target: [1.00, 0.82, 0.12, 1] as Color,
  ball: [1.00, 0.20, 0.10, 1] as Color,
  ballHi: [1.00, 0.75, 0.55, 1] as Color,
  flipper: [1.00, 0.82, 0.12, 1] as Color,
  human: [1.00, 0.82, 0.52, 1] as Color,
  blood: [1.00, 0.18, 0.12, 1] as Color,
  house: [0.70, 0.50, 0.34, 1] as Color,
  townhouse: [0.72, 0.55, 0.40, 1] as Color,
  garage: [0.45, 0.45, 0.45, 1] as Color,
  shop: [0.42, 0.62, 0.82, 1] as Color,
  ramen: [0.84, 0.32, 0.22, 1] as Color,
  convenience: [0.30, 0.78, 0.55, 1] as Color,
  apartment: [0.48, 0.58, 0.70, 1] as Color,
  station: [0.88, 0.78, 0.48, 1] as Color,
  hospital: [0.88, 0.90, 0.94, 1] as Color,
  tower: [0.45, 0.70, 0.90, 1] as Color,
  white: [1.00, 1.00, 1.00, 1] as Color,
  dark: [0.08, 0.08, 0.08, 1] as Color,
};

export const BUILDING_W = new Float32Array([16, 18, 20, 22, 16, 24, 24, 50, 35, 35]);
export const BUILDING_H = new Float32Array([20, 24, 14, 25, 20, 22, 40, 36, 50, 70]);
export const BUILDING_HP = new Int8Array([1, 1, 1, 1, 1, 1, 2, 3, 3, 3]);
export const BUILDING_SCORE = new Int32Array([100, 120, 80, 180, 160, 350, 600, 2500, 1800, 2500]);
export const BUILDING_COLORS: Color[] = [PAL.house, PAL.townhouse, PAL.garage, PAL.shop, PAL.ramen, PAL.convenience, PAL.apartment, PAL.station, PAL.hospital, PAL.tower];
export const B_HOUSE = 0;
export const B_TOWNHOUSE = 1;
export const B_GARAGE = 2;
export const B_SHOP = 3;
export const B_RAMEN = 4;
export const B_CONVENIENCE = 5;
export const B_APARTMENT = 6;
export const B_STATION = 7;
export const B_HOSPITAL = 8;
export const B_TOWER = 9;
