/* QUEST_LOG: todos with "main quests" (prefix !), drag reorder, double-click to
   edit. Syncs live across open tabs through storage change events. */
(function (NX) {
  const save = () => NX.Store.set('todos', NX.data.todos);
  let drag = null;

  function render() {
    const ul = NX.$('#todo-list');
    ul.innerHTML = '';
    const todos = NX.data.todos;
    if (!todos.length) ul.append(NX.h('li', { class: 'todo-empty', text: '// журнал пуст. свободен как ветер.' }));
    todos.forEach((t) => {
      const li = NX.h('li', { class: `todo${t.done ? ' done' : ''}${t.main ? ' main' : ''}`, draggable: 'true' },
        NX.h('button', { class: 'chk', title: 'Выполнено', onclick: () => toggle(t) }, t.done ? '[x]' : '[ ]'),
        NX.h('span', { class: 'txt', text: t.text, title: 'Двойной клик — изменить' }),
        NX.h('button', { class: 'star', title: 'Главный квест', onclick: () => { t.main = !t.main; save(); render(); } }, '◆'),
        NX.h('button', { class: 'del', title: 'Удалить', onclick: () => remove(t, li) }, '✕'));
      li.querySelector('.txt').addEventListener('dblclick', () => edit(t));
      li.addEventListener('dragstart', () => { drag = t; li.classList.add('dragging'); });
      li.addEventListener('dragend', () => { drag = null; li.classList.remove('dragging'); });
      li.addEventListener('dragover', (e) => { if (drag && drag !== t) { e.preventDefault(); li.classList.add('drop-before'); } });
      li.addEventListener('dragleave', () => li.classList.remove('drop-before'));
      li.addEventListener('drop', (e) => {
        e.preventDefault(); li.classList.remove('drop-before');
        if (!drag || drag === t) return;
        const arr = NX.data.todos.filter((x) => x !== drag);
        arr.splice(arr.indexOf(t), 0, drag);
        NX.data.todos = arr; save(); render();
      });
      ul.append(li);
    });
    const open = todos.filter((t) => !t.done).length;
    NX.$('#todo-count').textContent = open;
    NX.$('#todo-stats').textContent = `${open} активн · ${todos.length - open} готово`;
    NX.emit('todos', open);
  }

  function toggle(t) {
    t.done = !t.done;
    save(); render();
    if (t.done) {
      NX.sfx('ok');
      NX.toast(t.main ? 'ГЛАВНЫЙ КВЕСТ ВЫПОЛНЕН · +250 XP' : 'Квест выполнен · +50 XP');
    }
  }
  function remove(t, li) {
    li.classList.add('removing');
    NX.sfx('del');
    setTimeout(() => { NX.data.todos = NX.data.todos.filter((x) => x !== t); save(); render(); }, 220);
  }
  function edit(t) {
    NX.Modal.open({
      title: 'EDIT://QUEST',
      fields: [{ name: 'text', label: 'Задача', value: t.text, required: true }],
      onSubmit: ({ text }) => { t.text = text.trim(); save(); render(); },
    });
  }

  NX.Todo = {
    init() {
      render();
      NX.$('#todo-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const inp = NX.$('#todo-input');
        let text = inp.value.trim();
        if (!text) return;
        const main = text.startsWith('!');
        if (main) text = text.slice(1).trim();
        NX.data.todos.unshift({ id: NX.uid(), text, done: false, main });
        inp.value = '';
        save(); render(); NX.sfx('tick');
      });
      NX.$('#todo-clear').addEventListener('click', () => { NX.data.todos = NX.data.todos.filter((t) => !t.done); save(); render(); });
      NX.Store.on('todos', (v) => { if (v) { NX.data.todos = v; render(); } });
    },
    focus() { NX.showTab('quests'); NX.$('#todo-input').focus(); },
  };
})(window.NX);
