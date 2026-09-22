/* Big glitchy clock, date, greeting and a "day progress" bar. */
(function (NX) {
  const DAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  function greeting(h) {
    if (h >= 5 && h < 12) return 'Доброе утро';
    if (h >= 12 && h < 18) return 'Добрый день';
    if (h >= 18 && h < 23) return 'Добрый вечер';
    return 'Доброй ночи';
  }

  let lastMin = -1;
  function tick() {
    const d = new Date();
    const hh = NX.pad(d.getHours()), mm = NX.pad(d.getMinutes());
    NX.$('#clock-sec').textContent = NX.pad(d.getSeconds());
    if (d.getMinutes() === lastMin) return;
    lastMin = d.getMinutes();
    const el = NX.$('#clock');
    el.textContent = `${hh}:${mm}`;
    el.dataset.text = `${hh}:${mm}`;
    NX.$('#date').textContent = NX.t('{day}, {date} {month}', { day: NX.t(DAYS[d.getDay()]), date: d.getDate(), month: NX.t(MONTHS[d.getMonth()]) });
    const name = (NX.settings.name || '').trim();
    NX.$('#greet').textContent = NX.t('{greet}, {name}.', { greet: NX.t(greeting(d.getHours())), name: name || NX.t('раннер') });
    const off = -d.getTimezoneOffset() / 60;
    NX.$('#hero-tz').textContent = `UTC${off >= 0 ? '+' : ''}${off} · ${Intl.DateTimeFormat().resolvedOptions().timeZone || ''}`;
    const p = (d.getHours() * 60 + d.getMinutes()) / 1440;
    NX.$('#dayprogress').style.width = `${(p * 100).toFixed(1)}%`;
    NX.$('#dayprogress-label').textContent = `DAY ${Math.round(p * 100)}%`;
  }

  // Random short glitch bursts on the clock and brand.
  function glitchLoop() {
    setTimeout(() => {
      if (NX.settings.fx.glitch && !document.hidden) {
        NX.$$('.glitch').forEach((g) => { g.classList.add('glitching'); setTimeout(() => g.classList.remove('glitching'), 380); });
      }
      glitchLoop();
    }, 5000 + Math.random() * 9000);
  }

  NX.Clock = {
    init() { tick(); setInterval(tick, 1000); glitchLoop(); },
    refresh() { lastMin = -1; tick(); },
  };
})(window.NX);
