/* Persistent state: browser.storage.local inside the extension (survives
   reinstalls of the same add-on id), localStorage when opened as a plain file. */
(function (NX) {
  const ext = typeof browser !== 'undefined' && browser.storage && browser.storage.local ? browser.storage.local : null;

  NX.THEMES = {
    synthwave: { name: 'Synthwave', a: '#ff2a6d', b: '#05d9e8', c: '#ffd166', bg: '#0b0716' },
    nightcity: { name: 'Hazard', a: '#fcee0a', b: '#00f0ff', c: '#ff003c', bg: '#0a0a0c' },
    runner:    { name: 'Amber Rain', a: '#ff8a1f', b: '#1ecbe1', c: '#ff4d4d', bg: '#0c0806' },
    acid:      { name: 'Acid', a: '#39ff14', b: '#00ffc8', c: '#e0ff4f', bg: '#030a06' },
    vapor:     { name: 'Vapor', a: '#ff71ce', b: '#01cdfe', c: '#b967ff', bg: '#0d0618' },
    blood:     { name: 'Blood Moon', a: '#ff1f3d', b: '#ff9f1c', c: '#ffd6e0', bg: '#0c0305' },
  };

  NX.ENGINES = {
    google: { name: 'Google', short: 'G', url: 'https://www.google.com/search?q=%s' },
    ddg: { name: 'DuckDuckGo', short: 'D', url: 'https://duckduckgo.com/?q=%s' },
    yandex: { name: 'Яндекс', short: 'Я', url: 'https://yandex.ru/search/?text=%s' },
    bing: { name: 'Bing', short: 'B', url: 'https://www.bing.com/search?q=%s' },
    brave: { name: 'Brave', short: 'BR', url: 'https://search.brave.com/search?q=%s' },
    perplexity: { name: 'Perplexity', short: 'P', url: 'https://www.perplexity.ai/search?q=%s' },
  };

  // Defaults differ per language: a translated link name must never point at
  // a site in the other language.
  const bangs = (lang) => [
    ['g', 'Google', 'https://www.google.com/search?q=%s'],
    ['d', 'DuckDuckGo', 'https://duckduckgo.com/?q=%s'],
    ['y', 'YouTube', 'https://www.youtube.com/results?search_query=%s'],
    ['gh', 'GitHub', 'https://github.com/search?q=%s'],
    ['r', 'Reddit', 'https://www.reddit.com/search/?q=%s'],
    ['so', 'Stack Overflow', 'https://stackoverflow.com/search?q=%s'],
    ['c', 'Claude', 'https://claude.ai/new?q=%s'],
    ['tw', 'Twitch', 'https://www.twitch.tv/search?term=%s'],
    ['px', 'Pinterest', 'https://www.pinterest.com/search/pins/?q=%s'],
    ...(lang === 'ru' ? [
      ['ya', 'Яндекс', 'https://yandex.ru/search/?text=%s'],
      ['w', 'Википедия', 'https://ru.wikipedia.org/w/index.php?search=%s'],
      ['we', 'Wikipedia EN', 'https://en.wikipedia.org/w/index.php?search=%s'],
      ['mdn', 'MDN', 'https://developer.mozilla.org/ru/search?q=%s'],
      ['t', 'Переводчик', 'https://translate.google.com/?sl=auto&tl=ru&text=%s'],
      ['i', 'Картинки', 'https://www.google.com/search?tbm=isch&q=%s'],
      ['m', 'Карты', 'https://yandex.ru/maps/?text=%s'],
    ] : [
      ['w', 'Wikipedia', 'https://en.wikipedia.org/w/index.php?search=%s'],
      ['mdn', 'MDN', 'https://developer.mozilla.org/en-US/search?q=%s'],
      ['t', 'Translate', 'https://translate.google.com/?sl=auto&tl=en&text=%s'],
      ['i', 'Images', 'https://www.google.com/search?tbm=isch&q=%s'],
      ['m', 'Maps', 'https://www.google.com/maps/search/%s'],
      ['hn', 'Hacker News', 'https://hn.algolia.com/?q=%s'],
    ]),
  ].map(([k, name, url]) => ({ k, name, url }));

  const L = (name, url) => ({ id: NX.uid(), name, url });
  const G = (name, links) => ({ id: NX.uid(), name, links });
  const bookmarks = (lang) => [
    G('dev', [L('github', 'https://github.com'), L('mdn', 'https://developer.mozilla.org/'), L('stack overflow', 'https://stackoverflow.com'),
      lang === 'ru' ? L('хабр', 'https://habr.com/ru/') : L('hacker news', 'https://news.ycombinator.com')]),
    G('media', [L('youtube', 'https://www.youtube.com'), L('twitch', 'https://www.twitch.tv'), L('reddit', 'https://www.reddit.com'), L('spotify', 'https://open.spotify.com')]),
    G('tools', [L('claude', 'https://claude.ai'), L('translate', 'https://translate.google.com'), L('figma', 'https://www.figma.com'), L('pinterest', 'https://www.pinterest.com')]),
    G('daily', [L('gmail', 'https://mail.google.com'), L('calendar', 'https://calendar.google.com'),
      lang === 'ru' ? L('карты', 'https://yandex.ru/maps') : L('maps', 'https://www.google.com/maps'),
      L('r/startpages', 'https://www.reddit.com/r/startpages/')]),
  ];

  NX.DEFAULTS = {
    settings: {
      lang: 'en',
      name: '',
      theme: 'synthwave',
      scene: { enabled: true, quality: 'med', fps: 60, parallax: true, time: 'auto', weather: 'auto', cityMode: 'tab', seed: 2077, traffic: true },
      fx: { scanlines: true, glitch: true, noise: true, blur: true, boot: true },
      sfx: false,
      weather: { lat: 55.7558, lon: 37.6173, place: 'Москва' },
      search: { engine: 'google', newTab: false, bangs: null },
      deck: { title: 'Добро пожаловать в сеть.', imageMode: 'random', newTab: false },
      customCss: '',
    },
    bookmarks: null,
    todos: [
      { id: NX.uid(), text: 'Настроить город в SYS://CONFIG', done: false, main: true },
      { id: NX.uid(), text: 'Закинуть свою пиксель-арт гифку в карточку', done: false, main: false },
      { id: NX.uid(), text: 'Нажать ? и выучить хоткеи', done: false, main: false },
    ],
    notes: '',
    pomo: { mode: 'focus', running: false, endsAt: 0, left: 25 * 60, done: 0, day: '' },
    gallery: [],
    history: [],
    wcache: null,
  };
  NX.defaultBangs = () => bangs(NX.I18n.lang);
  NX.defaultBookmarks = () => bookmarks(NX.I18n.lang);

  function merge(base, over) {
    if (Array.isArray(base) || typeof base !== 'object' || base === null) return over === undefined ? base : over;
    const out = { ...base };
    if (over && typeof over === 'object') {
      for (const k of Object.keys(over)) out[k] = k in base ? merge(base[k], over[k]) : over[k];
    }
    return out;
  }

  const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

  // Defaults are written in Russian; on a first run they are translated into
  // the interface language, after which they are the user's own data.
  function deepT(v) {
    if (typeof v === 'string') return NX.t(v);
    if (Array.isArray(v)) return v.map(deepT);
    if (v && typeof v === 'object') { for (const k of Object.keys(v)) v[k] = deepT(v[k]); return v; }
    return v;
  }

  async function rawGet(key) {
    if (ext) { const r = await ext.get(key); return r[key]; }
    try { const v = localStorage.getItem('nx:' + key); return v == null ? undefined : JSON.parse(v); } catch { return undefined; }
  }
  async function rawSet(key, val) {
    if (ext) return ext.set({ [key]: val });
    try { localStorage.setItem('nx:' + key, JSON.stringify(val)); } catch (e) { NX.toast('Хранилище переполнено', 'err'); }
  }

  const listeners = {};
  const Store = {
    async load() {
      const stored = await rawGet('settings');
      const settings = merge(clone(NX.DEFAULTS.settings), stored);
      NX.settings = settings;
      NX.I18n.setLang(settings.lang);
      if (stored === undefined) deepT(settings);
      if (!settings.search.bangs) settings.search.bangs = bangs(NX.I18n.lang);
      const out = { settings };
      for (const k of Object.keys(NX.DEFAULTS)) {
        if (k === 'settings') continue;
        const v = await rawGet(k);
        out[k] = v !== undefined ? v : k === 'bookmarks' ? bookmarks(NX.I18n.lang) : deepT(clone(NX.DEFAULTS[k]));
      }
      return out;
    },
    set(key, val) { return rawSet(key, val); },
    get: rawGet,
    on(key, fn) { (listeners[key] = listeners[key] || []).push(fn); },
    async exportAll() {
      const out = {};
      for (const k of Object.keys(NX.DEFAULTS)) if (k !== 'wcache') out[k] = await rawGet(k);
      return out;
    },
    async importAll(obj) {
      for (const k of Object.keys(NX.DEFAULTS)) if (k in obj) await rawSet(k, obj[k]);
    },
    async reset() {
      if (ext) await ext.clear();
      else Object.keys(localStorage).filter((k) => k.startsWith('nx:')).forEach((k) => localStorage.removeItem(k));
    },
  };

  // Cross-tab sync: another open tab edited todos / timer / notes → re-render here.
  if (ext && browser.storage.onChanged) {
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      for (const [k, c] of Object.entries(changes)) (listeners[k] || []).forEach((fn) => fn(c.newValue));
    });
  } else {
    window.addEventListener('storage', (e) => {
      if (!e.key || !e.key.startsWith('nx:')) return;
      const k = e.key.slice(3);
      let v; try { v = JSON.parse(e.newValue); } catch { return; }
      (listeners[k] || []).forEach((fn) => fn(v));
    });
  }

  NX.Store = Store;
})(window.NX);
