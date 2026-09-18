/* Living scene: WebGL sky + synthwave grid floor, 2D-canvas city on top with
   neon signs, traffic and weather particles. Time of day follows the real sun
   (sunrise/sunset from the weather feed), weather effects follow the real sky. */
(function (NX) {
  const HZ = 0.27; // horizon height from the bottom, as a fraction of the screen

  const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse;
uniform float uSun, uCloud, uFog, uWet, uFlash, uHz;
uniform vec3 uA, uB, uC, uBg;

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x), u.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.03+vec2(17.1,9.2); a*=.5; } return v; }

void main(){
  vec2 uv = gl_FragCoord.xy/uRes;
  float asp = uRes.x/uRes.y;
  float day = smoothstep(-0.2, 0.5, uSun);
  float night = 1.-day;
  float gold = exp(-pow((uSun-0.02)/0.2, 2.0));
  vec2 m = uMouse*0.015;
  vec2 P = vec2(uv.x*asp, uv.y);
  vec3 col;

  if (uv.y >= uHz) {
    float t = (uv.y-uHz)/(1.-uHz);
    vec3 nTop = mix(vec3(0.015,0.01,0.05), uBg, 0.5);
    vec3 nHz  = mix(vec3(0.10,0.04,0.20), uA, 0.28);
    vec3 dTop = vec3(0.09,0.22,0.42);
    vec3 dHz  = mix(vec3(0.62,0.76,0.88), uB, 0.18);
    vec3 gTop = vec3(0.10,0.04,0.25);
    vec3 gHz  = mix(vec3(1.0,0.45,0.2), uA, 0.45);
    vec3 top = mix(mix(nTop,dTop,day), gTop, gold*0.85);
    vec3 hz  = mix(mix(nHz,dHz,day), gHz, gold);
    col = mix(hz, top, pow(t, 0.55));

    // stars
    vec2 sp = P*140. + m*40.;
    float hs = hash(floor(sp));
    float st = step(0.982, hs) * smoothstep(0.35, 0.0, length(fract(sp)-0.5));
    st *= 0.5+0.5*sin(uTime*(1.+hs*3.)+hs*60.);
    col += st * night * (1.-uCloud*0.9) * smoothstep(0.05,0.4,t) * vec3(0.9,0.9,1.0);

    // synthwave sun
    vec2 q = P - vec2(0.68*asp, uHz + uSun*0.55 + 0.05) - m;
    float r = 0.13, d = length(q);
    float disc = smoothstep(r, r-0.004, d);
    float yy = (q.y + r)/(2.*r);
    float gap = clamp((0.5-yy)*1.4, 0., 1.);
    float stripe = step(gap, fract(yy*12.0 - uTime*0.12));
    vec3 sunCol = mix(uA, uC, clamp(yy,0.,1.));
    float sunVis = smoothstep(-0.25, -0.03, uSun) * (1.-uCloud*0.75);
    col = mix(col, mix(sunCol*1.15, vec3(1.,0.97,0.9), day*0.7), disc*mix(stripe,1.,day)*sunVis);
    col += exp(-d*6.)*mix(uA, vec3(1.,0.9,0.7), day)*0.35*sunVis;

    // moon
    vec2 mq = P - vec2(0.2*asp, uHz + clamp(-uSun,0.,1.)*0.45 + 0.2) - m*0.6;
    float md = length(mq);
    float moonVis = smoothstep(0.0, -0.2, uSun)*(1.-uCloud*0.8);
    float moon = smoothstep(0.055, 0.052, md);
    float crater = fbm(mq*40.)*0.35;
    float shade = smoothstep(0.052, 0.046, length(mq - vec2(0.024, 0.014)));
    col = mix(col, vec3(0.92,0.95,1.0)*(0.9-crater*0.5), moon*(1.-shade*0.88)*moonVis);
    col += exp(-md*14.)*uB*0.35*moonVis;

    // searchlights sweeping from the city
    for (int i=0; i<2; i++) {
      float fi = float(i);
      vec2 v = P - vec2((0.28+fi*0.47)*asp, uHz);
      float ang = atan(v.x, v.y);
      float target = sin(uTime*(0.23+fi*0.07)+fi*2.)*0.6;
      float beam = exp(-pow((ang-target)/0.035, 2.)) * smoothstep(0.95, 0.0, length(v));
      col += beam*mix(uB, uA, fi)*0.2*night;
    }

    // clouds, lit from below by the city at night
    vec2 cp = vec2(P.x*1.2 + uTime*0.008 + m.x*2., uv.y*3.2);
    float n = fbm(cp + fbm(cp*0.5 + uTime*0.01));
    float cov = mix(0.64, 0.2, uCloud);
    float c = smoothstep(cov, cov+0.28, n) * smoothstep(0.0, 0.22, t);
    vec3 cNight = mix(vec3(0.07,0.04,0.12), uA*0.5, smoothstep(0.6, 0.0, t));
    vec3 cDay = mix(vec3(0.78,0.82,0.9), vec3(0.42,0.46,0.56), uCloud);
    vec3 cGold = mix(uA, vec3(1.,0.6,0.35), 0.5)*0.85;
    vec3 cc = mix(mix(cNight, cDay, day), cGold, gold*0.7);
    col = mix(col, cc, c*(0.35+uCloud*0.6));

    col += uA * exp(-t*7.) * 0.28 * night;
    col += vec3(0.8,0.85,1.)*uFlash*(0.45+c*0.8);
  } else {
    // perspective neon grid floor
    float d = uHz - uv.y;
    float dd = d + 0.002;
    float z = 0.12/dd;
    float x = ((uv.x-0.5)*asp*z + m.x*z*2.)*7.;
    float gz = z*2.6 + uTime*1.1;
    float px = asp*z*7./uRes.x;
    float pz = 0.12*2.6/(dd*dd)/uRes.y;
    float dx = abs(fract(x+0.5)-0.5);
    float dz = abs(fract(gz+0.5)-0.5);
    float gx = (1.-smoothstep(px*0.6, px*1.8, dx)) * smoothstep(0.5, 0.05, px);
    float gl = (1.-smoothstep(pz*0.6, pz*1.8, dz)) * smoothstep(0.5, 0.05, pz);
    float grid = max(gx, gl);
    float fade = smoothstep(0.0, 0.25, d);
    vec3 floorCol = mix(uBg*0.7, uA*0.07, 0.5) + uFlash*0.15;
    vec3 lineCol = mix(uA, uB, smoothstep(0., 0.3, d));
    col = floorCol + lineCol*grid*(0.3+0.7*fade)*(0.55+0.45*night);
    col += uA*exp(-d*25.)*0.4;
    float streak = noise(vec2(uv.x*asp*60., uv.y*3.+uTime*0.3));
    col += uWet * streak*streak * mix(uA, uB, noise(vec2(uv.x*8., 1.))) * 0.3 * exp(-d*3.);
    col += exp(-pow((uv.x*asp - 0.68*asp)*8., 2.)) * exp(-d*4.) * uA * 0.3 * smoothstep(-0.25, 0., uSun);
  }

  float fh = exp(-abs(uv.y-uHz)*4.);
  vec3 fogCol = mix(vec3(0.18,0.15,0.24) + uA*0.08, vec3(0.7,0.72,0.78), day);
  col = mix(col, fogCol, uFog*(0.3+0.5*fh));
  gl_FragColor = vec4(col, 1.);
}`;

  const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }';

  const QUALITY = {
    low:  { shader: 0.35, dpr: 1,    particles: 0.45, fpsCap: 30 },
    med:  { shader: 0.6,  dpr: 1.25, particles: 0.8,  fpsCap: 60 },
    high: { shader: 1.0,  dpr: 2,    particles: 1.2,  fpsCap: 120 },
  };

  const SIGN_WORDS = ['БАР', '24/7', 'ОТЕЛЬ', 'NEON', 'КИНО', 'OPEN', 'ЛАПША', 'CLUB', 'DECK', 'СУШИ', 'ТАКСИ', 'ХОСТЕЛ', 'RAMEN', 'VHS'];

  const S = {
    opts: null, theme: null,
    sun: -0.8, sunAuto: -0.8, sunrise: null, sunset: null,
    weather: { kind: 'clear', intensity: 0, cloud: 0.15, fog: 0 }, weatherAuto: null,
    mouse: [0, 0], mouseT: [0, 0],
    flash: 0, bolt: null, nextBolt: 0,
    W: 0, H: 0, dpr: 1,
    layers: [], signs: [], beacons: [], cars: [], drops: [], flakes: [], splashes: [],
    fps: 0, running: false, lastFrame: 0,
  };

  let gl, prog, U = {}, sky, city, ctx;

  // ── WebGL setup ──
  function initGL() {
    sky = NX.$('#sky');
    gl = sky.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) return false;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['uRes', 'uTime', 'uMouse', 'uSun', 'uCloud', 'uFog', 'uWet', 'uFlash', 'uHz', 'uA', 'uB', 'uC', 'uBg']) U[n] = gl.getUniformLocation(prog, n);
    return true;
  }

  const rgb01 = (hex) => NX.hexToRgb(hex).map((v) => v / 255);
  const mixc = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const css = (c, a = 1) => `rgba(${c.map((v) => Math.round(NX.clamp(v, 0, 1) * 255)).join(',')},${a})`;

  // JS mirror of the shader's horizon colour, used to tint distant buildings.
  function horizonColor() {
    const A = rgb01(S.theme.a), B = rgb01(S.theme.b);
    const day = smooth(-0.2, 0.5, S.sun);
    const gold = Math.exp(-(((S.sun - 0.02) / 0.2) ** 2));
    const nHz = mixc([0.1, 0.04, 0.2], A, 0.28);
    const dHz = mixc([0.62, 0.76, 0.88], B, 0.18);
    const gHz = mixc([1, 0.45, 0.2], A, 0.45);
    return mixc(mixc(nHz, dHz, day), gHz, gold);
  }
  function smooth(a, b, x) { const t = NX.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  // ── City generation (pre-rendered per layer) ──
  function buildCity() {
    const { W, H } = S;
    const r = NX.rng(S.opts.seed || 2077);
    const hzY = H * (1 - HZ);
    const bg = rgb01(S.theme.bg);
    const hzc = horizonColor();
    const day = smooth(-0.2, 0.5, S.sun);
    const accents = [S.theme.a, S.theme.b, S.theme.c];
    const margin = 90;
    const defs = [
      { depth: 0.25, hMin: 0.10, hMax: 0.34, wMin: 26, wMax: 70, tint: 0.5 },
      { depth: 0.55, hMin: 0.08, hMax: 0.42, wMin: 34, wMax: 90, tint: 0.78 },
      { depth: 1.0,  hMin: 0.05, hMax: 0.36, wMin: 48, wMax: 120, tint: 0.97 },
    ];
    S.layers = []; S.signs = []; S.beacons = [];

    defs.forEach((L, li) => {
      const cw = W + margin * 2;
      const c = document.createElement('canvas');
      c.width = Math.ceil(cw * S.dpr); c.height = Math.ceil(hzY * S.dpr) + 2;
      const g = c.getContext('2d');
      g.scale(S.dpr, S.dpr);
      const body = mixc(hzc, mixc(bg, [0, 0, 0], 0.35), L.tint);
      const edge = mixc(body, rgb01(S.theme.a), 0.18 + 0.15 * (1 - L.depth));
      let x = -r() * 40;
      while (x < cw) {
        const w = L.wMin + r() * (L.wMax - L.wMin);
        const rel = Math.abs((x + w / 2 - margin) / W - 0.5); // taller at the edges, frames the HUD
        const hMul = 0.55 + 1.0 * rel;
        const bh = H * (L.hMin + r() * (L.hMax - L.hMin)) * hMul;
        const top = hzY - bh;
        g.fillStyle = css(body);
        g.fillRect(x, top, w, bh + 2);
        // roof variants
        const roof = r();
        if (roof < 0.22) {
          const sw = w * (0.3 + r() * 0.4), sh = 8 + r() * 26;
          g.fillRect(x + (w - sw) / 2, top - sh, sw, sh);
        } else if (roof < 0.38) {
          const ah = 20 + r() * 60 * L.depth + 20;
          g.fillRect(x + w / 2 - 1, top - ah, 2, ah);
          S.beacons.push({ layer: li, x: x + w / 2, y: top - ah, ph: r() * 6 });
        } else if (roof < 0.46) {
          g.beginPath(); g.moveTo(x, top); g.lineTo(x + w / 2, top - w * 0.35); g.lineTo(x + w, top); g.fill();
        }
        // rim light on the edge facing the horizon glow
        g.fillStyle = css(edge, 0.55);
        g.fillRect(x, top, 1, bh);
        g.fillRect(x, top, w, 1);
        // windows
        const ww = Math.round(2 + L.depth * 2), wh = Math.round(3 + L.depth * 3);
        const gx = ww + 2 + Math.round(r() * 2), gy = wh + 3;
        const litP = 0.06 + 0.34 * (1 - day) + 0.05 * li;
        const palette = r() < 0.5 ? [1, 0.82, 0.55] : [0.62, 0.9, 1];
        for (let wy = top + 6; wy < hzY - wh - 2; wy += gy) {
          const rowLit = r() < 0.85;
          for (let wx = x + 4; wx < x + w - ww - 3; wx += gx) {
            if (rowLit && r() < litP) {
              const acc = r() < 0.06;
              g.fillStyle = acc ? accents[Math.floor(r() * 3)] : css(palette, 0.5 + r() * 0.5);
              g.fillRect(wx, wy, ww, wh);
            }
          }
        }
        // neon signs on mid/near buildings
        if (li > 0 && r() < 0.22 * L.depth + 0.08 && bh > 90) {
          const word = SIGN_WORDS[Math.floor(r() * SIGN_WORDS.length)];
          const vertical = r() < 0.6;
          const size = Math.round(9 + L.depth * 6);
          S.signs.push({
            layer: li, word, vertical, size,
            x: x + (vertical ? (r() < 0.5 ? 2 : w - size - 4) : w / 2),
            y: top + 14 + r() * Math.min(bh * 0.4, 120),
            color: accents[Math.floor(r() * 3)], flick: r(),
          });
        }
        x += w + (r() < 0.3 ? r() * 18 : 0);
      }
      S.layers.push({ canvas: c, depth: L.depth, margin });
    });

    // traffic lanes between layers
    const n = S.opts.traffic ? 14 : 0;
    S.cars = Array.from({ length: n }, () => newCar(r, true));
    S.hzY = hzY;
  }

  function newCar(r = Math.random, anywhere = false) {
    const dir = Math.random() < 0.5 ? 1 : -1;
    const lane = Math.floor(Math.random() * 4);
    const depth = 0.4 + lane * 0.18;
    return {
      x: anywhere ? Math.random() * S.W : dir > 0 ? -40 : S.W + 40,
      y: S.H * (0.22 + lane * 0.085) + Math.random() * 12,
      v: dir * (40 + Math.random() * 90) * depth,
      len: 8 + depth * 14,
      depth, dir,
    };
  }

  // ── Weather particles ──
  function resetParticles() {
    const q = QUALITY[S.opts.quality] || QUALITY.med;
    const w = currentWeather();
    const rainy = w.kind === 'rain' || w.kind === 'storm';
    const nRain = rainy ? Math.round((180 + 520 * w.intensity) * q.particles) : 0;
    const nSnow = w.kind === 'snow' ? Math.round((120 + 280 * w.intensity) * q.particles) : 0;
    S.drops = Array.from({ length: nRain }, () => newDrop(true));
    S.flakes = Array.from({ length: nSnow }, () => newFlake(true));
    S.splashes = [];
  }
  function newDrop(anywhere) {
    const z = Math.random();
    return { x: Math.random() * (S.W + 200) - 100, y: anywhere ? Math.random() * S.H : -20 - Math.random() * 100, z, len: 8 + z * 18, v: 700 + z * 700, end: z > 0.6 ? S.hzY + (S.H - S.hzY) * Math.random() : S.H + 30 };
  }
  function newFlake(anywhere) {
    const z = Math.random();
    return { x: Math.random() * S.W, y: anywhere ? Math.random() * S.H : -10, z, r: 0.6 + z * 2.2, v: 25 + z * 60, ph: Math.random() * 6.28 };
  }

  function makeBolt() {
    const pts = [];
    let x = S.W * (0.15 + Math.random() * 0.7), y = 0;
    const endY = S.hzY - S.H * 0.15;
    while (y < endY) { pts.push([x, y]); x += (Math.random() - 0.5) * 60; y += 20 + Math.random() * 40; }
    pts.push([x, endY]);
    return { pts, life: 0.22 };
  }

  // ── Resolve effective sun + weather (settings overrides beat live data) ──
  function currentSun() {
    const o = S.opts.time;
    if (o === 'dawn' || o === 'dusk') return 0.04;
    if (o === 'day') return 0.8;
    if (o === 'night') return -0.8;
    return S.sunAuto;
  }
  function currentWeather() {
    const o = S.opts.weather;
    const presets = {
      clear: { kind: 'clear', intensity: 0, cloud: 0.12, fog: 0 },
      clouds: { kind: 'clouds', intensity: 0, cloud: 0.8, fog: 0.05 },
      rain: { kind: 'rain', intensity: 0.6, cloud: 0.85, fog: 0.12 },
      storm: { kind: 'storm', intensity: 1, cloud: 1, fog: 0.15 },
      snow: { kind: 'snow', intensity: 0.6, cloud: 0.8, fog: 0.2 },
      fog: { kind: 'fog', intensity: 0, cloud: 0.6, fog: 0.6 },
    };
    if (o && o !== 'auto') return presets[o];
    return S.weatherAuto || presets.clear;
  }

  function computeSunAuto() {
    const now = Date.now();
    let sr, ss;
    if (S.sunrise && S.sunset) { sr = S.sunrise; ss = S.sunset; }
    else {
      const d = new Date(); d.setHours(6, 30, 0, 0); sr = d.getTime();
      const e = new Date(); e.setHours(19, 30, 0, 0); ss = e.getTime();
    }
    // Shift stored times onto today so a cached forecast keeps working.
    const day0 = new Date(); day0.setHours(0, 0, 0, 0);
    const tod = (t) => { const d = new Date(t); return day0.getTime() + (d.getHours() * 3600 + d.getMinutes() * 60) * 1000; };
    sr = tod(sr); ss = tod(ss);
    if (now >= sr && now <= ss) return Math.sin(Math.PI * (now - sr) / (ss - sr));
    const nightLen = 86400000 - (ss - sr);
    const dt = now > ss ? now - ss : now + 86400000 - ss;
    return -Math.sin(Math.PI * dt / nightLen);
  }

  // ── Frame ──
  function resize() {
    const q = QUALITY[S.opts.quality] || QUALITY.med;
    S.W = window.innerWidth; S.H = window.innerHeight;
    S.dpr = Math.min(window.devicePixelRatio || 1, q.dpr);
    city.width = Math.round(S.W * S.dpr); city.height = Math.round(S.H * S.dpr);
    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    if (gl) {
      sky.width = Math.max(2, Math.round(S.W * q.shader)); sky.height = Math.max(2, Math.round(S.H * q.shader));
      gl.viewport(0, 0, sky.width, sky.height);
    }
    buildCity();
    resetParticles();
  }

  function drawSky(t) {
    if (!gl) return;
    const w = currentWeather();
    const A = rgb01(S.theme.a), B = rgb01(S.theme.b), C = rgb01(S.theme.c), BG = rgb01(S.theme.bg);
    gl.uniform2f(U.uRes, sky.width, sky.height);
    gl.uniform1f(U.uTime, t);
    gl.uniform2f(U.uMouse, S.mouse[0], S.mouse[1]);
    gl.uniform1f(U.uSun, S.sun);
    gl.uniform1f(U.uCloud, w.cloud);
    gl.uniform1f(U.uFog, w.fog);
    gl.uniform1f(U.uWet, w.kind === 'rain' || w.kind === 'storm' ? 1 : 0);
    gl.uniform1f(U.uFlash, S.flash);
    gl.uniform1f(U.uHz, HZ);
    gl.uniform3fv(U.uA, A); gl.uniform3fv(U.uB, B); gl.uniform3fv(U.uC, C); gl.uniform3fv(U.uBg, BG);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function drawCity(t, dt) {
    const { W, H } = S;
    ctx.clearRect(0, 0, W, H);
    const w = currentWeather();

    // lightning bolt sits behind the skyline
    if (S.bolt) {
      ctx.save();
      ctx.strokeStyle = 'rgba(230,240,255,0.95)'; ctx.lineWidth = 2;
      ctx.shadowColor = S.theme.b; ctx.shadowBlur = 18;
      ctx.beginPath(); S.bolt.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      ctx.restore();
      S.bolt.life -= dt; if (S.bolt.life <= 0) S.bolt = null;
    }

    S.layers.forEach((L, li) => {
      const ox = -L.margin - S.mouse[0] * 30 * L.depth;
      const oy = S.mouse[1] * 6 * L.depth;
      ctx.drawImage(L.canvas, ox, oy, L.canvas.width / S.dpr, L.canvas.height / S.dpr);

      // antenna beacons
      for (const b of S.beacons) {
        if (b.layer !== li) continue;
        const on = Math.sin(t * 2.2 + b.ph) > 0.6;
        if (!on) continue;
        ctx.fillStyle = 'rgba(255,40,60,0.95)';
        ctx.beginPath(); ctx.arc(b.x + ox, b.y + oy, 1.6 + L.depth, 0, 6.29); ctx.fill();
        ctx.fillStyle = 'rgba(255,40,60,0.18)';
        ctx.beginPath(); ctx.arc(b.x + ox, b.y + oy, 6 + L.depth * 4, 0, 6.29); ctx.fill();
      }

      // neon signs, flickering
      for (const s of S.signs) {
        if (s.layer !== li) continue;
        const fl = s.flick > 0.8 ? (Math.sin(t * 23 + s.flick * 99) > -0.2 || Math.sin(t * 1.3 + s.flick * 9) > 0.3 ? 1 : 0.15) : 1;
        drawSign(s, ox, oy, fl);
      }

      // flying traffic weaves between the mid and near layers
      if (li === 1) drawTraffic(dt);
    });

    // rain
    if (S.drops.length) {
      const slant = 0.18;
      ctx.lineCap = 'round';
      for (let pass = 0; pass < 2; pass++) {
        ctx.beginPath();
        ctx.strokeStyle = pass ? 'rgba(200,230,255,0.55)' : 'rgba(170,190,255,0.22)';
        ctx.lineWidth = pass ? 1.2 : 0.8;
        for (const d of S.drops) {
          if ((d.z > 0.55) !== !!pass) continue;
          d.y += d.v * dt; d.x += d.v * slant * dt;
          if (d.y > d.end) {
            if (d.end < H && S.splashes.length < 80) S.splashes.push({ x: d.x, y: d.end, life: 0.25 });
            Object.assign(d, newDrop(false));
          }
          ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.len * slant, d.y - d.len);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(190,220,255,0.5)'; ctx.lineWidth = 1;
      for (let i = S.splashes.length - 1; i >= 0; i--) {
        const s = S.splashes[i];
        s.life -= dt;
        if (s.life <= 0) { S.splashes.splice(i, 1); continue; }
        const k = 1 - s.life / 0.25;
        ctx.globalAlpha = 1 - k;
        ctx.beginPath(); ctx.ellipse(s.x, s.y, 2 + k * 7, 0.8 + k * 1.8, 0, 0, 6.29); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // snow
    if (S.flakes.length) {
      ctx.fillStyle = 'rgba(240,245,255,0.85)';
      ctx.beginPath();
      for (const f of S.flakes) {
        f.y += f.v * dt; f.x += Math.sin(t * 0.8 + f.ph) * 12 * dt * (0.5 + f.z) - S.mouse[0] * 8 * dt;
        if (f.y > H + 5) Object.assign(f, newFlake(false));
        ctx.moveTo(f.x + f.r, f.y); ctx.arc(f.x, f.y, f.r, 0, 6.29);
      }
      ctx.fill();
    }

    // storm → schedule lightning
    if (w.kind === 'storm') {
      if (t > S.nextBolt) {
        S.nextBolt = t + 4 + Math.random() * 9;
        S.flash = 1; S.bolt = makeBolt();
        NX.$('#flash').classList.remove('on'); void NX.$('#flash').offsetWidth; NX.$('#flash').classList.add('on');
      }
    }
    S.flash = Math.max(0, S.flash - dt * 3.2);
  }

  function drawSign(s, ox, oy, fl) {
    const x = s.x + ox, y = s.y + oy;
    ctx.save();
    ctx.font = `700 ${s.size}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const chars = s.vertical ? [...s.word] : [s.word];
    const lh = s.size * 1.05;
    const bw = s.vertical ? s.size + 6 : ctx.measureText(s.word).width + 10;
    const bh = s.vertical ? chars.length * lh + 6 : s.size + 8;
    const bx = s.vertical ? x : x - bw / 2;
    ctx.globalAlpha = fl;
    ctx.fillStyle = 'rgba(5,3,10,0.85)';
    ctx.fillRect(bx, y, bw, bh);
    ctx.strokeStyle = s.color; ctx.lineWidth = 1;
    ctx.shadowColor = s.color; ctx.shadowBlur = 12 * fl;
    ctx.strokeRect(bx + 0.5, y + 0.5, bw - 1, bh - 1);
    ctx.fillStyle = s.color;
    chars.forEach((ch, i) => ctx.fillText(ch, bx + bw / 2, y + 4 + i * lh));
    ctx.restore();
  }

  function drawTraffic(dt) {
    for (let i = 0; i < S.cars.length; i++) {
      const c = S.cars[i];
      c.x += c.v * dt;
      if (c.x < -60 || c.x > S.W + 60) { S.cars[i] = newCar(); continue; }
      const x = c.x - S.mouse[0] * 30 * c.depth;
      const head = c.dir > 0 ? 'rgba(255,60,90,' : 'rgba(210,245,255,';
      ctx.strokeStyle = head + '0.18)'; ctx.lineWidth = 5 * c.depth;
      ctx.beginPath(); ctx.moveTo(x, c.y); ctx.lineTo(x - c.dir * c.len * 2.2, c.y); ctx.stroke();
      ctx.strokeStyle = head + '0.95)'; ctx.lineWidth = 1.4 * c.depth + 0.4;
      ctx.beginPath(); ctx.moveTo(x, c.y); ctx.lineTo(x - c.dir * c.len, c.y); ctx.stroke();
    }
  }

  let t0 = performance.now(), fpsAcc = 0, fpsN = 0, fpsT = 0, lastSunCheck = 0, lastBuiltSun = null;
  function frame(now) {
    if (!S.running) return;
    requestAnimationFrame(frame);
    const q = QUALITY[S.opts.quality] || QUALITY.med;
    const cap = Math.min(S.opts.fps || 60, q.fpsCap);
    if (now - S.lastFrame < 1000 / cap - 1) return;
    const dt = Math.min(0.05, (now - (S.lastFrame || now)) / 1000);
    S.lastFrame = now;
    const t = (now - t0) / 1000;

    // ease parallax
    S.mouse[0] += (S.mouseT[0] - S.mouse[0]) * 0.05;
    S.mouse[1] += (S.mouseT[1] - S.mouse[1]) * 0.05;

    // re-evaluate the sun once a minute; rebuild the skyline when light changes noticeably
    if (now - lastSunCheck > 60000) {
      lastSunCheck = now;
      S.sunAuto = computeSunAuto();
      S.sun = currentSun();
      if (lastBuiltSun === null || Math.abs(S.sun - lastBuiltSun) > 0.12) { lastBuiltSun = S.sun; buildCity(); }
    }

    drawSky(t);
    drawCity(t, dt);

    fpsAcc += dt; fpsN++;
    if (now - fpsT > 1000) { S.fps = Math.round(fpsN / (fpsAcc || 1)); fpsAcc = 0; fpsN = 0; fpsT = now; NX.emit && NX.emit('fps', S.fps); }
  }

  function start() {
    if (S.running) return;
    S.running = true; S.lastFrame = 0;
    requestAnimationFrame(frame);
  }
  function stop() { S.running = false; }

  const Scene = {
    init(opts, theme) {
      S.opts = opts; S.theme = theme;
      city = NX.$('#city'); ctx = city.getContext('2d');
      try { initGL(); } catch (e) { console.warn('WebGL off:', e); gl = null; }
      S.sunAuto = computeSunAuto(); S.sun = currentSun(); lastBuiltSun = S.sun; lastSunCheck = performance.now();
      resize();
      window.addEventListener('resize', NX.debounce(resize, 150));
      window.addEventListener('mousemove', (e) => {
        if (!S.opts.parallax) return;
        S.mouseT[0] = (e.clientX / S.W) * 2 - 1;
        S.mouseT[1] = (e.clientY / S.H) * 2 - 1;
      });
      document.addEventListener('visibilitychange', () => (document.hidden ? stop() : S.opts.enabled && start()));
      if (opts.enabled) start(); else this.still();
    },
    // one static frame when animation is disabled
    still() { stop(); drawSky(0); drawCity(0, 0); },
    pause: stop,
    resume() { if (S.opts.enabled) start(); },
    setOptions(opts) {
      S.opts = opts;
      S.sun = currentSun();
      if (!opts.parallax) S.mouseT = [0, 0];
      resize();
      lastBuiltSun = S.sun;
      if (opts.enabled) start(); else this.still();
    },
    setTheme(theme) { S.theme = theme; buildCity(); if (!S.running) this.still(); },
    setSun(sunrise, sunset) {
      S.sunrise = sunrise; S.sunset = sunset;
      S.sunAuto = computeSunAuto(); S.sun = currentSun();
      buildCity(); lastBuiltSun = S.sun;
      if (!S.running) this.still();
    },
    // Map WMO weather codes (Open-Meteo) onto scene effects.
    setWeatherCode(code, cloudCover = null) {
      let w = { kind: 'clear', intensity: 0, cloud: 0.12, fog: 0 };
      if (code === 1) w = { kind: 'clear', intensity: 0, cloud: 0.3, fog: 0 };
      else if (code === 2) w = { kind: 'clouds', intensity: 0, cloud: 0.55, fog: 0 };
      else if (code === 3) w = { kind: 'clouds', intensity: 0, cloud: 0.9, fog: 0.08 };
      else if (code === 45 || code === 48) w = { kind: 'fog', intensity: 0, cloud: 0.6, fog: 0.6 };
      else if (code >= 51 && code <= 57) w = { kind: 'rain', intensity: 0.25, cloud: 0.85, fog: 0.15 };
      else if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) w = { kind: 'rain', intensity: [61, 80].includes(code) ? 0.4 : [63, 81].includes(code) ? 0.65 : 1, cloud: 0.9, fog: 0.1 };
      else if ((code >= 71 && code <= 77) || code === 85 || code === 86) w = { kind: 'snow', intensity: [71, 85].includes(code) ? 0.35 : 0.7, cloud: 0.85, fog: 0.2 };
      else if (code >= 95) w = { kind: 'storm', intensity: 1, cloud: 1, fog: 0.12 };
      if (cloudCover != null && w.kind === 'clear') w.cloud = Math.max(w.cloud, cloudCover / 100 * 0.6);
      S.weatherAuto = w;
      resetParticles();
      if (!S.running) this.still();
    },
    status() {
      const w = currentWeather();
      const sun = S.sun;
      const t = S.opts.time;
      const phase = t === 'dawn' || t === 'dusk' ? t.toUpperCase()
        : sun > 0.25 ? 'DAY' : sun > -0.12 ? (new Date().getHours() < 12 ? 'DAWN' : 'DUSK') : 'NIGHT';
      return { phase, kind: w.kind, intensity: w.intensity, night: sun < -0.05, fps: S.fps, sun };
    },
  };

  NX.Scene = Scene;
})(window.NX);
