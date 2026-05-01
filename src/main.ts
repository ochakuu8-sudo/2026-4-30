const CANVAS_W = 360;
const CANVAS_H = 580;

type SoupKind = 'shoyu' | 'miso' | 'shio' | 'tonkotsu';
type NoodleKind = 'kata' | 'normal' | 'yawa';
type ToppingKind = 'chashu' | 'egg' | 'nori' | 'negi' | 'menma' | 'naruto';
type Step = 'tare' | 'soup' | 'noodle' | 'topping' | 'serve';
type ChoiceItem = { label: string; action: () => void; primary?: boolean; disabled?: boolean };
type Order = { soup: SoupKind; noodle: NoodleKind; toppings: ToppingKind[] };
type Bowl = { tare: boolean; soup: SoupKind | null; noodle: NoodleKind | null; toppings: ToppingKind[] };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; good: boolean };

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('Canvas 2D context is not available');

const wrap = document.getElementById('wrap') as HTMLElement;
const scoreEl = document.getElementById('score-display') as HTMLElement;
const orderEl = document.getElementById('target-display') as HTMLElement;
const servedEl = document.getElementById('destroy-display') as HTMLElement;
const timeFill = document.getElementById('life-fill') as HTMLElement;
const title = document.getElementById('title') as HTMLElement;
const result = document.getElementById('result') as HTMLElement;
const choices = document.getElementById('choices') as HTMLElement;

const soupOptions: { id: SoupKind; label: string; color: string }[] = [
  { id: 'shoyu', label: '醤油', color: '#7a3517' },
  { id: 'miso', label: '味噌', color: '#c96c22' },
  { id: 'shio', label: '塩', color: '#f2c76b' },
  { id: 'tonkotsu', label: '豚骨', color: '#ead49a' },
];
const noodleOptions: { id: NoodleKind; label: string }[] = [
  { id: 'kata', label: '硬め' },
  { id: 'normal', label: '普通' },
  { id: 'yawa', label: '柔め' },
];
const toppingOptions: { id: ToppingKind; label: string }[] = [
  { id: 'chashu', label: 'チャーシュー' },
  { id: 'egg', label: '味玉' },
  { id: 'nori', label: '海苔' },
  { id: 'negi', label: 'ネギ' },
  { id: 'menma', label: 'メンマ' },
  { id: 'naruto', label: 'ナルト' },
];

let started = false;
let gameOver = false;
let score = 0;
let served = 0;
let streak = 0;
let timeLeft = 60;
let step: Step = 'tare';
let order: Order = makeOrder();
let bowl: Bowl = emptyBowl();
let lastTime = 0;
let feedbackText = '';
let feedbackTimer = 0;
const sparks: Spark[] = [];

function applyScale() {
  wrap.style.transform = `scale(${Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H)})`;
}
window.addEventListener('resize', applyScale);
applyScale();

function rand<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function makeOrder(): Order {
  const shuffled = [...toppingOptions].sort(() => Math.random() - 0.5);
  const count = 2 + Math.floor(Math.random() * 2);
  return {
    soup: rand(soupOptions).id,
    noodle: rand(noodleOptions).id,
    toppings: shuffled.slice(0, count).map(t => t.id),
  };
}

function emptyBowl(): Bowl {
  return { tare: false, soup: null, noodle: null, toppings: [] };
}

function labelSoup(id: SoupKind): string {
  return soupOptions.find(v => v.id === id)?.label ?? id;
}
function labelNoodle(id: NoodleKind): string {
  return noodleOptions.find(v => v.id === id)?.label ?? id;
}
function labelTop(id: ToppingKind): string {
  return toppingOptions.find(v => v.id === id)?.label ?? id;
}
function soupColor(id: SoupKind | null): string {
  return soupOptions.find(v => v.id === id)?.color ?? '#fff2c8';
}

