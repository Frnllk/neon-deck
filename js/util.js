/* NEON//DECK — shared helpers. Classic scripts share the global NX namespace
   so the page works both as an extension and as a plain file:// preview. */
window.NX = window.NX || {};

(function (NX) {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Strings on their way into the DOM get translated (see i18n.js).
  const tr = (s) => (NX.t ? NX.t(String(s)) : String(s));

  function h(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = tr(v);
      else if (k === 'title' || k === 'placeholder' || k === 'aria-label') node.setAttribute(k, tr(v));
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else node.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      node.append(c.nodeType ? c : document.createTextNode(tr(c)));
    }
    return node;
  }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  const uid = () => Math.random().toString(36).slice(2, 10);

  function debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  // Deterministic PRNG so the skyline is the same on every tab for a given seed.
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => {
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      return ((s >>> 0) % 100000) / 100000;
    };
  }

  function hexToRgb(hex) {
    const m = hex.replace('#', '');
    const n = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function domainOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
  }
  function favicon(url) {
    const d = domainOf(url);
    return d ? `https://icons.duckduckgo.com/ip3/${d}.ico` : '';
  }

  // Subsequence fuzzy match with bonuses for word starts and contiguous runs.
  function fuzzy(query, text) {
    query = query.toLowerCase(); text = text.toLowerCase();
    if (!query) return 0;
    const idx = text.indexOf(query);
    if (idx >= 0) return 100 - idx + (idx === 0 ? 50 : 0);
    let score = 0, ti = 0, run = 0;
    for (const ch of query) {
      const found = text.indexOf(ch, ti);
      if (found < 0) return -1;
      run = found === ti ? run + 1 : 0;
      score += 1 + run * 2 + (found === 0 || /[\s./-]/.test(text[found - 1]) ? 4 : 0);
      ti = found + 1;
    }
    return score;
  }

  // ── Toasts ──
  function toast(msg, kind = '') {
    const box = $('#toasts');
    if (!box) return;
    const t = h('div', { class: `toast ${kind}` }, h('span', { class: 'toast-tag', text: kind === 'err' ? 'ERR' : 'SYS' }), tr(msg));
    box.append(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3100);
  }

  // ── Synth SFX (WebAudio, no files) ──
  let actx = null;
  function sfx(type = 'tick') {
    if (!NX.settings || !NX.settings.sfx) return;
    try {
      actx = actx || new AudioContext();
      const o = actx.createOscillator(), g = actx.createGain();
      const now = actx.currentTime;
      const presets = {
        tick: [1800, 0.03, 'square', 0.025],
        ok: [880, 0.09, 'triangle', 0.06],
        del: [220, 0.12, 'sawtooth', 0.04],
        open: [520, 0.08, 'sine', 0.06],
        alarm: [990, 0.5, 'square', 0.08],
      };
      const [f, d, w, v] = presets[type] || presets.tick;
      o.type = w; o.frequency.setValueAtTime(f, now);
      if (type === 'ok') o.frequency.exponentialRampToValueAtTime(f * 2, now + d);
      if (type === 'del') o.frequency.exponentialRampToValueAtTime(f / 2, now + d);
      g.gain.setValueAtTime(v, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + d);
      o.connect(g).connect(actx.destination);
      o.start(now); o.stop(now + d + 0.02);
    } catch { /* audio unavailable */ }
  }

  // Warm up DNS + TCP + TLS for an origin the user is likely to open next.
  const warmed = new Set();
  function warm(url) {
    let origin;
    try { origin = new URL(url).origin; } catch { return; }
    if (!/^https?:/.test(origin) || warmed.has(origin)) return;
    warmed.add(origin);
    document.head.append(h('link', { rel: 'preconnect', href: origin }), h('link', { rel: 'dns-prefetch', href: origin }));
  }

  // Leaving this tab: freeze the scene so the GPU is free for the next page,
  // and show a "connecting" screen so the click feels instant while it loads.
  function leaving(url) {
    NX.Scene && NX.Scene.pause();
    NX.Pixel && NX.Pixel.stop();
    const box = $('#leaving');
    if (box) box.querySelector('b').textContent = domainOf(url) || url;
    document.body.classList.add('leaving');
  }
  // Coming back via the back button restores the page from bfcache.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    document.body.classList.remove('leaving');
    NX.Scene && NX.Scene.resume();
    NX.Deck && NX.Deck.pickInitial();
  });

  function openUrl(url, newTab) {
    if (newTab) { window.open(url, '_blank', 'noopener'); return; }
    leaving(url);
    window.location.href = url;
  }

  function isTyping() {
    const a = document.activeElement;
    return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable);
  }

  // Tiny event bus between modules.
  const bus = {};
  const on = (ev, fn) => (bus[ev] = bus[ev] || []).push(fn);
  const emit = (ev, data) => (bus[ev] || []).forEach((fn) => fn(data));

  Object.assign(NX, { on, emit, $, $$, h, esc, clamp, lerp, pad, uid, debounce, rng, hexToRgb, domainOf, favicon, fuzzy, toast, sfx, warm, leaving, openUrl, isTyping });
})(window.NX);
