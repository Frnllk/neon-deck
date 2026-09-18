/* SYS://CONFIG drawer. Every control writes straight into NX.settings and
   calls NX.saveSettings(), which persists and re-applies the look. */
(function (NX) {
  const { h } = NX;
  const S = () => NX.settings;
  let paintGalleryRef = null;
  NX.on('gallery', () => paintGalleryRef && paintGalleryRef());

  function section(title, ...kids) {
    return h('section', { class: 'cfg' }, h('h3', { class: 'cfg-title' }, h('span', { text: '▸ ' }), title), ...kids);
  }
  function row(label, control, hint) {
    return h('div', { class: 'cfg-row' }, h('div', { class: 'cfg-label' }, label, hint ? h('small', { text: hint }) : null), control);
  }
  function toggle(label, get, set, hint) {
    const b = h('button', { class: `switch${get() ? ' on' : ''}`, role: 'switch', 'aria-checked': String(!!get()) }, h('i'));
    b.addEventListener('click', () => { const v = !get(); set(v); b.classList.toggle('on', v); b.setAttribute('aria-checked', String(v)); NX.saveSettings(); NX.sfx('tick'); });
    return row(label, b, hint);
  }
  function select(label, opts, get, set) {
    const s = h('select', {}, opts.map(([v, l]) => h('option', { value: v, selected: String(get()) === String(v) }, l)));
    s.addEventListener('change', () => { set(s.value); NX.saveSettings(); });
    return row(label, s);
  }
  function seg(label, opts, get, set) {
    const wrap = h('div', { class: 'seg' });
    opts.forEach(([v, l]) => {
      const b = h('button', { class: get() === v ? 'on' : '' }, l);
      b.addEventListener('click', () => { set(v); NX.$$('button', wrap).forEach((x) => x.classList.toggle('on', x === b)); NX.saveSettings(); NX.sfx('tick'); });
      wrap.append(b);
    });
    return h('div', { class: 'cfg-row col' }, h('div', { class: 'cfg-label', text: label }), wrap);
  }
  function text(label, get, set, ph) {
    const i = h('input', { type: 'text', value: get() || '', placeholder: ph || '' });
    i.addEventListener('input', NX.debounce(() => { set(i.value); NX.saveSettings(); }, 300));
    return row(label, i);
  }

  function build() {
    const body = NX.$('#settings-body');
    body.innerHTML = '';

    // ── profile ──
    body.append(section('ПРОФИЛЬ',
      text('Имя', () => S().name, (v) => { S().name = v; NX.Clock.refresh(); }, 'как к тебе обращаться'),
      text('Заголовок карточки', () => S().deck.title, (v) => { S().deck.title = v; NX.$('#deck-title').textContent = v; }, 'Wake up, runner.')));

    // ── theme ──
    const sw = h('div', { class: 'swatches' });
    Object.entries(NX.THEMES).forEach(([k, t]) => {
      const b = h('button', { class: `swatch${S().theme === k ? ' on' : ''}`, title: t.name, style: `--sa:${t.a};--sb:${t.b};--sc:${t.c};--sbg:${t.bg}` }, h('i'), h('span', { text: t.name }));
      b.addEventListener('click', () => { S().theme = k; NX.$$('.swatch', sw).forEach((x) => x.classList.toggle('on', x === b)); NX.saveSettings(); NX.sfx('ok'); });
      sw.append(b);
    });
    body.append(section('ТЕМА', sw,
      toggle('Сканлайны CRT', () => S().fx.scanlines, (v) => (S().fx.scanlines = v)),
      toggle('Шум плёнки', () => S().fx.noise, (v) => (S().fx.noise = v)),
      toggle('Глитч-эффекты', () => S().fx.glitch, (v) => (S().fx.glitch = v)),
      toggle('Стекло (blur)', () => S().fx.blur, (v) => (S().fx.blur = v), 'выключи, если тормозит'),
      toggle('Загрузочный экран', () => S().fx.boot, (v) => (S().fx.boot = v)),
      toggle('Звуки интерфейса', () => S().sfx, (v) => (S().sfx = v))));

    // ── scene ──
    const seedLabel = h('span', { class: 'mono', text: `#${NX.Scene.citySeed()}` });
    const seedRow = h('div', { class: 'inline' },
      seedLabel,
      h('button', { class: 'btn ghost', title: 'Другой город в этой вкладке', onclick: () => {
        if (S().scene.cityMode === 'fixed') { S().scene.seed = 1 + Math.floor(Math.random() * 99999); NX.saveSettings(); }
        else NX.Scene.reroll();
        NX.Pixel.regen();
        seedLabel.textContent = `#${NX.Scene.citySeed()}`;
      } }, '↻ ДРУГОЙ'),
      h('button', { class: 'btn ghost', title: 'Показывать этот город на всех вкладках', onclick: () => {
        S().scene.seed = NX.Scene.citySeed(); S().scene.cityMode = 'fixed'; NX.saveSettings(); build();
        NX.toast(`Город #${S().scene.seed} закреплён`);
      } }, '📌 ЗАКРЕПИТЬ'));
    body.append(section('СЦЕНА',
      toggle('Анимация', () => S().scene.enabled, (v) => (S().scene.enabled = v)),
      select('Качество', [['low', 'Низкое'], ['med', 'Среднее'], ['high', 'Высокое']], () => S().scene.quality, (v) => (S().scene.quality = v)),
      select('Лимит FPS', [[30, '30'], [60, '60'], [120, '120']], () => S().scene.fps, (v) => (S().scene.fps = +v)),
      toggle('Параллакс от мыши', () => S().scene.parallax, (v) => (S().scene.parallax = v)),
      toggle('Летающий трафик', () => S().scene.traffic, (v) => (S().scene.traffic = v)),
      seg('Время суток', [['auto', 'АВТО'], ['dawn', 'РАССВЕТ'], ['day', 'ДЕНЬ'], ['dusk', 'ЗАКАТ'], ['night', 'НОЧЬ']], () => S().scene.time, (v) => (S().scene.time = v)),
      seg('Погода в сцене', [['auto', 'АВТО'], ['clear', 'ЯСНО'], ['clouds', 'ОБЛАКА'], ['rain', 'ДОЖДЬ'], ['storm', 'ГРОЗА'], ['snow', 'СНЕГ'], ['fog', 'ТУМАН']], () => S().scene.weather, (v) => (S().scene.weather = v)),
      seg('Город', [['tab', 'НОВЫЙ НА КАЖДОЙ ВКЛАДКЕ'], ['fixed', 'ВСЕГДА ОДИН']], () => S().scene.cityMode, (v) => { S().scene.cityMode = v; setTimeout(() => { NX.Pixel.regen(); seedLabel.textContent = `#${NX.Scene.citySeed()}`; }); }),
      row('Текущий город', seedRow)));

    // ── weather ──
    const results = h('ul', { class: 'geo-results' });
    const cityIn = h('input', { type: 'text', placeholder: 'найти город…' });
    const cur = h('span', { class: 'mono', text: S().weather.place });
    const setPlace = (p) => { S().weather = { lat: p.lat, lon: p.lon, place: p.name }; cur.textContent = p.name; results.innerHTML = ''; cityIn.value = ''; NX.saveSettings(); NX.Weather.reload(); NX.toast(`Локация: ${p.name}`); };
    cityIn.addEventListener('input', NX.debounce(async () => {
      const q = cityIn.value.trim();
      results.innerHTML = '';
      if (q.length < 2) return;
      try {
        const list = await NX.Weather.geocode(q);
        list.forEach((p) => results.append(h('li', {}, h('button', { onclick: () => setPlace(p) }, h('b', { text: p.name }), ' ', h('small', { text: p.sub })))));
        if (!list.length) results.append(h('li', { class: 'muted', text: 'ничего не найдено' }));
      } catch { results.append(h('li', { class: 'muted', text: 'нет сети' })); }
    }, 350));
    const geoBtn = h('button', { class: 'btn ghost', onclick: () => {
      navigator.geolocation.getCurrentPosition(
        (p) => setPlace({ lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3), name: 'Моё место' }),
        () => NX.toast('Геолокация недоступна', 'err'));
    } }, '⌖ ГЕОЛОКАЦИЯ');
    body.append(section('ПОГОДА',
      row('Сейчас', cur),
      h('div', { class: 'cfg-row col' }, cityIn, results),
      h('div', { class: 'inline' }, geoBtn, h('button', { class: 'btn ghost', onclick: () => { NX.Weather.reload(); NX.toast('Погода обновляется…'); } }, '↻ ОБНОВИТЬ'))));

    // ── search ──
    const bangs = h('textarea', { class: 'code', rows: 8, spellcheck: 'false' });
    bangs.value = S().search.bangs.map((b) => `${b.k} | ${b.name} | ${b.url}`).join('\n');
    bangs.addEventListener('input', NX.debounce(() => {
      S().search.bangs = bangs.value.split('\n').map((l) => l.split('|').map((x) => x.trim())).filter((p) => p.length >= 3 && p[0] && p[2].includes('%s')).map(([k, name, url]) => ({ k: k.replace(/^!/, ''), name, url }));
      NX.saveSettings();
    }, 500));
    body.append(section('ПОИСК',
      select('Поисковик', Object.entries(NX.ENGINES).map(([k, e]) => [k, e.name]), () => S().search.engine, (v) => { S().search.engine = v; NX.Search.paintEngine(); }),
      toggle('Открывать в новой вкладке', () => S().search.newTab, (v) => (S().search.newTab = v)),
      h('div', { class: 'cfg-row col' }, h('div', { class: 'cfg-label' }, 'Бэнги', h('small', { text: 'ключ | название | адрес с %s — пиши «!y котики» или «котики !y»' })), bangs),
      h('button', { class: 'linkbtn', onclick: () => { S().search.bangs = JSON.parse(JSON.stringify(NX.DEFAULT_BANGS)); NX.saveSettings(); build(); } }, 'вернуть стандартные бэнги')));

    // ── images ──
    const grid = h('div', { class: 'gallery' });
    const paintGallery = () => {
      grid.innerHTML = '';
      NX.data.gallery.forEach((g, i) => {
        grid.append(h('div', { class: 'thumb' },
          h('img', { src: g.src, alt: '', onclick: () => NX.Deck.showImage(i) }),
          h('button', { class: 'del', title: 'Удалить', onclick: async () => { NX.data.gallery.splice(i, 1); await NX.Store.set('gallery', NX.data.gallery); paintGallery(); NX.Deck.pickInitial(); } }, '✕')));
      });
      if (!NX.data.gallery.length) grid.append(h('div', { class: 'muted', text: 'Пока пусто — показывается пиксельная сцена.' }));
    };
    paintGallery();
    paintGalleryRef = paintGallery;
    const file = h('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true });
    file.addEventListener('change', () => NX.Deck.addImages(file.files));
    const urlIn = h('input', { type: 'text', placeholder: 'https://…/pixel.gif' });
    const addUrl = async () => {
      const u = urlIn.value.trim(); if (!u) return;
      NX.data.gallery.push({ id: NX.uid(), src: u, name: u });
      await NX.Store.set('gallery', NX.data.gallery);
      urlIn.value = ''; paintGallery(); NX.Deck.showImage(NX.data.gallery.length - 1);
    };
    urlIn.addEventListener('keydown', (e) => e.key === 'Enter' && addUrl());
    body.append(section('КАРТИНКИ',
      select('Режим', [['random', 'Случайная на каждой вкладке'], ['fixed', 'Всегда первая'], ['pixel', 'Только пиксельная сцена']], () => S().deck.imageMode, (v) => { S().deck.imageMode = v; NX.Deck.pickInitial(); }),
      grid,
      h('div', { class: 'inline' }, h('button', { class: 'btn', onclick: () => file.click() }, '+ ФАЙЛЫ'), urlIn, h('button', { class: 'btn ghost', onclick: addUrl }, '+ URL'), file),
      h('small', { class: 'muted', text: 'Можно просто перетащить картинку или GIF на карточку. Клик по картинке — следующая.' })));

    // ── bookmarks ──
    body.append(section('ЗАКЛАДКИ',
      toggle('Открывать в новой вкладке', () => S().deck.newTab, (v) => { S().deck.newTab = v; NX.Deck.render(); }),
      h('div', { class: 'inline' },
        h('button', { class: 'btn', onclick: () => NX.Deck.importFirefox() }, '⇩ ИЗ ПАНЕЛИ FIREFOX'),
        h('button', { class: 'btn ghost', onclick: () => { if (confirm('Сбросить закладки к стандартным?')) { NX.data.bookmarks = JSON.parse(JSON.stringify(NX.DEFAULT_BOOKMARKS)); NX.Store.set('bookmarks', NX.data.bookmarks); NX.Deck.render(); } } }, 'СБРОС')),
      h('small', { class: 'muted', text: 'Импорт берёт папки с панели закладок: каждая папка станет группой. Редактирование — клавиша E.' })));

    // ── data ──
    const imp = h('input', { type: 'file', accept: 'application/json', hidden: true });
    imp.addEventListener('change', async () => {
      try {
        const obj = JSON.parse(await imp.files[0].text());
        await NX.Store.importAll(obj);
        location.reload();
      } catch { NX.toast('Не удалось прочитать файл', 'err'); }
    });
    body.append(section('ДАННЫЕ',
      h('div', { class: 'inline' },
        h('button', { class: 'btn', onclick: async () => {
          const blob = new Blob([JSON.stringify(await NX.Store.exportAll(), null, 2)], { type: 'application/json' });
          const a = h('a', { href: URL.createObjectURL(blob), download: `neon-deck-${new Date().toISOString().slice(0, 10)}.json` });
          document.body.append(a); a.click(); a.remove();
        } }, '⇧ ЭКСПОРТ'),
        h('button', { class: 'btn ghost', onclick: () => imp.click() }, '⇩ ИМПОРТ'), imp,
        h('button', { class: 'btn danger', onclick: async () => { if (confirm('Стереть все настройки, задачи и закладки?')) { await NX.Store.reset(); location.reload(); } } }, 'СБРОС ВСЕГО'))));

    // ── custom css ──
    const cssTa = h('textarea', { class: 'code', rows: 6, spellcheck: 'false', placeholder: '.deck-title { color: hotpink; }' });
    cssTa.value = S().customCss || '';
    cssTa.addEventListener('input', NX.debounce(() => { S().customCss = cssTa.value; NX.saveSettings(); }, 400));
    body.append(section('СВОЙ CSS', cssTa));

    body.append(h('div', { class: 'cfg-foot muted', text: 'NEON//DECK v1.0 · © Frnllk · GPL-3.0 · погода: Open-Meteo.com (CC BY 4.0) · иконки сайтов: DuckDuckGo · шрифты: SIL OFL 1.1' }));
  }

  NX.Settings = {
    open() {
      build();
      const d = NX.$('#settings');
      d.classList.add('open'); d.setAttribute('aria-hidden', 'false');
      NX.sfx('open');
    },
    close() { const d = NX.$('#settings'); d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); },
    toggle() { NX.$('#settings').classList.contains('open') ? this.close() : this.open(); },
  };
})(window.NX);
