import { CANVAS_H, CANVAS_W, PAL, WORLD_MAX_X, WORLD_MAX_Y, WORLD_MIN_X, WORLD_MIN_Y } from './constants';
import { Renderer } from './renderer';
import { BUILDING_H, BUILDING_HP, BUILDING_SCORE, BUILDING_W, drawBall, drawBuilding, drawFlipper, drawGround, drawHuman, drawParticle, drawRoad } from './entities';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const wrap = document.getElementById('wrap') as HTMLElement;
const scoreEl = document.getElementById('score-display') as HTMLElement;
const targetEl = document.getElementById('target-display') as HTMLElement;
const destroyEl = document.getElementById('destroy-display') as HTMLElement;
const fuelFill = document.getElementById('life-fill') as HTMLElement;
const title = document.getElementById('title') as HTMLElement;
const result = document.getElementById('result') as HTMLElement;

function applyScale() { wrap.style.transform = `scale(${Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H)})`; }
window.addEventListener('resize', applyScale);
applyScale();

const renderer = new Renderer(canvas);
const buf = renderer.buf;

const MAX_BUILDINGS = 32;
const MAX_HUMANS = 96;
const MAX_PARTICLES = 512;
const buildingType = new Int8Array(MAX_BUILDINGS);
const buildingTarget = new Int8Array(MAX_BUILDINGS);
const buildingAlive = new Int8Array(MAX_BUILDINGS);
const buildingHp = new Int8Array(MAX_BUILDINGS);
const buildingFlash = new Float32Array(MAX_BUILDINGS);
const buildingX = new Float32Array(MAX_BUILDINGS);
const buildingY = new Float32Array(MAX_BUILDINGS);
let buildingCount = 0;

const humanAlive = new Int8Array(MAX_HUMANS);
const humanX = new Float32Array(MAX_HUMANS);
const humanY = new Float32Array(MAX_HUMANS);
const humanVx = new Float32Array(MAX_HUMANS);
const humanVy = new Float32Array(MAX_HUMANS);
let humanCount = 0;

const particleLife = new Float32Array(MAX_PARTICLES);
const particleX = new Float32Array(MAX_PARTICLES);
const particleY = new Float32Array(MAX_PARTICLES);
const particleVx = new Float32Array(MAX_PARTICLES);
const particleVy = new Float32Array(MAX_PARTICLES);
const particleR = new Float32Array(MAX_PARTICLES);
const particleG = new Float32Array(MAX_PARTICLES);
const particleB = new Float32Array(MAX_PARTICLES);

let ballX = 0, ballY = -210, ballVx = 0, ballVy = 8;
let pressed = false, started = false, cleared = false, gameOver = false;
let fuel = 100, score = 0, lastTime = 0;
const targetRequired = 3;
const destroyRequired = 0.8;

