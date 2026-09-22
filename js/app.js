/* Boot, theme application, hotkeys, ticker. */
(function (NX) {
  const TIPS = [
    'ВВЕДИ «!y» ПЕРЕД ЗАПРОСОМ — ПОИСК НА YOUTUBE',
    '«2^10*3» В СТРОКЕ ПОИСКА = КАЛЬКУЛЯТОР',
    'ПЕРЕТАЩИ GIF НА КАРТОЧКУ — ОНА СТАНЕТ ТВОЕЙ',
    'КЛАВИШИ 1–9 ОТКРЫВАЮТ ЗАКЛАДКИ',
    'TAB НА ПУСТОЙ СТРОКЕ — СМЕНИТЬ ПОИСКОВИК',
    'НЕБО ЖИВЁТ ПО НАСТОЯЩЕМУ СОЛНЦУ В ТВОЁМ ГОРОДЕ',
    'ЗАДАЧА С «!» В НАЧАЛЕ — ГЛАВНЫЙ КВЕСТ',
    'WAKE UP. THE CITY NEVER SLEEPS.',
    'ALL SYSTEMS NOMINAL',
  ];
  const ticker = { weather: null, todos: null, pomo: null };

  function applyTheme() {
    const s = NX.settings;
    const t = NX.THEMES[s.theme] || NX.THEMES.synthwave;
    const r = document.documentElement.style;
    for (const k of ['a', 'b', 'c', 'bg']) {
      r.setProperty(`--${k}`, t[k]);
      r.setProperty(`--${k}-rgb`, NX.hexToRgb(t[k]).join(','));
    }
    const b = document.body.classList;
    b.toggle('no-scanlines', !s.fx.scanlines);
    b.toggle('no-noise', !s.fx.noise);
    b.toggle('no-glitch', !s.fx.glitch);
    b.toggle('no-blur', !s.fx.blur);
    NX.$('#custom-css').textContent = s.customCss || '';
    return t;
  }

  let lastTheme = null, lastScene = null;
  NX.saveSettings = function () {
    NX.Store.set('settings', NX.settings);
    const t = applyTheme();
    if (lastTheme !== NX.settings.theme) { lastTheme = NX.settings.theme; NX.Scene.setTheme(t); NX.Pixel.setTheme(t); }
    const sc = JSON.stringify(NX.settings.scene);
    if (sc !== lastScene) { lastScene = sc; NX.Scene.setOptions({ ...NX.settings.scene }); }
    paintTicker();
  };

  // ── Boot log ──
  function boot() {
    const el = NX.$('#boot');
    if (!NX.settings.fx.boot) { el.remove(); document.body.classList.add('ready'); return; }
    const open = NX.data.todos.filter((t) => !t.done).length;
    const lines = [
      'NEON//DECK BIOS v1.0 · (c) 2077 NEON DECK SYSTEMS',
      '> mounting /dev/skyline ............ OK',
      '> weather uplink · open-meteo ...... OK',
      `> decrypting bookmarks [${NX.data.bookmarks.reduce((n, g) => n + g.links.length, 0)}] ........ OK`,
      `> quest log: ${open} active`,
      `> welcome back, ${(NX.settings.name || 'runner').toUpperCase()}_`,
    ];
    const log = NX.$('#boot-log');
    let i = 0;
    const step = () => {
      if (i < lines.length) { log.textContent += lines[i++] + '\n'; setTimeout(step, 55); }
      else setTimeout(() => { el.classList.add('done'); document.body.classList.add('ready'); setTimeout(() => el.remove(), 400); }, 120);
    };
    step();
  }

  // ── Ticker ──
  function paintTicker() {
    const parts = [];
    const d = new Date();
    if (ticker.weather) parts.push(NX.t('◉ {place} {temp} · {desc} · ЗАВТРА {tomorrow}', { place: ticker.weather.place.toUpperCase(), temp: ticker.weather.temp, desc: NX.t(ticker.weather.desc).toUpperCase(), tomorrow: ticker.weather.tomorrow }));
    if (ticker.todos != null) parts.push(NX.t('◆ КВЕСТОВ АКТИВНО: {n}', { n: ticker.todos }));
    if (ticker.pomo) parts.push(`◷ ${ticker.pomo}`);
    parts.push(`▲ ${NX.THEMES[NX.settings.theme].name.toUpperCase()} MODE`);
    const tips = [...TIPS].sort(() => Math.random() - 0.5).slice(0, 3);
    parts.push(...tips.map((t) => `// ${NX.t(t)}`));
    parts.push(`${d.getFullYear()}.${NX.pad(d.getMonth() + 1)}.${NX.pad(d.getDate())}`);
    const copy = (hidden) => NX.h('div', { 'aria-hidden': hidden ? 'true' : null }, parts.flatMap((p) => [NX.h('span', { text: p }), NX.h('b', { text: '✦' })]));
    NX.$('#ticker').replaceChildren(copy(false), copy(true));
  }
  const paintTickerSoon = NX.debounce(paintTicker, 300);

  // ── Edit mode / overlays ──
  function toggleEdit(force) {
    const on = document.body.classList.toggle('editing', force);
    NX.$('#btn-edit').classList.toggle('active', on);
    NX.Deck.render();
    NX.toast(on ? 'Режим правки: клик — изменить, тащи — переставить' : 'Правка завершена');
  }
  function openHelp() {
    const rows = [
      ['/', 'фокус на поиск (или просто начни печатать)'],
      ['Tab', 'на пустой строке — сменить поисковик'],
      ['↑ ↓ ⏎', 'выбрать подсказку · Ctrl+⏎ — в новой вкладке'],
      ['!y котики', 'бэнг: поиск на YouTube (список в настройках)'],
      ['r/startpages', 'сразу на сабреддит'],
      ['2+2*3', 'калькулятор, ⏎ копирует результат'],
      ['1 … 9', 'открыть закладку по номеру'],
      ['T', 'новая задача'],
      ['E', 'режим правки закладок'],
      ['I', 'следующая картинка'],
      [',', 'настройки'],
      ['?', 'эта шпаргалка'],
      ['Esc', 'закрыть всё'],
    ];
    NX.$('#help-body').replaceChildren(...rows.map(([k, v]) => NX.h('div', { class: 'help-row' }, NX.h('kbd', { text: k }), NX.h('span', { text: v }))));
    NX.$('#help').classList.add('open');
    NX.sfx('open');
  }
  function closeAll() {
    NX.Modal.close();
    NX.$('#help').classList.remove('open');
    NX.Settings.close();
    if (document.body.classList.contains('editing')) toggleEdit(false);
  }

  function flatLinks() { return NX.data.bookmarks.flatMap((g) => g.links); }

  function hotkeys() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { if (!NX.isTyping()) closeAll(); else if (document.activeElement.id !== 'q') document.activeElement.blur(); return; }
      if (NX.isTyping() || e.ctrlKey || e.metaKey || e.altKey) return;
      if (NX.$('#modal').classList.contains('open')) return;
      const k = e.key;
      if (k === '/') { e.preventDefault(); NX.Search.focus(); }
      else if (k === ',') { e.preventDefault(); NX.Settings.toggle(); }
      else if (k === '?') { e.preventDefault(); NX.$('#help').classList.contains('open') ? NX.$('#help').classList.remove('open') : openHelp(); }
      else if (k === 't' || k === 'T' || k === 'е' || k === 'Е') { e.preventDefault(); NX.Todo.focus(); }
      else if (k === 'e' || k === 'E' || k === 'у' || k === 'У') { e.preventDefault(); toggleEdit(); }
      else if (k === 'i' || k === 'I' || k === 'ш' || k === 'Ш') { e.preventDefault(); NX.$('#deck-img').click(); }
      else if (/^[1-9]$/.test(k)) {
        const l = flatLinks()[+k - 1];
        if (l) { NX.sfx('ok'); NX.openUrl(l.url, NX.settings.deck.newTab); }
      } else if (k.length === 1 && k !== ' ') {
        // type-to-search: focusing now lets this keystroke land in the input
        NX.$('#q').focus();
      }
    });
  }

  async function main() {
    NX.data = await NX.Store.load();
    NX.settings = NX.data.settings;
    NX.translateDom();
    const theme = applyTheme();
    lastTheme = NX.settings.theme;
    lastScene = JSON.stringify(NX.settings.scene);
    boot();

    NX.Scene.init({ ...NX.settings.scene }, theme);
    NX.Pixel.init(theme);
    NX.Clock.init();
    NX.Search.init();
    NX.Deck.init();
    NX.Todo.init();
    NX.Focus.init();
    NX.Weather.init();

    NX.on('weather', (w) => { ticker.weather = w; paintTickerSoon(); });
    NX.on('todos', (n) => { ticker.todos = n; paintTickerSoon(); });
    let lastPomo = null;
    NX.on('pomo', (p) => { if (!!p !== !!lastPomo) paintTickerSoon(); lastPomo = p; ticker.pomo = p; });
    NX.on('fps', (f) => { NX.$('#chip-fps').textContent = `FPS ${f}`; });
    paintTicker();

    const net = () => {
      const c = NX.$('#chip-net');
      c.textContent = navigator.onLine ? 'NET ● ONLINE' : 'NET ○ OFFLINE';
      c.classList.toggle('bad', !navigator.onLine);
    };
    window.addEventListener('online', net); window.addEventListener('offline', net); net();

    setInterval(() => {
      const s = NX.Scene.status();
      const W = { clear: 'CLEAR', clouds: 'CLOUDS', rain: 'RAIN', storm: 'STORM', snow: 'SNOW', fog: 'FOG' };
      NX.$('#scene-status').textContent = `SCENE: ${s.phase} · ${W[s.kind]}${s.intensity ? ' ' + Math.round(s.intensity * 100) + '%' : ''} · SUN ${s.sun >= 0 ? '+' : ''}${s.sun.toFixed(2)}`;
      if (!NX.settings.scene.enabled) NX.$('#chip-fps').textContent = 'FPS · PAUSED';
    }, 1000);

    NX.$('#btn-settings').addEventListener('click', () => NX.Settings.toggle());
    NX.$('#settings-close').addEventListener('click', () => NX.Settings.close());
    NX.$('#btn-help').addEventListener('click', openHelp);
    NX.$('#btn-edit').addEventListener('click', () => toggleEdit());
    NX.$('#help').addEventListener('mousedown', (e) => { if (e.target.id === 'help') NX.$('#help').classList.remove('open'); });
    document.addEventListener('mousedown', (e) => {
      const d = NX.$('#settings');
      if (d.classList.contains('open') && !d.contains(e.target) && !e.target.closest('#btn-settings') && !e.target.closest('#modal')) NX.Settings.close();
    });
    hotkeys();
  }

  main().catch((e) => { console.error(e); document.body.classList.add('ready'); NX.toast(NX.t('Ошибка запуска: {e}', { e: e.message }), 'err'); });
})(window.NX);
