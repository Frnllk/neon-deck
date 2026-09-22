/* Interface language. Source strings stay Russian in the code; this file maps
   them to English. NX.t() translates one string (with {placeholders}), and
   util.js runs every string that reaches the DOM through it, so most call
   sites need no changes. Static markup is translated once at startup. */
(function (NX) {
  const EN = {
    // ── clock ──
    'воскресенье': 'Sunday', 'понедельник': 'Monday', 'вторник': 'Tuesday', 'среда': 'Wednesday',
    'четверг': 'Thursday', 'пятница': 'Friday', 'суббота': 'Saturday',
    'января': 'January', 'февраля': 'February', 'марта': 'March', 'апреля': 'April',
    'мая': 'May', 'июня': 'June', 'июля': 'July', 'августа': 'August',
    'сентября': 'September', 'октября': 'October', 'ноября': 'November', 'декабря': 'December',
    '{day}, {date} {month}': '{day}, {month} {date}',
    'Доброе утро': 'Good morning', 'Добрый день': 'Good afternoon',
    'Добрый вечер': 'Good evening', 'Доброй ночи': 'Good night',
    '{greet}, {name}.': '{greet}, {name}.',
    'раннер': 'runner',

    // ── header / footer / overlays ──
    'Новая вкладка': 'New Tab',
    'Лента': 'Ticker',
    'Режим редактирования (E)': 'Edit mode (E)',
    'Горячие клавиши (?)': 'Keyboard shortcuts (?)',
    'Настройки (,)': 'Settings (,)',
    'Закрыть (Esc)': 'Close (Esc)',
    'Прогресс дня': 'Day progress',
    'поиск': 'search', 'задача': 'task', 'правка': 'edit', 'настройки': 'settings', 'клавиши': 'keys',
    'Ошибка запуска: {e}': 'Startup error: {e}',

    // ── search ──
    'Сменить поисковик (Tab на пустой строке)': 'Switch search engine (Tab on an empty line)',
    'поиск, адрес, !бэнг, 2+2 или закладка…': 'search, URL, !bang, 2+2 or a bookmark…',
    'Поиск': 'Search',
    '{name} — клик или Tab на пустой строке, чтобы сменить': '{name} — click, or press Tab on an empty line, to switch',
    'недавнее': 'recent',
    'Enter — скопировать': 'Enter to copy',
    'Скопировано: {v}': 'Copied: {v}',
    'Открыть {name}': 'Open {name}',
    'сабреддит': 'subreddit',
    'перейти': 'go',
    'искать в {engine}': 'search {engine}',
    'Поиск: {engine}': 'Search: {engine}',

    // ── deck / bookmarks ──
    'Перетащи сюда картинку или GIF': 'Drop an image or GIF here',
    'Добро пожаловать в сеть.': 'Welcome to the net.',
    '+ ссылка': '+ link', '+ группа': '+ group',
    'Переименовать': 'Rename',
    'Название': 'Name', 'Адрес': 'URL', 'Группа': 'Group', 'Название группы': 'Group name',
    'СОХРАНИТЬ': 'SAVE', 'ОТМЕНА': 'CANCEL', 'УДАЛИТЬ': 'DELETE', 'УДАЛИТЬ ГРУППУ': 'DELETE GROUP',
    'Картинка добавлена в галерею': 'Image added to the gallery',
    'Импорт работает только в расширении': 'Import only works inside the extension',
    'Доступ к закладкам не выдан': 'Bookmarks access was not granted',
    'На панели закладок пусто': 'The bookmarks toolbar is empty',
    'Импортировано групп: {n}': 'Imported groups: {n}',
    'Режим правки: клик — изменить, тащи — переставить': 'Edit mode: click to change, drag to reorder',
    'Правка завершена': 'Edit mode off',

    // ── weather ──
    'СИНХРОНИЗАЦИЯ…': 'SYNCING…',
    'НЕТ СИГНАЛА · проверь сеть': 'NO SIGNAL · check your connection',
    'ВЕТЕР': 'WIND', 'ВЛАЖН': 'HUMID', 'ДАВЛ': 'PRESS', 'ВОСХОД': 'SUNRISE', 'ЗАКАТ': 'SUNSET',
    '{v} м/с {d}': '{v} m/s {d}',
    '{n} мм': '{n} mmHg',
    'ощущается {t}': 'feels like {t}',
    '// 12H · ТЕМП / ОСАДКИ': '// 12H · TEMP / PRECIP',
    'ВС': 'SU', 'ПН': 'MO', 'ВТ': 'TU', 'СР': 'WE', 'ЧТ': 'TH', 'ПТ': 'FR', 'СБ': 'SA',
    '{desc} · осадки {pp}%': '{desc} · precipitation {pp}%',
    'Ясно': 'Clear', 'Преимущественно ясно': 'Mostly clear', 'Переменная облачность': 'Partly cloudy',
    'Пасмурно': 'Overcast', 'Туман': 'Fog', 'Изморозь и туман': 'Rime fog',
    'Лёгкая морось': 'Light drizzle', 'Морось': 'Drizzle', 'Сильная морось': 'Heavy drizzle',
    'Ледяная морось': 'Freezing drizzle', 'Сильная ледяная морось': 'Heavy freezing drizzle',
    'Небольшой дождь': 'Light rain', 'Дождь': 'Rain', 'Ливень': 'Heavy rain',
    'Ледяной дождь': 'Freezing rain', 'Сильный ледяной дождь': 'Heavy freezing rain',
    'Небольшой снег': 'Light snow', 'Снег': 'Snow', 'Сильный снегопад': 'Heavy snowfall',
    'Снежная крупа': 'Snow grains', 'Кратковременный дождь': 'Rain showers',
    'Ливневый дождь': 'Heavy showers', 'Сильный ливень': 'Violent showers', 'Снегопад': 'Snow showers',
    'Гроза': 'Thunderstorm', 'Гроза с градом': 'Thunderstorm with hail', 'Сильная гроза с градом': 'Severe thunderstorm with hail',
    'Москва': 'Moscow',

    // ── quests ──
    'новая задача… (! в начале — главная)': 'new task… (! at the start = main quest)',
    'очистить выполненные': 'clear completed',
    '// журнал пуст. свободен как ветер.': '// log empty. free as the wind.',
    'Выполнено': 'Done', 'Двойной клик — изменить': 'Double-click to edit',
    'Главный квест': 'Main quest', 'Удалить': 'Delete', 'Задача': 'Task',
    '{n} активн · {m} готово': '{n} active · {m} done',
    'ГЛАВНЫЙ КВЕСТ ВЫПОЛНЕН · +250 XP': 'MAIN QUEST COMPLETE · +250 XP',
    'Квест выполнен · +50 XP': 'Quest complete · +50 XP',
    'Настроить город в SYS://CONFIG': 'Set your city in SYS://CONFIG',
    'Закинуть свою пиксель-арт гифку в карточку': 'Drop your own pixel-art GIF onto the card',
    'Нажать ? и выучить хоткеи': 'Press ? and learn the shortcuts',

    // ── focus / notes ──
    'ФОКУС': 'FOCUS', 'ПЕРЕРЫВ': 'BREAK', 'ДЛИННЫЙ ПЕРЕРЫВ': 'LONG BREAK',
    'СТАРТ': 'START', 'ПАУЗА': 'PAUSE', 'ДАЛЬШЕ': 'RESUME',
    'Сбросить': 'Reset', 'Фокус / перерыв': 'Focus / break',
    '{n} сегодня': '{n} today',
    'Перерыв окончен. Назад в матрицу.': 'Break over. Back into the matrix.',
    'Сессия фокуса завершена. Отдохни.': 'Focus session done. Take a break.',
    '// черновик, сохраняется сам': '// scratchpad, saves itself',

    // ── help ──
    'фокус на поиск (или просто начни печатать)': 'focus the search box (or just start typing)',
    'на пустой строке — сменить поисковик': 'on an empty line — switch search engine',
    'выбрать подсказку · Ctrl+⏎ — в новой вкладке': 'pick a suggestion · Ctrl+⏎ opens in a new tab',
    '!y котики': '!y cats',
    'бэнг: поиск на YouTube (список в настройках)': 'bang: search YouTube (list in settings)',
    'сразу на сабреддит': 'straight to the subreddit',
    'калькулятор, ⏎ копирует результат': 'calculator, ⏎ copies the result',
    'открыть закладку по номеру': 'open a bookmark by number',
    'новая задача': 'new task',
    'режим правки закладок': 'bookmark edit mode',
    'следующая картинка': 'next image',
    'эта шпаргалка': 'this cheat sheet',
    'закрыть всё': 'close everything',

    // ── ticker tips ──
    'ВВЕДИ «!y» ПЕРЕД ЗАПРОСОМ — ПОИСК НА YOUTUBE': 'TYPE «!y» BEFORE A QUERY TO SEARCH YOUTUBE',
    '«2^10*3» В СТРОКЕ ПОИСКА = КАЛЬКУЛЯТОР': '«2^10*3» IN THE SEARCH BOX = CALCULATOR',
    'ПЕРЕТАЩИ GIF НА КАРТОЧКУ — ОНА СТАНЕТ ТВОЕЙ': 'DROP A GIF ON THE CARD AND IT BECOMES YOURS',
    'КЛАВИШИ 1–9 ОТКРЫВАЮТ ЗАКЛАДКИ': 'KEYS 1-9 OPEN YOUR BOOKMARKS',
    'TAB НА ПУСТОЙ СТРОКЕ — СМЕНИТЬ ПОИСКОВИК': 'TAB ON AN EMPTY LINE SWITCHES SEARCH ENGINE',
    'НЕБО ЖИВЁТ ПО НАСТОЯЩЕМУ СОЛНЦУ В ТВОЁМ ГОРОДЕ': 'THE SKY FOLLOWS THE REAL SUN IN YOUR CITY',
    'ЗАДАЧА С «!» В НАЧАЛЕ — ГЛАВНЫЙ КВЕСТ': 'A TASK STARTING WITH «!» IS A MAIN QUEST',
    '◉ {place} {temp} · {desc} · ЗАВТРА {tomorrow}': '◉ {place} {temp} · {desc} · TOMORROW {tomorrow}',
    '◆ КВЕСТОВ АКТИВНО: {n}': '◆ ACTIVE QUESTS: {n}',
    '▲ {theme} MODE': '▲ {theme} MODE',

    // ── settings ──
    'ЯЗЫК': 'LANGUAGE',
    'Язык интерфейса': 'Interface language',
    'ПРОФИЛЬ': 'PROFILE',
    'Имя': 'Name', 'как к тебе обращаться': 'what should we call you',
    'Заголовок карточки': 'Card title',
    'ТЕМА': 'THEME',
    'Сканлайны CRT': 'CRT scanlines', 'Шум плёнки': 'Film grain', 'Глитч-эффекты': 'Glitch effects',
    'Стекло (blur)': 'Glass (blur)', 'выключи, если тормозит': 'turn off if it feels slow',
    'Загрузочный экран': 'Boot screen', 'Звуки интерфейса': 'Interface sounds',
    'СЦЕНА': 'SCENE',
    'Анимация': 'Animation', 'Качество': 'Quality',
    'Низкое': 'Low', 'Среднее': 'Medium', 'Высокое': 'High',
    'Лимит FPS': 'FPS cap', 'Параллакс от мыши': 'Mouse parallax', 'Летающий трафик': 'Flying traffic',
    'Время суток': 'Time of day',
    'АВТО': 'AUTO', 'РАССВЕТ': 'DAWN', 'ДЕНЬ': 'DAY', 'СУМЕРКИ': 'DUSK', 'НОЧЬ': 'NIGHT',
    'Погода в сцене': 'Weather in the scene',
    'ЯСНО': 'CLEAR', 'ОБЛАКА': 'CLOUDS', 'ДОЖДЬ': 'RAIN', 'ГРОЗА': 'STORM', 'СНЕГ': 'SNOW', 'ТУМАН': 'FOG',
    'Город': 'City', 'НОВЫЙ НА КАЖДОЙ ВКЛАДКЕ': 'NEW ON EVERY TAB', 'ВСЕГДА ОДИН': 'ALWAYS THE SAME',
    'Текущий город': 'Current city',
    'Другой город в этой вкладке': 'Another city in this tab', '↻ ДРУГОЙ': '↻ ANOTHER',
    'Показывать этот город на всех вкладках': 'Show this city on every tab', '📌 ЗАКРЕПИТЬ': '📌 PIN',
    'Город #{n} закреплён': 'City #{n} pinned',
    'ПОГОДА': 'WEATHER',
    'Сейчас': 'Now', 'найти город…': 'find a city…',
    'ничего не найдено': 'nothing found', 'нет сети': 'no connection',
    'Моё место': 'My location', 'Геолокация недоступна': 'Geolocation is unavailable',
    '⌖ ГЕОЛОКАЦИЯ': '⌖ GEOLOCATION', '↻ ОБНОВИТЬ': '↻ REFRESH',
    'Локация: {place}': 'Location: {place}', 'Погода обновляется…': 'Refreshing weather…',
    'ПОИСК': 'SEARCH',
    'Поисковик': 'Search engine', 'Открывать в новой вкладке': 'Open in a new tab',
    'Бэнги': 'Bangs',
    'ключ | название | адрес с %s — пиши «!y котики» или «котики !y»': 'key | name | URL with %s — type «!y cats» or «cats !y»',
    'вернуть стандартные бэнги': 'restore the default bangs',
    'КАРТИНКИ': 'IMAGES',
    'Режим': 'Mode', 'Случайная на каждой вкладке': 'Random on every tab',
    'Всегда первая': 'Always the first one', 'Только пиксельная сцена': 'Pixel scene only',
    'Пока пусто — показывается пиксельная сцена.': 'Empty for now — the pixel scene is shown.',
    '+ ФАЙЛЫ': '+ FILES',
    'Можно просто перетащить картинку или GIF на карточку. Клик по картинке — следующая.': 'You can just drop an image or GIF onto the card. Click the image for the next one.',
    'ЗАКЛАДКИ': 'BOOKMARKS',
    '⇩ ИЗ ПАНЕЛИ FIREFOX': '⇩ FROM FIREFOX TOOLBAR', 'СБРОС': 'RESET',
    'Сбросить закладки к стандартным?': 'Reset bookmarks to the defaults?',
    'Импорт берёт папки с панели закладок: каждая папка станет группой. Редактирование — клавиша E.': 'Import takes the folders from your bookmarks toolbar: each folder becomes a group. Press E to edit.',
    'ДАННЫЕ': 'DATA',
    '⇧ ЭКСПОРТ': '⇧ EXPORT', '⇩ ИМПОРТ': '⇩ IMPORT', 'СБРОС ВСЕГО': 'RESET EVERYTHING',
    'Стереть все настройки, задачи и закладки?': 'Erase all settings, tasks and bookmarks?',
    'Не удалось прочитать файл': 'Could not read the file',
    'Хранилище переполнено': 'Storage is full',
    'СВОЙ CSS': 'CUSTOM CSS',
    'NEON//DECK v1.0 · © Frnllk · GPL-3.0 · погода: Open-Meteo.com (CC BY 4.0) · иконки сайтов: DuckDuckGo · шрифты: SIL OFL 1.1':
      'NEON//DECK v1.0 · © Frnllk · GPL-3.0 · weather: Open-Meteo.com (CC BY 4.0) · site icons: DuckDuckGo · fonts: SIL OFL 1.1',

    // ── default bangs and bookmarks ──
    'Яндекс': 'Yandex', 'Википедия': 'Wikipedia', 'Переводчик': 'Translate',
    'Картинки': 'Images', 'Карты': 'Maps',
  };

  // Neon signs on the buildings follow the interface language.
  NX.SIGNS = {
    ru: ['БАР', '24/7', 'ОТЕЛЬ', 'NEON', 'КИНО', 'OPEN', 'ЛАПША', 'CLUB', 'DECK', 'СУШИ', 'ТАКСИ', 'ХОСТЕЛ', 'RAMEN', 'VHS'],
    en: ['BAR', '24/7', 'HOTEL', 'NEON', 'CINEMA', 'OPEN', 'NOODLE', 'CLUB', 'DECK', 'SUSHI', 'TAXI', 'HOSTEL', 'RAMEN', 'VHS'],
  };

  let lang = 'en';

  function resolve(setting) {
    if (setting === 'ru' || setting === 'en') return setting;
    return (navigator.language || 'en').toLowerCase().startsWith('ru') ? 'ru' : 'en';
  }

  function t(s, vars) {
    let out = lang === 'en' ? EN[s] || s : s;
    if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(v);
    return out;
  }

  // Translate the static markup once, so newtab.html needs no markup changes.
  function translateDom(root = document) {
    if (lang === 'ru') return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
    for (const n of nodes) {
      const raw = n.nodeValue, trimmed = raw.trim();
      if (!trimmed || !EN[trimmed]) continue;
      n.nodeValue = raw.replace(trimmed, EN[trimmed]);
    }
    for (const el of root.querySelectorAll('[title],[placeholder],[aria-label]')) {
      for (const a of ['title', 'placeholder', 'aria-label']) {
        const v = el.getAttribute(a);
        if (v && EN[v]) el.setAttribute(a, EN[v]);
      }
    }
  }

  NX.I18n = {
    setLang(setting) {
      lang = resolve(setting);
      document.documentElement.lang = lang;
      return lang;
    },
    get lang() { return lang; },
  };
  NX.t = t;
  NX.translateDom = translateDom;
})(window.NX);
