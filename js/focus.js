/* FOCUS / NOTES panel. The pomodoro stores its end time, so every open tab
   shows the same countdown and it survives closing the tab. */
(function (NX) {
  const DUR = { focus: 25 * 60, break: 5 * 60, long: 15 * 60 };
  const LABEL = { focus: 'ФОКУС', break: 'ПЕРЕРЫВ', long: 'ДЛИННЫЙ ПЕРЕРЫВ' };
  const CIRC = 2 * Math.PI * 44;
  let P;

  const today = () => new Date().toISOString().slice(0, 10);
  const save = () => NX.Store.set('pomo', P);
  const remaining = () => (P.running ? Math.max(0, Math.round((P.endsAt - Date.now()) / 1000)) : P.left);

  function paint() {
    const left = remaining();
    const total = DUR[P.mode];
    NX.$('#pomo-time').textContent = `${NX.pad(Math.floor(left / 60))}:${NX.pad(left % 60)}`;
    NX.$('#pomo-mode').textContent = LABEL[P.mode];
    NX.$('#pomo-start').textContent = P.running ? 'ПАУЗА' : left < total ? 'ДАЛЬШЕ' : 'СТАРТ';
    const ring = NX.$('#pomo-ring');
    ring.style.strokeDasharray = CIRC;
    ring.style.strokeDashoffset = CIRC * (left / total);
    NX.$('#utils').classList.toggle('running', P.running);
    NX.$('#utils').dataset.mode = P.mode;
    NX.$('#pomo-count').textContent = '▰'.repeat(Math.min(P.done, 8)) + '▱'.repeat(Math.max(0, 4 - P.done)) + ` ${P.done} сегодня`;
    NX.$('#pomo-badge').textContent = P.running ? NX.$('#pomo-time').textContent : '';
    if (P.running) document.title = `${NX.$('#pomo-time').textContent} · ${LABEL[P.mode]}`;
    else if (document.title !== 'Новая вкладка') document.title = 'Новая вкладка';
    NX.emit('pomo', P.running ? `${LABEL[P.mode]} ${NX.$('#pomo-time').textContent}` : null);
  }

  function tick() {
    if (P.running && remaining() <= 0) {
      P.running = false;
      if (P.mode === 'focus') { P.done++; P.mode = P.done % 4 === 0 ? 'long' : 'break'; }
      else P.mode = 'focus';
      P.left = DUR[P.mode];
      save();
      const was = NX.settings.sfx; NX.settings.sfx = true; NX.sfx('alarm'); setTimeout(() => NX.sfx('alarm'), 600); NX.settings.sfx = was;
      NX.toast(P.mode === 'focus' ? 'Перерыв окончен. Назад в матрицу.' : 'Сессия фокуса завершена. Отдохни.');
    }
    paint();
  }

  NX.showTab = (name) => {
    NX.$$('#utils .tab').forEach((x) => x.classList.toggle('active', x.dataset.tab === name));
    NX.$$('#utils .tabpane').forEach((p) => p.classList.toggle('active', p.dataset.pane === name));
  };

  NX.Focus = {
    init() {
      P = NX.data.pomo;
      if (P.day !== today()) { P.day = today(); P.done = 0; }
      NX.$('#pomo-start').addEventListener('click', () => {
        if (P.running) { P.left = remaining(); P.running = false; }
        else { P.endsAt = Date.now() + remaining() * 1000; P.running = true; }
        save(); paint(); NX.sfx('ok');
      });
      NX.$('#pomo-reset').addEventListener('click', () => { P.running = false; P.left = DUR[P.mode]; save(); paint(); });
      NX.$('#pomo-switch').addEventListener('click', () => {
        P.running = false; P.mode = P.mode === 'focus' ? 'break' : 'focus'; P.left = DUR[P.mode]; save(); paint();
      });
      NX.Store.on('pomo', (v) => { if (v) { P = v; NX.data.pomo = v; paint(); } });

      // tabs
      NX.$$('#utils .tab').forEach((b) => b.addEventListener('click', () => { NX.showTab(b.dataset.tab); NX.sfx('tick'); }));

      // notes autosave
      const ta = NX.$('#notes');
      ta.value = NX.data.notes || '';
      ta.addEventListener('input', NX.debounce(() => { NX.data.notes = ta.value; NX.Store.set('notes', ta.value); }, 400));
      NX.Store.on('notes', (v) => { if (document.activeElement !== ta && typeof v === 'string') ta.value = v; });

      paint();
      setInterval(tick, 1000);
    },
  };
})(window.NX);
