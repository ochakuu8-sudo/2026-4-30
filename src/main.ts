import { CANVAS_H, CANVAS_W, PAL } from './constants';
import { Renderer } from './renderer';
import { drawBowl, drawGrade, drawKitchen, drawSpark, SoupKind, ToppingKind } from './entities';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const wrap = document.getElementById('wrap') as HTMLElement;
const scoreEl = document.getElementById('score-display') as HTMLElement;
const orderEl = document.getElementById('target-display') as HTMLElement;
const servedEl = document.getElementById('destroy-display') as HTMLElement;
const timeFill = document.getElementById('life-fill') as HTMLElement;
const title = document.getElementById('title') as HTMLElement;
const result = document.getElementById('result') as HTMLElement;
const choices = document.getElementById('choices') as HTMLElement;

function applyScale() {
  wrap.style.transform = `scale(${Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H)})`;
}
window.addEventListener('resize', applyScale);
applyScale();

const renderer = new Renderer(canvas);
const buf = renderer.buf;

const soupOptions: { id: SoupKind; label: string }[] = [
  { id: 'shoyu', label: '醤油' },
  { id: 'miso', label: '味噌' },
  { id: 'shio', label: '塩' },
  { id: 'tonkotsu', label: '豚骨' },
];
const noodleOptions = [
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

type Step = 'tare' | 'soup' | 'noodle' | 'topping' | 'serve';
type ChoiceItem = { label: string; action: () => void; primary?: boolean; disabled?: boolean };
type Order = {
  soup: SoupKind;
  noodle: string;
  toppings: ToppingKind[];
};
type Bowl = {
  tare: boolean;
  soup: SoupKind | null;
  noodle: string | null;
  toppings: ToppingKind[];
};
type Spark = { x: number; y: number; life: number; good: boolean };

let started = false;
let gameOver = false;
let score = 0;
let served = 0;
let streak = 0;
let timeLeft = 60;
let step: Step = 'tare';
let order: Order;
let bowl: Bowl;
let lastTime = 0;
let messageTimer = 0;
let messageGood = 0;
const sparks: Spark[] = [];

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
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
  return soupOptions.find(v => v.id === id)!.label;
}
function labelNoodle(id: string): string {
  return noodleOptions.find(v => v.id === id)!.label;
}
function labelTop(id: ToppingKind): string {
  return toppingOptions.find(v => v.id === id)!.label;
}

function orderText(): string {
  return `ORDER ${labelSoup(order.soup)} / 麺${labelNoodle(order.noodle)}\n具: ${order.toppings.map(labelTop).join('・')}`;
}

function updateHud() {
  scoreEl.textContent = `SCORE ${score.toLocaleString()}  x${Math.max(1, streak)}`;
  orderEl.textContent = started && !gameOver ? orderText() : 'ORDER';
  servedEl.textContent = `SERVED ${served}`;
  timeFill.style.width = `${Math.max(0, Math.min(100, timeLeft / 60 * 100))}%`;
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
      if (!started || gameOver) return;
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
    setButtons([{ label: 'タレを入れる', action: () => { bowl.tare = true; step = 'soup'; addSpark(true); refreshChoices(); }, primary: true }]);
  } else if (step === 'soup') {
    setButtons(soupOptions.map(s => ({ label: `${s.label}スープ`, action: () => { bowl.soup = s.id; step = 'noodle'; addSpark(s.id === order.soup); refreshChoices(); } })));
  } else if (step === 'noodle') {
    setButtons(noodleOptions.map(n => ({ label: `麺 ${n.label}`, action: () => { bowl.noodle = n.id; step = 'topping'; addSpark(n.id === order.noodle); refreshChoices(); } })));
  } else if (step === 'topping') {
    const buttons: ChoiceItem[] = toppingOptions.map(t => ({
      label: bowl.toppings.includes(t.id) ? `✓ ${t.label}` : t.label,
      disabled: bowl.toppings.includes(t.id),
      action: () => {
        if (!bowl.toppings.includes(t.id)) bowl.toppings.push(t.id);
        addSpark(order.toppings.includes(t.id));
        if (bowl.toppings.length >= order.toppings.length) step = 'serve';
        refreshChoices();
      },
    }));
    buttons.push({ label: '提供する', action: serve, primary: true, disabled: bowl.toppings.length === 0 });
    setButtons(buttons);
  } else {
    setButtons([{ label: '提供する', action: serve, primary: true }]);
  }
}

function addSpark(good: boolean) {
  sparks.push({ x: -72 + Math.random() * 144, y: -42 + Math.random() * 70, life: 1, good });
}

function serve() {
  let matches = 0;
  if (bowl.tare) matches++;
  if (bowl.soup === order.soup) matches++;
  if (bowl.noodle === order.noodle) matches++;
  const wanted = new Set(order.toppings);
  const got = new Set(bowl.toppings);
  for (const t of wanted) if (got.has(t)) matches++;
  for (const t of got) if (!wanted.has(t)) matches--;
  const total = 3 + order.toppings.length;
  const perfect = matches === total;
  const gained = Math.max(0, matches) * 120 + (perfect ? 700 + streak * 80 : 0);
  score += gained;
  served++;
  streak = perfect ? streak + 1 : 0;
  timeLeft = Math.min(60, timeLeft + (perfect ? 5 : 1));
  messageGood = perfect ? 1 : -1;
  messageTimer = 0.7;
  addSpark(perfect);
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
  messageTimer = 0;
  messageGood = 0;
  gameOver = false;
  result.classList.remove('show');
  title.classList.remove('show');
  started = true;
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
  if (!started || gameOver) return;
  timeLeft -= dt;
  if (messageTimer > 0) messageTimer = Math.max(0, messageTimer - dt);
  for (let i = sparks.length - 1; i >= 0; i--) {
    sparks[i].life -= dt * 1.8;
    sparks[i].y += dt * 36;
    if (sparks[i].life <= 0) sparks.splice(i, 1);
  }
  if (timeLeft <= 0) {
    timeLeft = 0;
    updateHud();
    finish();
    return;
  }
  updateHud();
}

function render() {
  const gl = renderer.gl;
  gl.clearColor(0.08, 0.035, 0.02, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  const t = performance.now() * 0.002;
  renderer.drawBackground(PAL.wallTop, PAL.wallBot);
  let idx = 0;
  idx = drawKitchen(buf, idx, t);
  idx = drawBowl(buf, idx, bowl?.soup ?? null, !!bowl?.noodle, bowl?.toppings ?? [], t);
  if (messageTimer > 0) idx = drawGrade(buf, idx, messageGood);
  for (const s of sparks) idx = drawSpark(buf, idx, s.x, s.y, s.life, s.good);
  renderer.draw(idx);
}

function loop(now: number) {
  const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

order = makeOrder();
bowl = emptyBowl();
updateHud();
requestAnimationFrame(t => {
  lastTime = t;
  requestAnimationFrame(loop);
});
