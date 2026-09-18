/* Default card art: a tiny animated pixel scene (cat on a roof watching the
   city) that follows the theme, time of day and weather. Replaced by the
   user's own images/GIFs from the gallery when they add any. */
(function (NX) {
  const W = 96, H = 120;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  const CAT = [
    '..X.....X..',
    '..XX...XX..',
    '..XXXXXXX..',
    '..XXXXXXX..',
    '...XXXXX...',
    '...XXXXX...',
    '..XXXXXXX..',
    '.XXXXXXXXX.',
    '.XXXXXXXXX.',
    'XXXXXXXXXXX',
    'XXXXXXXXXXX',
    'XXXXXXXXXXX',
    '.XXXXXXXXX.',
  ];
  const TAILS = [
    [[11, 12], [12, 12], [13, 11], [13, 10], [14, 9], [14, 8]],
    [[11, 12], [12, 12], [13, 12], [14, 11], [15, 10], [15, 9]],
    [[11, 12], [12, 12], [13, 12], [14, 12], [15, 11], [16, 10]],
  ];

  let ctx, frame = 0, timer = null, city = null, stars = null, theme = null;

  const hex = (c) => NX.hexToRgb(c);
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
  const px = (x, y, c, w = 1, h = 1) => { ctx.fillStyle = typeof c === 'string' ? c : rgb(c); ctx.fillRect(x, y, w, h); };

  function gen() {
    const r = NX.rng(4242);
    city = { far: [], near: [], wins: [] };
    for (let x = 0; x < W;) { const w = 6 + Math.floor(r() * 10), h = 18 + Math.floor(r() * 30); city.far.push([x, h, w]); x += w; }
    for (let x = -4; x < W;) {
      const w = 10 + Math.floor(r() * 14), h = 14 + Math.floor(r() * 34);
      city.near.push([x, h, w]);
      for (let wy = 100 - h + 3; wy < 96; wy += 3) for (let wx = x + 2; wx < x + w - 2; wx += 3) if (r() < 0.35) city.wins.push([wx, wy, r()]);
      x += w + 1;
    }
    stars = Array.from({ length: 40 }, () => [Math.floor(r() * W), Math.floor(r() * 60), r()]);
  }

  function draw() {
    if (!ctx) return;
    const st = NX.Scene ? NX.Scene.status() : { night: true, kind: 'clear', sun: -0.8 };
    const A = hex(theme.a), B = hex(theme.b), C = hex(theme.c), BG = hex(theme.bg);
    const day = NX.clamp((st.sun + 0.2) / 0.7, 0, 1);
    const top = mix(mix(BG, [10, 6, 30], 0.5), [40, 90, 150], day);
    const bot = mix(mix([40, 12, 60], A, 0.45), [170, 200, 220], day);

    // dithered sky
    const bands = 5;
    for (let y = 0; y < 100; y++) {
      const t = y / 100 * (bands - 1);
      const b0 = Math.floor(t), f = t - b0;
      const c0 = mix(top, bot, b0 / (bands - 1)), c1 = mix(top, bot, Math.min(1, (b0 + 1) / (bands - 1)));
      for (let x = 0; x < W; x++) px(x, y, f * 16 > BAYER[(y % 4) * 4 + (x % 4)] ? c1 : c0);
    }

    // stars
    if (st.night && st.kind !== 'rain' && st.kind !== 'storm') for (const [x, y, p] of stars) if ((frame + p * 20) % 24 > 3) px(x, y, [230, 230, 255]);

    // moon or striped sun
    const cx = 68, cy = st.night ? 24 : 30 - Math.round(day * 10), R = 11;
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      if (x * x + y * y > R * R) continue;
      if (st.night) {
        const sh = (x - 4) * (x - 4) + (y + 2) * (y + 2) <= R * R;
        if (!sh) px(cx + x, cy + y, [235, 240, 255]);
      } else if (!(y > 0 && (y % 3 === 0 || (y > 5 && y % 3 === 1)))) {
        px(cx + x, cy + y, mix(C, A, (y + R) / (2 * R)));
      }
    }

    // skyline
    const farC = mix(bot, BG, 0.55), nearC = mix(BG, [0, 0, 0], 0.3);
    for (const [x, h, w] of city.far) px(x, 100 - h, farC, w, h);
    for (const [x, h, w] of city.near) px(x, 100 - h, nearC, w, h);
    for (const [x, y, p] of city.wins) {
      const blink = p > 0.93 && (frame + Math.floor(p * 50)) % 30 < 10;
      if (!blink && (st.night || p > 0.7)) px(x, y, p > 0.85 ? B : p > 0.5 ? [255, 210, 140] : mix([255, 210, 140], A, 0.5));
    }
    // neon sign
    const on = (frame % 37) > 2;
    if (on) { px(10, 64, A, 1, 16); px(13, 64, A, 1, 16); for (let i = 0; i < 4; i++) px(11, 66 + i * 4, A, 2, 2); }

    // rooftop + cat
    px(0, 100, mix(BG, [0, 0, 0], 0.5), W, 20);
    px(0, 100, mix(A, BG, 0.4), W, 1);
    for (let i = 0; i < W; i += 8) px(i, 104, mix(BG, A, 0.12), 6, 1);
    const catX = 52, catY = 87;
    const catC = [8, 5, 14];
    const tail = TAILS[Math.floor(frame / 6) % 4 === 3 ? 1 : Math.floor(frame / 6) % 3];
    const cat = new Set();
    CAT.forEach((row, y) => [...row].forEach((ch, x) => ch === 'X' && cat.add(`${x},${y}`)));
    tail.forEach(([x, y]) => cat.add(`${x},${y}`));
    if (frame % 50 < 2) cat.delete('2,0'); // ear twitch
    // neon rim outline so the silhouette reads against the dark skyline
    const rim = mix(B, [255, 255, 255], 0.15);
    for (const k of cat) {
      const [x, y] = k.split(',').map(Number);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1]]) {
        if (!cat.has(`${x + dx},${y + dy}`) && y + dy < 13) px(catX + x + dx, catY + y + dy, x + dx < 6 ? rim : mix(A, [255, 255, 255], 0.1));
      }
    }
    for (const k of cat) { const [x, y] = k.split(',').map(Number); px(catX + x, catY + y, catC); }

    // weather
    if (st.kind === 'rain' || st.kind === 'storm') {
      for (let i = 0; i < 70; i++) {
        const x = (i * 37 + frame * 3) % (W + 20) - 10, y = (i * 53 + frame * 7) % H;
        px(x, y, mix(B, [255, 255, 255], 0.5)); px(x - 1, y - 2, mix(B, top, 0.5));
      }
      if (st.kind === 'storm' && frame % 90 < 2) px(0, 0, 'rgba(255,255,255,0.5)', W, H);
    } else if (st.kind === 'snow') {
      for (let i = 0; i < 60; i++) {
        const x = (i * 29 + Math.round(Math.sin((frame + i * 10) / 8) * 2)) % W, y = (i * 41 + frame) % H;
        px(x, y, [240, 245, 255]);
      }
    } else if (st.kind === 'fog') {
      for (let y = 70; y < 110; y++) for (let x = 0; x < W; x++) if (BAYER[(y % 4) * 4 + ((x + frame) % 4)] < 5) px(x, y, [180, 180, 200]);
    }
    frame++;
  }

  NX.Pixel = {
    init(th) {
      theme = th;
      ctx = NX.$('#pixel').getContext('2d');
      gen();
      this.start();
    },
    setTheme(th) { theme = th; draw(); },
    start() { if (!timer) { draw(); timer = setInterval(() => !document.hidden && draw(), 125); } },
    stop() { clearInterval(timer); timer = null; },
  };
})(window.NX);
