/* Weather from Open-Meteo (no API key). Drives the scene and renders an
   ASCII-art HUD panel with an hourly chart and a 5-day forecast. */
(function (NX) {
  const TTL = 20 * 60 * 1000;

  const DESC = {
    0: 'Ясно', 1: 'Преимущественно ясно', 2: 'Переменная облачность', 3: 'Пасмурно',
    45: 'Туман', 48: 'Изморозь и туман',
    51: 'Лёгкая морось', 53: 'Морось', 55: 'Сильная морось', 56: 'Ледяная морось', 57: 'Сильная ледяная морось',
    61: 'Небольшой дождь', 63: 'Дождь', 65: 'Ливень', 66: 'Ледяной дождь', 67: 'Сильный ледяной дождь',
    71: 'Небольшой снег', 73: 'Снег', 75: 'Сильный снегопад', 77: 'Снежная крупа',
    80: 'Кратковременный дождь', 81: 'Ливневый дождь', 82: 'Сильный ливень',
    85: 'Снегопад', 86: 'Сильный снегопад',
    95: 'Гроза', 96: 'Гроза с градом', 99: 'Сильная гроза с градом',
  };

  const ART = {
    sun: [['    \\   /    ', 's'], ['     .-.     ', 's'], ['  ― (   ) ―  ', 's'], ["     `-'     ", 's'], ['    /   \\    ', 's']],
    moon: [['     _..     ', 'm'], ["   .' .'   * ", 'm'], ['  :  :       ', 'm'], ["   '. '.  .  ", 'm'], ["     ''    * ", 'm']],
    partly: [['   \\  /      ', 's'], [' _ /"".-.    ', 'c'], ['   \\_(   ).  ', 'c'], ['   /(___(__) ', 'c'], ['             ', '']],
    cloud: [['             ', ''], ['     .--.    ', 'c'], ['  .-(    ).  ', 'c'], [' (___.__)__) ', 'c'], ['             ', '']],
    fog: [['             ', ''], [' _ - _ - _ - ', 'f'], ['  _ - _ - _  ', 'f'], [' _ - _ - _ - ', 'f'], ['             ', '']],
    rain: [['     .-.     ', 'c'], ['    (   ).   ', 'c'], ['   (___(__)  ', 'c'], ['    / / / /  ', 'r'], ['   / / / /   ', 'r']],
    snow: [['     .-.     ', 'c'], ['    (   ).   ', 'c'], ['   (___(__)  ', 'c'], ['    *  *  *  ', 'w'], ['   *  *  *   ', 'w']],
    storm: [['     .-.     ', 'c'], ['    (   ).   ', 'c'], ['   (___(__)  ', 'c'], ['    /_  /_   ', 's'], ['     /   /   ', 's']],
  };

  function artFor(code, isDay) {
    if (code === 0 || code === 1) return isDay ? 'sun' : 'moon';
    if (code === 2) return isDay ? 'partly' : 'cloud';
    if (code === 3) return 'cloud';
    if (code === 45 || code === 48) return 'fog';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
    if (code >= 95) return 'storm';
    return 'rain';
  }
  const GLYPH = { sun: '☼', moon: '☾', partly: '⛅', cloud: '☁', fog: '≋', rain: '☂', snow: '❄', storm: 'ϟ' };

  // Open-Meteo returns local wall-clock strings; convert with the place's UTC offset.
  const epoch = (s, off) => Date.parse(s + 'Z') - off * 1000;
  const hm = (t) => { const d = new Date(t); return `${NX.pad(d.getHours())}:${NX.pad(d.getMinutes())}`; };
  const sign = (t) => `${t > 0 ? '+' : ''}${Math.round(t)}°`;
  const WDIR = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘']; // arrow shows where the wind blows to

  async function fetchWeather(lat, lon) {
    const u = new URL('https://api.open-meteo.com/v1/forecast');
    u.search = new URLSearchParams({
      latitude: lat, longitude: lon, timezone: 'auto', wind_speed_unit: 'ms', forecast_days: 6,
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,surface_pressure,is_day,precipitation',
      hourly: 'temperature_2m,precipitation_probability,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max',
    });
    const r = await fetch(u);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  function render(data) {
    const s = NX.settings.weather;
    const off = data.utc_offset_seconds || 0;
    const c = data.current;
    const d = data.daily;
    const sr = epoch(d.sunrise[0], off), ss = epoch(d.sunset[0], off);
    const art = ART[artFor(c.weather_code, c.is_day)];

    NX.$('#w-place').textContent = s.place.toUpperCase();
    const body = NX.$('#w-body');
    body.innerHTML = '';

    const ascii = NX.h('pre', { class: 'w-ascii' });
    art.forEach(([line, cls]) => ascii.append(NX.h('span', { class: cls ? 'a-' + cls : '' }, line), '\n'));

    body.append(
      NX.h('div', { class: 'w-now' },
        ascii,
        NX.h('div', { class: 'w-temp' },
          NX.h('div', { class: 'w-deg', text: sign(c.temperature_2m) }),
          NX.h('div', { class: 'w-desc', text: DESC[c.weather_code] || '—' }),
          NX.h('div', { class: 'w-feel', text: `ощущается ${sign(c.apparent_temperature)}` }))),
      NX.h('div', { class: 'w-stats' },
        stat('ВЕТЕР', `${c.wind_speed_10m.toFixed(1)} м/с ${WDIR[Math.round(c.wind_direction_10m / 45) % 8]}`),
        stat('ВЛАЖН', `${c.relative_humidity_2m}%`),
        stat('ДАВЛ', `${Math.round(c.surface_pressure * 0.750062)} мм`),
        stat('ВОСХОД', hm(sr)),
        stat('ЗАКАТ', hm(ss)),
        stat('UV', String(Math.round(d.uv_index_max[0] ?? 0)))),
      hourly(data, off),
      days(data),
      NX.h('a', { class: 'w-src', href: 'https://open-meteo.com/', target: '_blank', rel: 'noopener', text: 'Weather data by Open-Meteo.com · CC BY 4.0' }));

    NX.Scene.setSun(sr, ss);
    NX.Scene.setWeatherCode(c.weather_code, c.cloud_cover);
    NX.emit('weather', { temp: sign(c.temperature_2m), desc: DESC[c.weather_code] || '', place: s.place, tomorrow: `${sign(d.temperature_2m_min[1])}…${sign(d.temperature_2m_max[1])}` });
  }

  function stat(k, v) { return NX.h('div', { class: 'w-stat' }, NX.h('span', { class: 'k', text: k }), NX.h('span', { class: 'v', text: v })); }

  // 12-hour temperature line + precipitation bars as inline SVG.
  function hourly(data, off) {
    const now = Date.now();
    const H = data.hourly;
    let i0 = H.time.findIndex((t) => epoch(t, off) > now - 3600000);
    if (i0 < 0) i0 = 0;
    const n = 13;
    const temps = H.temperature_2m.slice(i0, i0 + n);
    const pp = H.precipitation_probability.slice(i0, i0 + n);
    const times = H.time.slice(i0, i0 + n);
    const W = 300, Ht = 74, top = 14, bot = 18;
    const mn = Math.min(...temps), mx = Math.max(...temps);
    const y = (t) => top + (1 - (t - mn) / (mx - mn || 1)) * (Ht - top - bot);
    const x = (i) => 6 + i * ((W - 12) / (n - 1));
    const line = temps.map((t, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(t).toFixed(1)}`).join('');
    const area = `${line}L${x(n - 1)},${Ht - bot}L${x(0)},${Ht - bot}Z`;
    let svg = `<svg class="w-chart" viewBox="0 0 ${W} ${Ht}" preserveAspectRatio="none">`;
    svg += '<defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--a)" stop-opacity=".35"/><stop offset="1" stop-color="var(--a)" stop-opacity="0"/></linearGradient></defs>';
    pp.forEach((p, i) => { if (p > 0) { const h = (p / 100) * (Ht - top - bot); svg += `<rect x="${x(i) - 4}" y="${Ht - bot - h}" width="8" height="${h}" class="w-pbar"/>`; } });
    svg += `<path d="${area}" fill="url(#wg)"/><path d="${line}" class="w-line"/>`;
    temps.forEach((t, i) => {
      if (i % 3) return;
      const hh = new Date(epoch(times[i], off)).getHours();
      svg += `<circle cx="${x(i)}" cy="${y(t)}" r="2.2" class="w-dot"/>`;
      svg += `<text x="${x(i)}" y="${y(t) - 5}" class="w-t">${Math.round(t)}°</text>`;
      svg += `<text x="${x(i)}" y="${Ht - 4}" class="w-h">${NX.pad(hh)}</text>`;
    });
    svg += '</svg>';
    return NX.h('div', { class: 'w-hourly' }, NX.h('div', { class: 'label', text: '// 12H · ТЕМП / ОСАДКИ' }), NX.h('div', {}, document.importNode(new DOMParser().parseFromString(svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '), 'image/svg+xml').documentElement, true)));
  }

  function days(data) {
    const d = data.daily;
    const DN = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
    const lo = Math.min(...d.temperature_2m_min.slice(1)), hi = Math.max(...d.temperature_2m_max.slice(1));
    const wrap = NX.h('div', { class: 'w-days' });
    for (let i = 1; i < d.time.length; i++) {
      const dt = new Date(d.time[i] + 'T12:00');
      const a = ((d.temperature_2m_min[i] - lo) / (hi - lo || 1)) * 100;
      const b = ((d.temperature_2m_max[i] - lo) / (hi - lo || 1)) * 100;
      const pp = d.precipitation_probability_max[i];
      wrap.append(NX.h('div', { class: 'w-day', title: `${DESC[d.weather_code[i]] || ''}${pp ? ` · осадки ${pp}%` : ''}` },
        NX.h('span', { class: 'dn' }, DN[dt.getDay()], ' ', NX.h('b', { class: 'gl', text: GLYPH[artFor(d.weather_code[i], 1)] })),
        NX.h('span', { class: 'hi', text: sign(d.temperature_2m_max[i]) }),
        NX.h('span', { class: 'lo' }, sign(d.temperature_2m_min[i]), pp ? NX.h('i', { class: 'pp', text: ` ${pp}%` }) : null),
        NX.h('span', { class: 'rng' }, NX.h('i', { style: `left:${a}%;width:${Math.max(8, b - a)}%` }))));
    }
    return wrap;
  }

  async function load(force = false) {
    const s = NX.settings.weather;
    const cache = NX.data.wcache;
    const fresh = cache && cache.lat === s.lat && cache.lon === s.lon && Date.now() - cache.at < TTL;
    if (cache && cache.lat === s.lat && cache.lon === s.lon) { try { render(cache.data); } catch (e) { console.warn(e); } }
    if (fresh && !force) return;
    try {
      const data = await fetchWeather(s.lat, s.lon);
      NX.data.wcache = { at: Date.now(), lat: s.lat, lon: s.lon, data };
      NX.Store.set('wcache', NX.data.wcache);
      render(data);
    } catch (e) {
      console.warn('weather', e);
      if (!cache) NX.$('#w-body').innerHTML = '<div class="loading err">НЕТ СИГНАЛА · проверь сеть</div>';
      NX.$('#chip-net').textContent = 'NET ○ OFFLINE';
      NX.$('#chip-net').classList.add('bad');
    }
  }

  NX.Weather = {
    init() { load(); setInterval(() => !document.hidden && load(), TTL); },
    reload: () => load(true),
    async geocode(q) {
      const u = `https://geocoding-api.open-meteo.com/v1/search?count=6&language=ru&format=json&name=${encodeURIComponent(q)}`;
      const r = await fetch(u);
      const j = await r.json();
      return (j.results || []).map((x) => ({ name: x.name, lat: x.latitude, lon: x.longitude, sub: [x.admin1, x.country].filter(Boolean).join(', ') }));
    },
  };
})(window.NX);
