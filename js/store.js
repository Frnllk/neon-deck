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

  const DEFAULT_BANGS = [
    ['g', 'Google', 'https://www.google.com/search?q=%s'],
    ['d', 'DuckDuckGo', 'https://duckduckgo.com/?q=%s'],
    ['ya', 'Яндекс', 'https://yandex.ru/search/?text=%s'],
    ['y', 'YouTube', 'https://www.youtube.com/results?search_query=%s'],
    ['w', 'Википедия', 'https://ru.wikipedia.org/w/index.php?search=%s'],
    ['we', 'Wikipedia EN', 'https://en.wikipedia.org/w/index.php?search=%s'],
    ['gh', 'GitHub', 'https://github.com/search?q=%s'],
    ['r', 'Reddit', 'https://www.reddit.com/search/?q=%s'],
    ['so', 'Stack Overflow', 'https://stackoverflow.com/search?q=%s'],
    ['mdn', 'MDN', 'https://developer.mozilla.org/ru/search?q=%s'],
    ['t', 'Переводчик', 'https://translate.google.com/?sl=auto&tl=ru&text=%s'],
    ['te', 'Translate → EN', 'https://translate.google.com/?sl=auto&tl=en&text=%s'],
    ['i', 'Картинки', 'https://www.google.com/search?tbm=isch&q=%s'],
    ['m', 'Карты', 'https://yandex.ru/maps/?text=%s'],
    ['c', 'Claude', 'https://claude.ai/new?q=%s'],
    ['tw', 'Twitch', 'https://www.twitch.tv/search?term=%s'],
    ['px', 'Pinterest', 'https://www.pinterest.com/search/pins/?q=%s'],
  ].map(([k, name, url]) => ({ k, name, url }));

  const L = (name, url) => ({ id: NX.uid(), name, url });
  const DEFAULT_BOOKMARKS = [
    { id: NX.uid(), name: 'dev', links: [L('github', 'https://github.com'), L('mdn', 'https://developer.mozilla.org/ru/'), L('stack overflow', 'https://stackoverflow.com'), L('хабр', 'https://habr.com/ru/')] },
    { id: NX.uid(), name: 'media', links: [L('youtube', 'https://www.youtube.com'), L('twitch', 'https://www.twitch.tv'), L('reddit', 'https://www.reddit.com'), L('spotify', 'https://open.spotify.com')] },
    { id: NX.uid(), name: 'tools', links: [L('claude', 'https://claude.ai'), L('translate', 'https://translate.google.com'), L('figma', 'https://www.figma.com'), L('pinterest', 'https://www.pinterest.com')] },
    { id: NX.uid(), name: 'daily', links: [L('gmail', 'https://mail.google.com'), L('calendar', 'https://calendar.google.com'), L('карты', 'https://yandex.ru/maps'), L('r/startpages', 'https://www.reddit.com/r/startpages/')] },
  ];

  NX.DEFAULTS = {
    settings: {
      name: '',
      theme: 'synthwave',
      scene: { enabled: true, quality: 'med', fps: 60, parallax: true, time: 'auto', weather: 'auto', seed: 2077, traffic: true },
      fx: { scanlines: true, glitch: true, noise: true, blur: true, boot: true },
      sfx: false,
      weather: { lat: 55.7558, lon: 37.6173, place: 'Москва' },
      search: { engine: 'google', newTab: false, bangs: DEFAULT_BANGS },
      deck: { title: 'Добро пожаловать в сеть.', imageMode: 'random', newTab: false },
      customCss: '',
    },
    bookmarks: DEFAULT_BOOKMARKS,
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
  NX.DEFAULT_BANGS = DEFAULT_BANGS;
  NX.DEFAULT_BOOKMARKS = DEFAULT_BOOKMARKS;

  function merge(base, over) {
    if (Array.isArray(base) || typeof base !== 'object' || base === null) return over === undefined ? base : over;
    const out = { ...base };
    if (over && typeof over === 'object') {
      for (const k of Object.keys(over)) out[k] = k in base ? merge(base[k], over[k]) : over[k];
    }
    return out;
  }

  const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

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
      const keys = Object.keys(NX.DEFAULTS);
      const out = {};
      for (const k of keys) {
        const v = await rawGet(k);
        out[k] = k === 'settings' ? merge(clone(NX.DEFAULTS.settings), v) : v === undefined ? clone(NX.DEFAULTS[k]) : v;
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
