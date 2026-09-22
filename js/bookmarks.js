/* The deck card: image slot (pixel scene or user gallery) + bookmark groups
   with an edit mode (add / rename / delete / drag between groups). */
(function (NX) {
  // ── Generic modal form ──
  NX.Modal = {
    open({ title, fields, submit = 'СОХРАНИТЬ', onSubmit, danger }) {
      const modal = NX.$('#modal'), form = NX.$('#modal-form');
      NX.$('#modal-title').textContent = title;
      form.innerHTML = '';
      for (const f of fields) {
        let input;
        if (f.type === 'select') {
          input = NX.h('select', { name: f.name }, f.options.map(([v, l]) => NX.h('option', { value: v, selected: v === f.value }, l)));
        } else {
          input = NX.h('input', { name: f.name, type: f.type || 'text', value: f.value ?? '', placeholder: f.placeholder || '', required: f.required });
        }
        form.append(NX.h('label', { class: 'field' }, NX.h('span', { text: f.label }), input));
      }
      const btns = NX.h('div', { class: 'modal-btns' });
      if (danger) btns.append(NX.h('button', { type: 'button', class: 'btn danger', onclick: () => { danger.fn(); this.close(); } }, danger.label));
      btns.append(NX.h('span', { class: 'spacer' }),
        NX.h('button', { type: 'button', class: 'btn ghost', onclick: () => this.close() }, 'ОТМЕНА'),
        NX.h('button', { type: 'submit', class: 'btn' }, submit));
      form.append(btns);
      form.onsubmit = (e) => {
        e.preventDefault();
        const vals = Object.fromEntries(new FormData(form).entries());
        if (onSubmit(vals) !== false) this.close();
      };
      modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
      NX.sfx('open');
      setTimeout(() => { const first = form.querySelector('input,select'); first && first.focus(); }, 30);
    },
    close() { const m = NX.$('#modal'); m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); },
  };
  NX.$('#modal').addEventListener('mousedown', (e) => { if (e.target.id === 'modal') NX.Modal.close(); });

  const save = () => NX.Store.set('bookmarks', NX.data.bookmarks);
  const normUrl = (u) => (/^[a-z][\w+.-]*:/i.test(u) ? u : 'https://' + u.trim());

  function linkModal(link, group) {
    const groups = NX.data.bookmarks;
    NX.Modal.open({
      title: link ? 'EDIT://LINK' : 'NEW://LINK',
      fields: [
        { name: 'name', label: 'Название', value: link ? link.name : '', required: true },
        { name: 'url', label: 'Адрес', value: link ? link.url : '', placeholder: 'example.com', required: true },
        { name: 'group', label: 'Группа', type: 'select', value: group.id, options: groups.map((g) => [g.id, g.name]) },
      ],
      danger: link && { label: 'УДАЛИТЬ', fn: () => { group.links = group.links.filter((l) => l !== link); save(); render(); NX.sfx('del'); } },
      onSubmit: ({ name, url, group: gid }) => {
        const target = groups.find((g) => g.id === gid) || group;
        if (link) {
          Object.assign(link, { name: name.trim(), url: normUrl(url) });
          if (target !== group) { group.links = group.links.filter((l) => l !== link); target.links.push(link); }
        } else target.links.push({ id: NX.uid(), name: name.trim(), url: normUrl(url) });
        save(); render(); NX.sfx('ok');
      },
    });
  }

  function groupModal(group) {
    NX.Modal.open({
      title: group ? 'EDIT://GROUP' : 'NEW://GROUP',
      fields: [{ name: 'name', label: 'Название группы', value: group ? group.name : '', required: true }],
      danger: group && { label: 'УДАЛИТЬ ГРУППУ', fn: () => { NX.data.bookmarks = NX.data.bookmarks.filter((g) => g !== group); save(); render(); NX.sfx('del'); } },
      onSubmit: ({ name }) => {
        if (group) group.name = name.trim();
        else NX.data.bookmarks.push({ id: NX.uid(), name: name.trim(), links: [] });
        save(); render(); NX.sfx('ok');
      },
    });
  }

  // ── Drag & drop (edit mode) ──
  let drag = null;
  function dnd(el, group, link) {
    el.draggable = true;
    el.addEventListener('dragstart', (e) => { drag = { group, link }; el.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', link.url); });
    el.addEventListener('dragend', () => { el.classList.remove('dragging'); drag = null; NX.$$('.drop-before').forEach((x) => x.classList.remove('drop-before')); });
    el.addEventListener('dragover', (e) => { if (drag && drag.link) { e.preventDefault(); el.classList.add('drop-before'); } });
    el.addEventListener('dragleave', () => el.classList.remove('drop-before'));
    el.addEventListener('drop', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (!drag || drag.link === link) return;
      drag.group.links = drag.group.links.filter((l) => l !== drag.link);
      group.links.splice(group.links.indexOf(link), 0, drag.link);
      save(); render();
    });
  }
  function dropZone(el, group) {
    el.addEventListener('dragover', (e) => { if (drag) e.preventDefault(); });
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!drag) return;
      drag.group.links = drag.group.links.filter((l) => l !== drag.link);
      group.links.push(drag.link);
      save(); render();
    });
  }

  function render() {
    const root = NX.$('#groups');
    root.innerHTML = '';
    const nt = NX.settings.deck.newTab;
    let n = 0;
    NX.data.bookmarks.forEach((g, gi) => {
      const col = NX.h('div', { class: 'group', style: `--i:${gi}` });
      col.append(NX.h('div', { class: 'group-name' },
        NX.h('span', { text: g.name }),
        NX.h('button', { class: 'ed', title: 'Переименовать', onclick: () => groupModal(g) }, '✎')));
      const ul = NX.h('ul', { class: 'links' });
      g.links.forEach((l) => {
        n++;
        const a = NX.h('a', { href: l.url, class: 'link', target: nt ? '_blank' : null, rel: 'noopener' },
          NX.h('span', { class: 'num', text: n <= 9 ? n : '' }),
          NX.h('img', { class: 'fav', src: NX.favicon(l.url), alt: '', loading: 'lazy', onerror: (e) => e.target.classList.add('none') }),
          NX.h('span', { class: 'ln', text: l.name }));
        a.addEventListener('mouseenter', () => { NX.sfx('tick'); NX.warm(l.url); });
        a.addEventListener('focus', () => NX.warm(l.url));
        a.addEventListener('click', (e) => {
          if (document.body.classList.contains('editing')) { e.preventDefault(); linkModal(l, g); return; }
          // plain left click in this tab → show the connecting screen; modified clicks open elsewhere
          if (!nt && e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) NX.leaving(l.url);
        });
        const li = NX.h('li', {}, a);
        if (document.body.classList.contains('editing')) dnd(li, g, l);
        ul.append(li);
      });
      ul.append(NX.h('li', { class: 'add' }, NX.h('button', { class: 'linkbtn', onclick: () => linkModal(null, g) }, '+ ссылка')));
      dropZone(ul, g);
      col.append(ul);
      root.append(col);
    });
    root.append(NX.h('div', { class: 'group group-add' }, NX.h('button', { class: 'linkbtn', onclick: () => groupModal(null) }, '+ группа')));
  }

  // ── Image slot ──
  let imgIndex = -1;
  function showImage(i) {
    const gal = NX.data.gallery;
    const photo = NX.$('#deck-photo'), pix = NX.$('#pixel'), cap = NX.$('#deck-img-cap');
    if (NX.settings.deck.imageMode === 'pixel' || !gal.length || i < 0) {
      imgIndex = -1;
      photo.hidden = true; pix.hidden = false; NX.Pixel.start();
      cap.textContent = 'LIVE FEED · CAM_07';
      return;
    }
    imgIndex = ((i % gal.length) + gal.length) % gal.length;
    photo.src = gal[imgIndex].src;
    photo.hidden = false; pix.hidden = true; NX.Pixel.stop();
    cap.textContent = `IMG ${imgIndex + 1}/${gal.length}`;
    NX.$('#deck-img').classList.remove('swap'); void photo.offsetWidth; NX.$('#deck-img').classList.add('swap');
  }
  function pickInitial() {
    const gal = NX.data.gallery;
    const mode = NX.settings.deck.imageMode;
    if (mode === 'pixel' || !gal.length) return showImage(-1);
    showImage(mode === 'fixed' ? 0 : Math.floor(Math.random() * gal.length));
  }

  async function addImages(files) {
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue;
      const src = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); });
      NX.data.gallery.push({ id: NX.uid(), src, name: f.name });
    }
    await NX.Store.set('gallery', NX.data.gallery);
    if (NX.settings.deck.imageMode === 'pixel') { NX.settings.deck.imageMode = 'random'; NX.saveSettings(); }
    showImage(NX.data.gallery.length - 1);
    NX.toast('Картинка добавлена в галерею');
    NX.emit('gallery');
  }

  NX.Deck = {
    init() {
      render();
      NX.$('#deck-title').textContent = NX.settings.deck.title;
      pickInitial();
      const box = NX.$('#deck-img');
      box.addEventListener('click', () => {
        const n = NX.data.gallery.length;
        if (!n || NX.settings.deck.imageMode === 'pixel') return;
        // cycle: pixel scene is the last stop before wrapping around
        showImage(imgIndex + 1 >= n ? -1 : imgIndex + 1);
        NX.sfx('tick');
      });
      ['dragenter', 'dragover'].forEach((ev) => box.addEventListener(ev, (e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); box.classList.add('dropping'); } }));
      ['dragleave', 'drop'].forEach((ev) => box.addEventListener(ev, () => box.classList.remove('dropping')));
      box.addEventListener('drop', (e) => { e.preventDefault(); addImages(e.dataTransfer.files); });
    },
    render,
    showImage, pickInitial, addImages,
    async importFirefox() {
      if (typeof browser === 'undefined' || !browser.permissions) return NX.toast('Импорт работает только в расширении', 'err');
      const ok = await browser.permissions.request({ permissions: ['bookmarks'] });
      if (!ok) return NX.toast('Доступ к закладкам не выдан', 'err');
      const [tree] = await browser.bookmarks.getTree();
      const toolbar = (tree.children || []).find((c) => c.id === 'toolbar_____') || tree.children[0];
      const groups = [];
      const loose = [];
      for (const n of toolbar.children || []) {
        if (n.url && /^https?:/.test(n.url)) loose.push({ id: NX.uid(), name: n.title || NX.domainOf(n.url), url: n.url });
        else if (n.children) {
          const links = n.children.filter((c) => c.url && /^https?:/.test(c.url)).slice(0, 12).map((c) => ({ id: NX.uid(), name: c.title || NX.domainOf(c.url), url: c.url }));
          if (links.length) groups.push({ id: NX.uid(), name: n.title.toLowerCase(), links });
        }
      }
      if (loose.length) groups.unshift({ id: NX.uid(), name: 'toolbar', links: loose.slice(0, 12) });
      if (!groups.length) return NX.toast('На панели закладок пусто', 'err');
      NX.data.bookmarks = groups;
      save(); render();
      NX.toast(NX.t('Импортировано групп: {n}', { n: groups.length }));
    },
  };
})(window.NX);
