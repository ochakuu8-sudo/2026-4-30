import { CANVAS_H, CANVAS_W, INST_FLOATS, MAX_INSTANCES, WORLD_MAX_X, WORLD_MAX_Y, WORLD_MIN_X, WORLD_MIN_Y } from './constants';

const VS = `#version 300 es
precision highp float;
in vec2 a_vert;
in vec2 i_pos;
in vec2 i_size;
in vec4 i_color;
in float i_rot;
in float i_shape;
in vec4 i_params;
in float i_glow;
in float i_soft;
uniform mat4 u_proj;
out vec2 v_uv;
out vec4 v_color;
out float v_shape;
out vec4 v_params;
out float v_glow;
out float v_soft;
void main(){
  float c=cos(i_rot),s=sin(i_rot);
  vec2 scaled=a_vert*i_size;
  vec2 rotated=vec2(c*scaled.x-s*scaled.y,s*scaled.x+c*scaled.y);
  gl_Position=u_proj*vec4(rotated+i_pos,0.0,1.0);
  v_uv=a_vert;
  v_color=i_color;
  v_shape=i_shape;
  v_params=i_params;
  v_glow=i_glow;
  v_soft=i_soft;
}`;

const FS = `#version 300 es
precision highp float;
in vec2 v_uv;
in vec4 v_color;
in float v_shape;
in vec4 v_params;
in float v_glow;
in float v_soft;
out vec4 outColor;

float sdBox(vec2 p, vec2 b){vec2 q=abs(p)-b;return length(max(q,0.0))+min(max(q.x,q.y),0.0);} 
float sdRoundBox(vec2 p, vec2 b, float r){vec2 q=abs(p)-b+r;return length(max(q,0.0))+min(max(q.x,q.y),0.0)-r;}
float sdCircle(vec2 p, float r){return length(p)-r;}
float sdCapsuleX(vec2 p, float h, float r){p.x-=clamp(p.x,-h,h);return length(p)-r;}
float sdCapsuleY(vec2 p, float h, float r){p.y-=clamp(p.y,-h,h);return length(p)-r;}
float sdTriangleUp(vec2 p){p.y+=0.08;vec2 q=abs(p);return max(q.x*0.866025+p.y*0.5,-p.y)-0.36;}
float sdTriangleDown(vec2 p){p.y=-p.y;return sdTriangleUp(p);} 

void main(){
  vec2 p=v_uv;
  float sh=floor(v_shape+0.5);
  float d=0.0;
  if(sh==0.0){d=sdBox(p,vec2(0.5));}
  else if(sh==1.0){d=sdRoundBox(p,vec2(0.5),v_params.x);}
  else if(sh==2.0){d=sdCircle(p,0.5);}
  else if(sh==3.0){d=(v_params.x<0.5)?sdCapsuleX(p,0.34,0.16):sdCapsuleY(p,0.34,0.16);}
  else if(sh==4.0){d=(v_params.x<0.5)?sdTriangleUp(p):sdTriangleDown(p);}
  else if(sh==5.0){float outer=sdCircle(p,0.5);float inner=-sdCircle(p,0.5-max(0.02,min(0.45,v_params.x)));d=max(outer,inner);}
  else {d=sdCircle(p,0.5);}
  float soft=max(0.001,v_soft);
  float alpha=v_color.a*(1.0-smoothstep(-soft,soft,d));
  vec3 rgb=v_color.rgb;
  if(v_glow>0.0){float g=exp(-max(d,0.0)*18.0)*v_glow;rgb+=v_color.rgb*g;alpha=max(alpha,g*0.55*v_color.a);}
  outColor=vec4(rgb,alpha);
}`;