function addBuilding(t: number, x: number, y: number, target: number) {
  const i = buildingCount++;
  buildingType[i] = t; buildingX[i] = x; buildingY[i] = y; buildingTarget[i] = target; buildingAlive[i] = 1; buildingHp[i] = BUILDING_HP[t]; buildingFlash[i] = 0;
}
function reset() {
  buildingCount = 0;
  addBuilding(0,-142,-220,0); addBuilding(1,-104,-216,0); addBuilding(2,-66,-224,0); addBuilding(5,-12,-218,1); addBuilding(0,48,-220,0); addBuilding(0,104,-218,0);
  addBuilding(4,-132,-118,0); addBuilding(3,-92,-114,0); addBuilding(3,-50,-114,0); addBuilding(6,12,-128,1); addBuilding(1,82,-116,0); addBuilding(2,132,-124,0);
  addBuilding(0,-142,-22,0); addBuilding(0,-100,-20,0); addBuilding(4,-52,-24,0); addBuilding(7,26,-34,1); addBuilding(3,106,-22,0); addBuilding(0,150,-20,0);
  addBuilding(8,-104,88,1); addBuilding(9,-12,82,1); addBuilding(6,82,92,0); addBuilding(5,144,100,0);

  humanCount = 60;
  for (let i=0;i<humanCount;i++) { humanAlive[i]=1; humanX[i]=-160+Math.random()*320; humanY[i]=-175+Math.random()*310; humanVx[i]=(Math.random()*2-1)*18; humanVy[i]=(Math.random()*2-1)*18; }
  for (let i=0;i<MAX_PARTICLES;i++) particleLife[i]=0;
  ballX=0; ballY=-210; ballVx=0; ballVy=8; fuel=100; score=0; started=false; cleared=false; gameOver=false;
  title.classList.add('show'); result.classList.remove('show'); updateHud();
}
function targetDone(){ let n=0; for(let i=0;i<buildingCount;i++) if(buildingTarget[i] && !buildingAlive[i]) n++; return n; }
function destroyRatio(){ let live=0; for(let i=0;i<buildingCount;i++) if(buildingAlive[i]) live++; return (buildingCount-live)/buildingCount; }
function updateHud(){ scoreEl.textContent=`SCORE ${score.toLocaleString()}`; targetEl.textContent=`TARGET ${targetDone()}/${targetRequired}`; destroyEl.textContent=`DEST ${Math.floor(destroyRatio()*100)}%`; fuelFill.style.width=`${Math.max(0,Math.min(100,fuel))}%`; }
function spawnParticle(x:number,y:number,r:number,g:number,b:number){ for(let i=0;i<MAX_PARTICLES;i++){ if(particleLife[i]<=0){ particleLife[i]=0.45+Math.random()*0.25; particleX[i]=x; particleY[i]=y; particleVx[i]=(Math.random()*2-1)*100; particleVy[i]=(Math.random()*2-1)*100; particleR[i]=r; particleG[i]=g; particleB[i]=b; return; } } }
function hitBuilding(i:number){ const t=buildingType[i], w=BUILDING_W[t], h=BUILDING_H[t]; const nx=Math.max(buildingX[i]-w/2,Math.min(ballX,buildingX[i]+w/2)); const ny=Math.max(buildingY[i],Math.min(ballY,buildingY[i]+h)); const dx=ballX-nx, dy=ballY-ny; return dx*dx+dy*dy<=16*16; }
function damage(i:number){ const t=buildingType[i]; buildingHp[i]--; buildingFlash[i]=0.08; ballVx+=(ballX-buildingX[i])*0.035; ballVy*=-0.72; if(buildingHp[i]<=0 && buildingAlive[i]){ buildingAlive[i]=0; score+=BUILDING_SCORE[t]*(buildingTarget[i]?3:1); fuel=Math.min(100,fuel+(buildingTarget[i]?18:6)); for(let k=0;k<24;k++) spawnParticle(buildingX[i],buildingY[i]+BUILDING_H[t]/2,PAL.target[0],PAL.target[1],PAL.target[2]); } }
function flipper(left:boolean){ const px=left?-86:86, py=-230, base=left?-0.46:Math.PI+0.46, a=base+(pressed?(left?0.9:-0.9):0); return {x1:px,y1:py,x2:px+Math.cos(a)*68,y2:py+Math.sin(a)*68,left}; }
function resolveFlipper(left:boolean){ const f=flipper(left); const dx=f.x2-f.x1, dy=f.y2-f.y1; const tt=Math.max(0,Math.min(1,((ballX-f.x1)*dx+(ballY-f.y1)*dy)/(dx*dx+dy*dy))); const x=f.x1+dx*tt, y=f.y1+dy*tt; const ox=ballX-x, oy=ballY-y, d=Math.hypot(ox,oy); if(d<20){ const nx=ox/(d||1), ny=oy/(d||1), p=pressed?11:4; ballX=x+nx*20; ballY=y+ny*20; ballVx+=nx*p+(left?3:-3); ballVy+=ny*p+(pressed?12:3); } }
function update(dt:number){ if(!started||cleared||gameOver)return; fuel-=dt*3.2; if(fuel<=0){ fuel=0; gameOver=true; result.textContent='GAME OVER\nTAP / CLICK TO RETRY'; result.classList.add('show'); updateHud(); return; }
  ballVy-=0.22*55*dt; ballX+=ballVx*60*dt; ballY+=ballVy*60*dt; ballVx*=0.994; ballVy*=0.994;
  if(ballX<WORLD_MIN_X+16){ballX=WORLD_MIN_X+16;ballVx=Math.abs(ballVx)*0.72} if(ballX>WORLD_MAX_X-16){ballX=WORLD_MAX_X-16;ballVx=-Math.abs(ballVx)*0.72} if(ballY>WORLD_MAX_Y-16){ballY=WORLD_MAX_Y-16;ballVy=-Math.abs(ballVy)*0.72} if(ballY<WORLD_MIN_Y-34){ballX=0;ballY=-210;ballVx=0;ballVy=8;fuel=Math.max(0,fuel-12)}
  resolveFlipper(true); resolveFlipper(false);
  for(let i=0;i<buildingCount;i++){ if(buildingFlash[i]>0) buildingFlash[i]=Math.max(0,buildingFlash[i]-dt); if(buildingAlive[i]&&hitBuilding(i)) damage(i); }
  for(let i=0;i<humanCount;i++){ if(!humanAlive[i]) continue; humanX[i]+=humanVx[i]*dt; humanY[i]+=humanVy[i]*dt; if(humanX[i]<-165||humanX[i]>165) humanVx[i]*=-1; if(humanY[i]<-185||humanY[i]>145) humanVy[i]*=-1; const dx=humanX[i]-ballX, dy=humanY[i]-ballY; if(dx*dx+dy*dy<400){humanAlive[i]=0; score+=10; fuel=Math.min(100,fuel+2); spawnParticle(humanX[i],humanY[i],PAL.blood[0],PAL.blood[1],PAL.blood[2]);} }
  for(let i=0;i<MAX_PARTICLES;i++){ if(particleLife[i]>0){ particleX[i]+=particleVx[i]*dt; particleY[i]+=particleVy[i]*dt; particleLife[i]-=dt; particleVy[i]-=110*dt; } }
  if(targetDone()>=targetRequired&&destroyRatio()>=destroyRequired){ cleared=true; score+=5000; result.textContent='STAGE CLEAR!\nTAP / CLICK TO RETRY'; result.classList.add('show'); } updateHud(); }