function orderText(): string {
  return `ORDER ${labelSoup(order.soup)} / 麺${labelNoodle(order.noodle)}\n具: ${order.toppings.map(labelTop).join('・')}`;
}

function updateHud() {
  scoreEl.textContent = `SCORE ${score.toLocaleString()}  x${Math.max(1, streak)}`;
  orderEl.textContent = started && !gameOver ? orderText() : 'ORDER';
  servedEl.textContent = `SERVED ${served}`;
  timeFill.style.width = `${Math.max(0, Math.min(100, (timeLeft / 60) * 100))}%`;
}

function setButtons(items: ChoiceItem[]) {
  choices.innerHTML = '';
  for (const item of items) {
    const btn = document.createElement('button');
    btn.className = `choice${item.primary ? ' primary' : ''}${item.disabled ? ' disabled' : ''}`;
    btn.textContent = item.label;
    btn.disabled = !!item.disabled;
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      e.stopPropagation();
      if (!started || gameOver || item.disabled) return;
      item.action();
    });
    choices.appendChild(btn);
  }
}

function refreshChoices() {
  if (!started || gameOver) {
    choices.innerHTML = '';
    return;
  }

  if (step === 'tare') {
    setButtons([{ label: 'タレを入れる', primary: true, action: () => pickTare() }]);
    return;
  }
  if (step === 'soup') {
    setButtons(soupOptions.map(s => ({ label: `${s.label}スープ`, action: () => pickSoup(s.id) })));
    return;
  }
  if (step === 'noodle') {
    setButtons(noodleOptions.map(n => ({ label: `麺 ${n.label}`, action: () => pickNoodle(n.id) })));
    return;
  }
  if (step === 'topping') {
    const buttons: ChoiceItem[] = toppingOptions.map(t => ({
      label: bowl.toppings.includes(t.id) ? `✓ ${t.label}` : t.label,
      disabled: bowl.toppings.includes(t.id),
      action: () => pickTopping(t.id),
    }));
    buttons.push({ label: '提供する', primary: true, disabled: bowl.toppings.length === 0, action: serve });
    setButtons(buttons);
    return;
  }
  setButtons([{ label: '提供する', primary: true, action: serve }]);
}

function pickTare() {
  bowl.tare = true;
  step = 'soup';
  pop(true, 'タレOK');
  refreshChoices();
}
function pickSoup(id: SoupKind) {
  bowl.soup = id;
  step = 'noodle';
  pop(id === order.soup, id === order.soup ? 'スープOK' : '違うスープ');
  refreshChoices();
}
function pickNoodle(id: NoodleKind) {
  bowl.noodle = id;
  step = 'topping';
  pop(id === order.noodle, id === order.noodle ? '麺OK' : '麺が違う');
  refreshChoices();
}
function pickTopping(id: ToppingKind) {
  if (!bowl.toppings.includes(id)) bowl.toppings.push(id);
  pop(order.toppings.includes(id), order.toppings.includes(id) ? '具材OK' : '余計な具材');
  if (bowl.toppings.length >= order.toppings.length) step = 'serve';
  refreshChoices();
}

function pop(good: boolean, text: string) {
  feedbackText = text;
  feedbackTimer = 0.75;
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 90;
    sparks.push({
      x: 180 + (Math.random() - 0.5) * 120,
      y: 220 + (Math.random() - 0.5) * 70,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 30,
      life: 0.55 + Math.random() * 0.35,
      maxLife: 0.9,
      good,
    });
  }
}

function scoreBowl() {
  let matches = 0;
  if (bowl.tare) matches++;
  if (bowl.soup === order.soup) matches++;
  if (bowl.noodle === order.noodle) matches++;
  const wanted = new Set(order.toppings);
  const got = new Set(bowl.toppings);
  for (const t of wanted) if (got.has(t)) matches++;
  for (const t of got) if (!wanted.has(t)) matches--;
  const total = 3 + order.toppings.length;
  return { matches, total, perfect: matches === total };
}

