import { Color, PAL, SHAPE_BOX, SHAPE_CAPSULE, SHAPE_CIRCLE, SHAPE_GLOW, SHAPE_RING, SHAPE_ROUND_BOX } from './constants';
import { writeInst } from './renderer';

export type SoupKind = 'shoyu' | 'miso' | 'shio' | 'tonkotsu';
export type ToppingKind = 'chashu' | 'egg' | 'nori' | 'negi' | 'menma' | 'naruto';

const SOUP_COLOR: Record<SoupKind, Color> = {
  shoyu: PAL.soupShoyu,
  miso: PAL.soupMiso,
  shio: PAL.soupShio,
  tonkotsu: PAL.soupTonkotsu,
};

export function soupColor(kind: SoupKind | null): Color {
  return kind ? SOUP_COLOR[kind] : PAL.bowlInner;
}

export function drawKitchen(buf: Float32Array, idx: number, heat: number): number {
  writeInst(buf, idx++, 0, -245, 360, 90, PAL.counter, 0, SHAPE_BOX);
  writeInst(buf, idx++, 0, -202, 360, 10, PAL.counterDark, 0, SHAPE_BOX);
  writeInst(buf, idx++, -124, 148, 70, 86, PAL.counterDark, 0, SHAPE_ROUND_BOX, 0.10);
  writeInst(buf, idx++, 0, 148, 70, 86, PAL.counterDark, 0, SHAPE_ROUND_BOX, 0.10);
  writeInst(buf, idx++, 124, 148, 70, 86, PAL.counterDark, 0, SHAPE_ROUND_BOX, 0.10);
  writeInst(buf, idx++, -124, 156, 50, 50, PAL.soupShoyu, 0, SHAPE_CIRCLE, 0, 0, 0, 0, 0.15);
  writeInst(buf, idx++, 0, 156, 50, 50, PAL.soupMiso, 0, SHAPE_CIRCLE, 0, 0, 0, 0, 0.15);
  writeInst(buf, idx++, 124, 156, 50, 50, PAL.soupTonkotsu, 0, SHAPE_CIRCLE, 0, 0, 0, 0, 0.15);
  for (let i = 0; i < 7; i++) {
    const x = -150 + i * 50;
    writeInst(buf, idx++, x, 88 + Math.sin(heat + i) * 2, 8, 24, PAL.steam, -0.25 + i * 0.08, SHAPE_CAPSULE, 1, 0, 0, 0, 0.25, 0.02);
  }
  return idx;
}

export function drawBowl(buf: Float32Array, idx: number, soup: SoupKind | null, noodles: boolean, toppings: ToppingKind[], wobble: number): number {
  writeInst(buf, idx++, 4, -82, 226, 132, PAL.shadow, 0, SHAPE_CIRCLE, 0, 0, 0, 0, 0, 0.012);
  writeInst(buf, idx++, 0, -88, 230, 138, PAL.bowlOuter, 0, SHAPE_CIRCLE, 0, 0, 0, 0, 0.05, 0.008);
  writeInst(buf, idx++, 0, -82, 196, 100, PAL.bowlRim, 0, SHAPE_CIRCLE, 0, 0, 0, 0, 0.08, 0.006);
  writeInst(buf, idx++, 0, -78, 178, 84, soupColor(soup), 0, SHAPE_CIRCLE, 0, 0, 0, 0, soup ? 0.12 : 0, 0.006);
  if (noodles) {
    for (let i = 0; i < 9; i++) {
      const y = -83 + (i % 3) * 14;
      const x = -54 + Math.floor(i / 3) * 36;
      writeInst(buf, idx++, x, y + Math.sin(wobble + i) * 2, 58, 7, PAL.noodle, Math.sin(wobble * 0.9 + i) * 0.16, SHAPE_CAPSULE, 0, 0, 0, 0, 0.04, 0.006);
    }
  }
  for (const top of toppings) idx = drawTopping(buf, idx, top, wobble);
  writeInst(buf, idx++, 0, -88, 232, 32, PAL.bowlOuter, 0, SHAPE_CAPSULE, 0, 0, 0, 0, 0, 0.006);
  writeInst(buf, idx++, 0, -86, 204, 15, PAL.bowlRim, 0, SHAPE_CAPSULE, 0, 0, 0, 0, 0, 0.006);
  return idx;
}

function drawTopping(buf: Float32Array, idx: number, top: ToppingKind, t: number): number {
  const bob = Math.sin(t * 1.4) * 1.5;
  if (top === 'chashu') {
    writeInst(buf, idx++, -48, -52 + bob, 52, 32, PAL.chashu, -0.22, SHAPE_CIRCLE);
    writeInst(buf, idx++, -48, -52 + bob, 34, 18, [0.95, 0.68, 0.48, 1], -0.22, SHAPE_CIRCLE);
  } else if (top === 'egg') {
    writeInst(buf, idx++, 36, -50 + bob, 42, 30, PAL.egg, 0.20, SHAPE_CIRCLE);
    writeInst(buf, idx++, 39, -50 + bob, 19, 17, PAL.yolk, 0.20, SHAPE_CIRCLE, 0, 0, 0, 0, 0.08);
  } else if (top === 'nori') {
    writeInst(buf, idx++, 62, -28 + bob, 34, 58, PAL.nori, -0.18, SHAPE_ROUND_BOX, 0.05);
  } else if (top === 'negi') {
    for (let i = 0; i < 9; i++) writeInst(buf, idx++, -10 + (i % 3) * 11, -40 + Math.floor(i / 3) * 9 + bob, 8, 8, PAL.negi, 0, SHAPE_RING, 0.28, 0, 0, 0, 0.05, 0.006);
  } else if (top === 'menma') {
    for (let i = 0; i < 4; i++) writeInst(buf, idx++, -18 + i * 10, -24 + bob, 8, 38, PAL.menma, 0.48, SHAPE_ROUND_BOX, 0.08);
  } else if (top === 'naruto') {
    writeInst(buf, idx++, 0, -56 + bob, 34, 34, PAL.naruto, 0, SHAPE_CIRCLE);
    writeInst(buf, idx++, 0, -56 + bob, 20, 20, PAL.pink, 0, SHAPE_RING, 0.22, 0, 0, 0, 0.04, 0.006);
  }
  return idx;
}

export function drawGrade(buf: Float32Array, idx: number, value: number): number {
  const color = value > 0 ? PAL.good : PAL.bad;
  writeInst(buf, idx++, 0, 46, 112, 28, color, 0, SHAPE_ROUND_BOX, 0.10, 0, 0, 0, 0.25);
  return idx;
}

export function drawSpark(buf: Float32Array, idx: number, x: number, y: number, life: number, good: boolean): number {
  const c = good ? PAL.good : PAL.bad;
  writeInst(buf, idx++, x, y, 10 + life * 24, 10 + life * 24, c, 0, SHAPE_GLOW, 0, 0, 0, 0, 0.8, 0.03);
  return idx;
}