function render(){ const gl=renderer.gl; gl.clearColor(0.04,0.035,0.05,1); gl.clear(gl.COLOR_BUFFER_BIT); renderer.drawBackground(PAL.skyTop,PAL.skyBot); let idx=0; for(let r=0;r<4;r++) idx=drawRoad(buf,idx,[-170,-70,30,140][r]); idx=drawGround(buf,idx); for(let i=0;i<buildingCount;i++) idx=drawBuilding(buf,idx,buildingType[i],buildingX[i],buildingY[i],buildingHp[i],buildingAlive[i],buildingTarget[i],buildingFlash[i]); for(let i=0;i<humanCount;i++) if(humanAlive[i]) idx=drawHuman(buf,idx,humanX[i],humanY[i]); for(let i=0;i<MAX_PARTICLES;i++) if(particleLife[i]>0) idx=drawParticle(buf,idx,particleX[i],particleY[i],particleR[i],particleG[i],particleB[i],Math.max(0,particleLife[i]*2)); const lf=flipper(true), rf=flipper(false); idx=drawFlipper(buf,idx,lf.x1,lf.y1,lf.x2,lf.y2); idx=drawFlipper(buf,idx,rf.x1,rf.y1,rf.x2,rf.y2); idx=drawBall(buf,idx,ballX,ballY); renderer.draw(idx); }
function loop(now:number){ const dt=Math.min(0.033,(now-lastTime)/1000||0); lastTime=now; update(dt); render(); requestAnimationFrame(loop); }
function start(){ if(!started||cleared||gameOver){ reset(); started=true; title.classList.remove('show'); result.classList.remove('show'); } pressed=true; }
addEventListener('mousedown',start); addEventListener('mouseup',()=>pressed=false); addEventListener('touchstart',e=>{e.preventDefault();start()},{passive:false}); addEventListener('touchend',e=>{e.preventDefault();pressed=false},{passive:false}); addEventListener('keydown',e=>{if(!e.repeat)start()}); addEventListener('keyup',()=>pressed=false);
reset(); requestAnimationFrame(t=>{lastTime=t;requestAnimationFrame(loop)});