function serve() {
  const judged = scoreBowl();
  const gained = Math.max(0, judged.matches) * 120 + (judged.perfect ? 700 + streak * 80 : 0);
  score += gained;
  served++;
  streak = judged.perfect ? streak + 1 : 0;
  timeLeft = Math.min(60, timeLeft + (judged.perfect ? 5 : 1));
  pop(judged.perfect, judged.perfect ? `完璧 +${gained}` : `${judged.matches}/${judged.total} +${gained}`);
  order = makeOrder();
  bowl = emptyBowl();
  step = 'tare';
  refreshChoices();
  updateHud();
}

function reset() {
  score = 0;
  served = 0;
  streak = 0;
  timeLeft = 60;
  step = 'tare';
  order = makeOrder();
  bowl = emptyBowl();
  sparks.length = 0;
  feedbackText = '';
  feedbackTimer = 0;
  gameOver = false;
  started = true;
  title.classList.remove('show');
  result.classList.remove('show');
  refreshChoices();
  updateHud();
}

function finish() {
  gameOver = true;
  result.textContent = `営業終了！\nSCORE ${score.toLocaleString()}\n提供 ${served} 杯\n\nTAP / CLICK TO RETRY`;
  result.classList.add('show');
  refreshChoices();
}

function globalStart(e: Event) {
  if ((e.target as HTMLElement).closest('.choice')) return;
  if (!started || gameOver) reset();
}
addEventListener('pointerdown', globalStart);

function update(dt: number) {
  if (started && !gameOver) {
    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateHud();
      finish();
    }
  }
  if (feedbackTimer > 0) feedbackTimer = Math.max(0, feedbackTimer - dt);
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.life -= dt;
    s.vy += 90 * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.life <= 0) sparks.splice(i, 1);
  }
  updateHud();
}

