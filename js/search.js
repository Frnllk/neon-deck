/* Omnibox: web search with switchable engine, !bangs (prefix or suffix),
   r/subreddit, direct URLs, inline calculator, fuzzy bookmark jump and
   recent-search history. */
(function (NX) {
  let input, list, items = [], sel = 0;

  // ── Calculator (recursive descent, no eval) ──
  function calc(src) {
    const s = src.replace(/,/g, '.').replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/');
    if (!/^[\d.+\-*/^%()]+$/.test(s) || !/\d[+\-*/^%(]|\)/.test(s) || /^\d+(\.\d+)?$/.test(s)) return null;
    let i = 0;
    const peek = () => s[i];
    function num() {
      if (peek() === '(') { i++; const v = expr(); if (s[i++] !== ')') throw 0; return post(v); }
      if (peek() === '-') { i++; return -num(); }
      if (peek() === '+') { i++; return num(); }
      const m = /^\d*\.?\d+/.exec(s.slice(i));
      if (!m) throw 0;
      i += m[0].length;
      return post(parseFloat(m[0]));
    }
    function post(v) { while (peek() === '%') { i++; v /= 100; } return v; }
    function pow() { const b = num(); if (peek() === '^') { i++; return Math.pow(b, pow()); } return b; }
    function term() { let v = pow(); while (peek() === '*' || peek() === '/') { const op = s[i++]; const r = pow(); v = op === '*' ? v * r : v / r; } return v; }
    function expr() { let v = term(); while (peek() === '+' || peek() === '-') { const op = s[i++]; const r = term(); v = op === '+' ? v + r : v - r; } return v; }
    try {
      const v = expr();
      if (i !== s.length || !isFinite(v)) return null;
      return +v.toPrecision(12);
    } catch { return null; }
  }

  function asUrl(q) {
    if (/^https?:\/\//i.test(q)) return q;
    if (/^(localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)?(\/\S*)?$/i.test(q)) return 'http://' + q;
    if (/^[\w-]+(\.[\w-]+)*\.[a-zа-яё]{2,}(:\d+)?(\/\S*)?$/i.test(q) && !/\s/.test(q)) return 'https://' + q;
    return null;
  }

  function engine() { return NX.ENGINES[NX.settings.search.engine] || NX.ENGINES.google; }
  function bangs() { return NX.settings.search.bangs || []; }
  const fill = (tpl, q) => tpl.replace('%s', encodeURIComponent(q));

  function parseBang(q) {
    let m = /^!(\S+)\s*(.*)$/.exec(q);
    if (!m) { const n = /^(.*\S)\s+!(\S+)$/.exec(q); if (n) m = [n[0], n[2], n[1]]; }
    if (!m) return null;
    const b = bangs().find((x) => x.k.toLowerCase() === m[1].toLowerCase());
    return b ? { bang: b, rest: m[2] } : { partial: m[1], rest: m[2] };
  }

  function allLinks() {
    return NX.data.bookmarks.flatMap((g) => g.links.map((l) => ({ ...l, group: g.name })));
  }

  function build(q) {
    const out = [];
    const t = q.trim();
    if (!t) {
      NX.data.history.slice(0, 5).forEach((h) => out.push({ kind: 'hist', icon: '↺', label: h, sub: 'недавнее', go: (nt) => search(h, nt) }));
      return out;
    }

    const c = calc(t);
    if (c !== null) out.push({ kind: 'calc', icon: '=', label: `= ${c.toLocaleString('ru-RU', { maximumFractionDigits: 10 })}`, sub: 'Enter — скопировать', go: () => { navigator.clipboard.writeText(String(c)).then(() => NX.toast(`Скопировано: ${c}`)); } });

    const b = parseBang(t);
    if (b && b.bang) {
      out.push({ kind: 'bang', icon: '!', label: b.rest ? `${b.bang.name}: ${b.rest}` : `Открыть ${b.bang.name}`, sub: `!${b.bang.k}`, go: (nt) => { if (b.rest) addHistory(t); NX.openUrl(b.rest ? fill(b.bang.url, b.rest) : new URL(b.bang.url.replace('%s', '')).origin, nt); } });
    } else if (b && b.partial !== undefined && !b.rest) {
      bangs().filter((x) => x.k.startsWith(b.partial.toLowerCase())).slice(0, 6)
        .forEach((x) => out.push({ kind: 'bang', icon: '!', label: `!${x.k}`, sub: x.name, complete: `!${x.k} ` }));
    }

    const sub = /^r\/([\w]+)$/i.exec(t);
    if (sub) out.push({ kind: 'url', icon: '↗', label: `reddit.com/r/${sub[1]}`, sub: 'сабреддит', go: (nt) => NX.openUrl(`https://www.reddit.com/r/${sub[1]}/`, nt) });

    const url = asUrl(t);
    if (url) out.push({ kind: 'url', icon: '↗', label: url.replace(/^https?:\/\//, ''), sub: 'перейти', go: (nt) => NX.openUrl(url, nt) });

    const bm = allLinks().map((l) => ({ l, s: Math.max(NX.fuzzy(t, l.name), NX.fuzzy(t, NX.domainOf(l.url)) - 5) }))
      .filter((x) => x.s > 3).sort((a, b) => b.s - a.s).slice(0, 5);
    const web = { kind: 'web', icon: '⌕', label: t, sub: `искать в ${engine().name}`, go: (nt) => search(t, nt) };
    const strong = bm.length && bm[0].s >= 100 && !(b && b.bang) && c === null && !url;
    if (strong) out.push(bmItem(bm.shift().l));
    if (!(b && (b.bang || b.partial !== undefined))) out.push(web);
    bm.forEach((x) => out.push(bmItem(x.l)));

    NX.data.history.filter((h) => h !== t && h.toLowerCase().includes(t.toLowerCase())).slice(0, 3)
      .forEach((h) => out.push({ kind: 'hist', icon: '↺', label: h, sub: 'недавнее', go: (nt) => search(h, nt) }));
    return out;
  }

  function bmItem(l) {
    return { kind: 'bm', icon: NX.h('img', { src: NX.favicon(l.url), alt: '', loading: 'lazy' }), label: l.name, sub: `${l.group} · ${NX.domainOf(l.url)}`, go: (nt) => NX.openUrl(l.url, nt) };
  }

  function addHistory(q) {
    const h = [q, ...NX.data.history.filter((x) => x !== q)].slice(0, 30);
    NX.data.history = h;
    NX.Store.set('history', h);
  }

  function search(q, nt) {
    addHistory(q);
    NX.openUrl(fill(engine().url, q), nt || NX.settings.search.newTab);
  }

  function render() {
    list.innerHTML = '';
    if (!items.length || document.activeElement !== input) { list.classList.remove('open'); return; }
    items.forEach((it, i) => {
      const li = NX.h('li', { class: `sg sg-${it.kind}${i === sel ? ' sel' : ''}`, role: 'option' },
        NX.h('span', { class: 'sg-ic' }, it.icon),
        NX.h('span', { class: 'sg-label', text: it.label }),
        NX.h('span', { class: 'sg-sub', text: it.sub || '' }));
      li.addEventListener('mousedown', (e) => { e.preventDefault(); sel = i; run(e.ctrlKey || e.button === 1); });
      li.addEventListener('mousemove', () => { if (sel !== i) { sel = i; mark(); } });
      list.append(li);
    });
    list.classList.add('open');
  }
  function mark() { NX.$$('.sg', list).forEach((li, i) => li.classList.toggle('sel', i === sel)); }

  function run(newTab) {
    const it = items[sel];
    if (!it) { const q = input.value.trim(); if (q) search(q, newTab); return; }
    if (it.complete) { input.value = it.complete; update(); return; }
    NX.sfx('ok');
    it.go(newTab || NX.settings.search.newTab);
  }

  function update() {
    items = build(input.value);
    sel = 0;
    render();
    NX.$('#search-hint').textContent = input.value ? '⏎' : '/';
  }

  function cycleEngine(dir = 1) {
    const keys = Object.keys(NX.ENGINES);
    const i = keys.indexOf(NX.settings.search.engine);
    NX.settings.search.engine = keys[(i + dir + keys.length) % keys.length];
    NX.saveSettings();
    paintEngine();
    NX.toast(`Поиск: ${engine().name}`);
    NX.sfx('tick');
    update();
  }
  function paintEngine() {
    const e = NX.$('#engine');
    e.textContent = engine().short;
    e.title = `${engine().name} — клик или Tab на пустой строке, чтобы сменить`;
  }

  NX.Search = {
    init() {
      input = NX.$('#q'); list = NX.$('#suggest');
      paintEngine();
      input.addEventListener('input', update);
      input.addEventListener('focus', update);
      input.addEventListener('blur', () => setTimeout(() => list.classList.remove('open'), 80));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(1, items.length); mark(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + items.length) % Math.max(1, items.length); mark(); }
        else if (e.key === 'Tab' && !input.value) { e.preventDefault(); cycleEngine(e.shiftKey ? -1 : 1); }
        else if (e.key === 'Tab' && items[sel] && items[sel].complete) { e.preventDefault(); input.value = items[sel].complete; update(); }
        else if (e.key === 'Escape') { if (input.value) { input.value = ''; update(); } else input.blur(); }
      });
      NX.$('#search').addEventListener('submit', (e) => { e.preventDefault(); run(false); });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); run(e.ctrlKey || e.shiftKey || e.altKey); } });
      NX.$('#engine').addEventListener('click', () => cycleEngine(1));
    },
    focus() { input.focus(); input.select(); },
    paintEngine,
    calc,
  };
})(window.NX);