const BGV = `#version 300 es
in vec2 a_pos;out vec2 v_uv;void main(){gl_Position=vec4(a_pos,0.0,1.0);v_uv=a_pos*0.5+0.5;}`;
const BGF = `#version 300 es
precision mediump float;uniform vec4 u_top;uniform vec4 u_bot;in vec2 v_uv;out vec4 outColor;void main(){outColor=mix(u_bot,u_top,v_uv.y);}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader compile failed');
  return s;
}

function link(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'program link failed');
  return p;
}

function ortho(l: number, r: number, b: number, t: number) {
  return new Float32Array([2/(r-l),0,0,0, 0,2/(t-b),0,0, 0,0,-1,0, -(r+l)/(r-l),-(t+b)/(t-b),0,1]);
}

export class Renderer {
  readonly gl: WebGL2RenderingContext;
  readonly buf = new Float32Array(MAX_INSTANCES * INST_FLOATS);
  private prog: WebGLProgram;
  private bgProg: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private bgVao: WebGLVertexArrayObject;
  private instVbo: WebGLBuffer;
  private uProj: WebGLUniformLocation;
  private uTop: WebGLUniformLocation;
  private uBot: WebGLUniformLocation;
  private proj = ortho(WORLD_MIN_X, WORLD_MAX_X, WORLD_MIN_Y, WORLD_MAX_Y);

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'high-performance' });
    if (!gl) throw new Error('WebGL2 required');
    this.gl = gl;
    this.prog = link(gl, VS, FS);
    this.bgProg = link(gl, BGV, BGF);

    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    const quad = new Float32Array([-0.5,-0.5, 0.5,-0.5, -0.5,0.5, 0.5,0.5]);
    const qbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, qbo);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    const av = gl.getAttribLocation(this.prog, 'a_vert');
    gl.enableVertexAttribArray(av);
    gl.vertexAttribPointer(av, 2, gl.FLOAT, false, 0, 0);
    this.instVbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instVbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.buf.byteLength, gl.DYNAMIC_DRAW);
    const stride = INST_FLOATS * 4;
    const attr = (name: string, size: number, off: number) => {
      const loc = gl.getAttribLocation(this.prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, off * 4);
      gl.vertexAttribDivisor(loc, 1);
    };
    attr('i_pos', 2, 0); attr('i_size', 2, 2); attr('i_color', 4, 4); attr('i_rot', 1, 8); attr('i_shape', 1, 9); attr('i_params', 4, 10); attr('i_glow', 1, 14); attr('i_soft', 1, 15);
    gl.bindVertexArray(null);

    this.bgVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.bgVao);
    const bgbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, bgbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const ap = gl.getAttribLocation(this.bgProg, 'a_pos');
    gl.enableVertexAttribArray(ap);
    gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this.uProj = gl.getUniformLocation(this.prog, 'u_proj')!;
    this.uTop = gl.getUniformLocation(this.bgProg, 'u_top')!;
    this.uBot = gl.getUniformLocation(this.bgProg, 'u_bot')!;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0, 0, CANVAS_W, CANVAS_H);
  }

  drawBackground(top: readonly [number, number, number, number], bot: readonly [number, number, number, number]) {
    const gl = this.gl;
    gl.useProgram(this.bgProg);
    gl.uniform4f(this.uTop, top[0], top[1], top[2], top[3]);
    gl.uniform4f(this.uBot, bot[0], bot[1], bot[2], bot[3]);
    gl.bindVertexArray(this.bgVao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  draw(count: number) {
    const gl = this.gl;
    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(this.uProj, false, this.proj);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instVbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.buf, 0, count * INST_FLOATS);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
  }
}

export function writeInst(
  buf: Float32Array, idx: number,
  x: number, y: number, w: number, h: number,
  color: readonly [number, number, number, number],
  rot: number, shape: number,
  p0 = 0, p1 = 0, p2 = 0, p3 = 0,
  glow = 0, softness = 0.006
) {
  const o = idx * INST_FLOATS;
  buf[o] = x; buf[o+1] = y;
  buf[o+2] = w; buf[o+3] = h;
  buf[o+4] = color[0]; buf[o+5] = color[1]; buf[o+6] = color[2]; buf[o+7] = color[3];
  buf[o+8] = rot; buf[o+9] = shape;
  buf[o+10] = p0; buf[o+11] = p1; buf[o+12] = p2; buf[o+13] = p3;
  buf[o+14] = glow; buf[o+15] = softness;
}