function drawRoundedRect(x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fillRound(x: number, y: number, w: number, h: number, r: number, color: string) {
  ctx.fillStyle = color;
  drawRoundedRect(x, y, w, h, r);
  ctx.fill();
}

function fillEllipse(x: number, y: number, rx: number, ry: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function strokeEllipse(x: number, y: number, rx: number, ry: number, color: string, width: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawKitchen(t: number) {
  const g = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  g.addColorStop(0, '#5a2a12');
  g.addColorStop(0.55, '#2a1208');
  g.addColorStop(1, '#130806');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  fillRound(12, 86, 336, 74, 12, '#32170c');
  fillRound(24, 96, 88, 48, 10, '#753818');
  fillRound(136, 96, 88, 48, 10, '#753818');
  fillRound(248, 96, 88, 48, 10, '#753818');
  fillEllipse(68, 120, 28, 16, '#7a3517');
  fillEllipse(180, 120, 28, 16, '#c96c22');
  fillEllipse(292, 120, 28, 16, '#ead49a');

  ctx.strokeStyle = 'rgba(255,230,180,0.38)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const x = 42 + i * 45;
    const y = 76 + Math.sin(t * 2 + i) * 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - 10, y - 18, x + 13, y - 34, x + 1, y - 50);
    ctx.stroke();
  }

  fillRound(0, 394, CANVAS_W, 186, 0, '#7a3a1b');
  ctx.fillStyle = '#3b180b';
  ctx.fillRect(0, 394, CANVAS_W, 10);
  for (let x = -20; x < CANVAS_W; x += 58) {
    ctx.fillStyle = 'rgba(255,225,160,0.08)';
    ctx.fillRect(x, 410, 30, 160);
  }
}

function drawBowl(t: number) {
  fillEllipse(184, 336, 126, 45, 'rgba(0,0,0,0.32)');
  fillEllipse(180, 310, 124, 70, '#f3ead2');
  fillEllipse(180, 292, 106, 48, '#451b0d');
  fillEllipse(180, 288, 92, 39, bowl.soup ? soupColor(bowl.soup) : '#fff0bd');
  strokeEllipse(180, 292, 108, 50, '#fff6dc', 7);

  if (bowl.noodle) drawNoodles(t);
  for (const topping of bowl.toppings) drawTopping(topping, t);

  ctx.fillStyle = '#f3ead2';
  ctx.beginPath();
  ctx.ellipse(180, 330, 122, 38, 0, 0, Math.PI);
  ctx.lineTo(58, 330);
  ctx.closePath();
  ctx.fill();
  strokeEllipse(180, 330, 122, 38, '#451b0d', 5);
}

function drawNoodles(t: number) {
  ctx.strokeStyle = '#ffd56b';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const y = 275 + (i % 3) * 14;
    const start = 112 + Math.floor(i / 3) * 25;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const x = start + k * 18;
      const yy = y + Math.sin(t * 5 + i + k) * 4;
      if (k === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
}

function drawTopping(kind: ToppingKind, t: number) {
  const bob = Math.sin(t * 3) * 2;
  if (kind === 'chashu') {
    fillEllipse(132, 274 + bob, 30, 20, '#b95836');
    fillEllipse(132, 274 + bob, 19, 11, '#f0a06f');
  } else if (kind === 'egg') {
    fillEllipse(218, 274 + bob, 24, 17, '#fff0b8');
    fillEllipse(222, 274 + bob, 10, 9, '#ffae1d');
  } else if (kind === 'nori') {
    ctx.save();
    ctx.translate(244, 286 + bob);
    ctx.rotate(-0.2);
    fillRound(-15, -32, 30, 54, 4, '#0b2a13');
    ctx.restore();
  } else if (kind === 'negi') {
    for (let i = 0; i < 12; i++) {
      const x = 150 + (i % 4) * 12;
      const y = 260 + Math.floor(i / 4) * 10 + bob;
      ctx.strokeStyle = '#8ee85c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (kind === 'menma') {
    ctx.save();
    ctx.translate(176, 264 + bob);
    ctx.rotate(0.45);
    for (let i = 0; i < 4; i++) fillRound(-21 + i * 12, -8, 8, 38, 3, '#bc7a32');
    ctx.restore();
  } else if (kind === 'naruto') {
    fillEllipse(180, 264 + bob, 18, 18, '#fff2f5');
    ctx.strokeStyle = '#ff4f78';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(180, 264 + bob, 9, 0.2, Math.PI * 1.55);
    ctx.stroke();
  }
}

function drawSparks() {
  for (const s of sparks) {
    const alpha = Math.max(0, s.life / s.maxLife);
    ctx.globalAlpha = alpha;
    fillEllipse(s.x, s.y, 5 + 10 * alpha, 5 + 10 * alpha, s.good ? '#72ff76' : '#ff4545');
    ctx.globalAlpha = 1;
  }
}

function drawFeedback() {
  if (feedbackTimer <= 0 || !feedbackText) return;
  const alpha = Math.min(1, feedbackTimer / 0.25);
  ctx.globalAlpha = alpha;
  fillRound(80, 178, 200, 42, 12, feedbackText.includes('違う') || feedbackText.includes('余計') ? '#ff4545' : '#72d94f');
  ctx.fillStyle = '#190905';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(feedbackText, 180, 199);
  ctx.globalAlpha = 1;
}

function drawStartBowl(t: number) {
  const saved = bowl;
  bowl = { tare: true, soup: 'tonkotsu', noodle: 'normal', toppings: ['chashu', 'egg', 'nori', 'negi'] };
  drawBowl(t);
  bowl = saved;
}

function render(now: number) {
  const t = now / 1000;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawKitchen(t);
  if (started) drawBowl(t);
  else drawStartBowl(t);
  drawSparks();
  drawFeedback();
}

function loop(now: number) {
  const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
  lastTime = now;
  update(dt);
  render(now);
  requestAnimationFrame(loop);
}

updateHud();
requestAnimationFrame(now => {
  lastTime = now;
  requestAnimationFrame(loop);
});
