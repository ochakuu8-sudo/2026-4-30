import { BUILDING_COLORS, BUILDING_H, BUILDING_HP, BUILDING_SCORE, BUILDING_W, Color, PAL, SHAPE_BOX, SHAPE_CAPSULE, SHAPE_CIRCLE, SHAPE_GLOW, SHAPE_ROUND_BOX, SHAPE_TRIANGLE } from './constants';
import { writeInst } from './renderer';

export function drawRoad(buf: Float32Array, idx: number, y: number): number {
  writeInst(buf, idx++, 0, y, 360, 14, PAL.road, 0, SHAPE_ROUND_BOX, 0.08, 0, 0, 0, 0, 0.004);
  for (let x = -160; x <= 160; x += 42) writeInst(buf, idx++, x, y, 18, 2, PAL.roadLine, 0, SHAPE_BOX);
  return idx;
}

export function drawGround(buf: Float32Array, idx: number): number {
  writeInst(buf, idx++, 0, -260, 360, 60, PAL.ground, 0, SHAPE_BOX);
  return idx;
}

export function drawBuilding(buf: Float32Array, idx: number, type: number, x: number, y: number, hp: number, alive: number, target: number, flash: number): number {
  const w = BUILDING_W[type], h = BUILDING_H[type];
  const base: Color = flash > 0 ? PAL.white : BUILDING_COLORS[type];
  const alpha = alive > 0 ? 1 : 0.22;
  const color: Color = [base[0], base[1], base[2], alpha];
  writeInst(buf, idx++, x + 2, y + h * 0.5 - 3, w + 8, h + 6, PAL.shadow, 0, SHAPE_ROUND_BOX, 0.12, 0, 0, 0, 0, 0.006);
  writeInst(buf, idx++, x, y + h * 0.5, w, h, color, 0, SHAPE_ROUND_BOX, 0.07, 0, 0, 0, 0, 0.004);
  writeInst(buf, idx++, x, y + h - 4, Math.max(4, w - 5), 3, target ? PAL.target : PAL.dark, 0, SHAPE_BOX);
  if (type === 0 || type === 1) {
    writeInst(buf, idx++, x, y + h + 6, w + 6, 12, color, 0, SHAPE_TRIANGLE, 0, 0, 0, 0, 0, 0.005);
  }
  if (type === 7 || type === 8 || type === 9) {
    for (let row = 0; row < 3; row++) for (let col = -1; col <= 1; col++) writeInst(buf, idx++, x + col * 8, y + 10 + row * 10, 4, 4, PAL.roadLine, 0, SHAPE_ROUND_BOX, 0.15, 0, 0, 0, 0.15, 0.006);
  }
  if (target && alive) {
    writeInst(buf, idx++, x, y - 3, w + 8, 3, PAL.target, 0, SHAPE_BOX, 0, 0, 0, 0, 0.4, 0.004);
    writeInst(buf, idx++, x, y + h + 3, w + 8, 3, PAL.target, 0, SHAPE_BOX, 0, 0, 0, 0, 0.4, 0.004);
    writeInst(buf, idx++, x - w / 2 - 3, y + h / 2, 3, h + 8, PAL.target, 0, SHAPE_BOX, 0, 0, 0, 0, 0.4, 0.004);
    writeInst(buf, idx++, x + w / 2 + 3, y + h / 2, 3, h + 8, PAL.target, 0, SHAPE_BOX, 0, 0, 0, 0, 0.4, 0.004);
  }
  for (let i = 0; i < hp; i++) writeInst(buf, idx++, x - w * 0.5 + 5 + i * 5, y + h + 9, 3, 3, PAL.blood, 0, SHAPE_CIRCLE);
  return idx;
}

export function drawHuman(buf: Float32Array, idx: number, x: number, y: number): number {
  writeInst(buf, idx++, x, y + 2, 3, 6, PAL.human, 0, SHAPE_CAPSULE, 1);
  writeInst(buf, idx++, x, y + 6, 4, 4, PAL.human, 0, SHAPE_CIRCLE);
  return idx;
}

export function drawBall(buf: Float32Array, idx: number, x: number, y: number): number {
  writeInst(buf, idx++, x, y, 32, 32, PAL.ball, 0, SHAPE_CIRCLE, 0, 0, 0, 0, 0.25, 0.008);
  writeInst(buf, idx++, x - 6, y + 7, 8, 8, PAL.ballHi, 0, SHAPE_CIRCLE, 0, 0, 0, 0, 0.15, 0.006);
  return idx;
}

export function drawFlipper(buf: Float32Array, idx: number, x1: number, y1: number, x2: number, y2: number): number {
  const cx = (x1 + x2) * 0.5, cy = (y1 + y2) * 0.5;
  const dx = x2 - x1, dy = y2 - y1;
  writeInst(buf, idx++, cx, cy, Math.hypot(dx, dy), 9, PAL.flipper, Math.atan2(dy, dx), SHAPE_CAPSULE, 0, 0, 0, 0, 0.12, 0.006);
  return idx;
}

export function drawParticle(buf: Float32Array, idx: number, x: number, y: number, r: number, g: number, b: number, a: number): number {
  writeInst(buf, idx++, x, y, 5, 5, [r, g, b, a], 0, SHAPE_GLOW, 0, 0, 0, 0, 0.6, 0.02);
  return idx;
}

export { BUILDING_HP, BUILDING_SCORE, BUILDING_W, BUILDING_H };
