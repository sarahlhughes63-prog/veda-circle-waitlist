/* Shared by every page: "make it yours", the same choices as the app.
   Colour theme, text size, reading font, higher contrast, larger tap targets,
   and under "More ways to read": line and letter spacing, underlined links, a reading guide,
   a pause for movement, and Listen (the device's own voice).
   Choices change the whole page and are remembered on this device only. */
(function () {
  var KEY = 'veda-prefs';
  var CREAM = '#F9F7F2';
  var PARCHMENT = '#EFE9DE';

  // The app's 17 colour themes (lib/theme.ts), same names, same colours.
  var THEMES = [
    { key: 'sage', label: 'Sage', sub: 'The original', dark: '#6E8074', mid: '#809284', light: '#A8B5AA' },
    { key: 'dustyrose', label: 'Dusty rose', sub: 'Warmer', dark: '#98696A', mid: '#B98585', light: '#D2A7A7' },
    { key: 'clay', label: 'Clay', sub: 'Earthier', dark: '#8C6248', mid: '#B07F62', light: '#C9A489' },
    { key: 'slateblue', label: 'Slate blue', sub: 'Cooler', dark: '#5F6E7E', mid: '#7C8B9B', light: '#A3B0BC' },
    { key: 'plum', label: 'Plum', sub: 'Deeper', dark: '#6C5773', mid: '#8A7292', light: '#B0A0B8' },
    { key: 'ochre', label: 'Ochre', sub: 'Golden', dark: '#96773F', mid: '#AC8842', light: '#D3BC8A' },
    { key: 'mutedteal', label: 'Muted teal', sub: 'Calm', dark: '#547773', mid: '#6E9A96', light: '#9DBFBC' },
    { key: 'quietneutral', label: 'Quiet neutral', sub: 'Understated', dark: '#6F6B64', mid: '#8F8A82', light: '#B3AEA6' },
    { key: 'moss', label: 'Moss', sub: 'Deep green', dark: '#485E44', mid: '#5F7A5A', light: '#8AA184' },
    { key: 'terracotta', label: 'Terracotta', sub: 'Warm red', dark: '#95543D', mid: '#BC6E52', light: '#D19A85' },
    { key: 'lavender', label: 'Lavender', sub: 'Soft purple', dark: '#786CA0', mid: '#9385BF', light: '#BEB4DA' },
    { key: 'mustard', label: 'Mustard', sub: 'Bold yellow', dark: '#9E7E1D', mid: '#AB8921', light: '#DDC066' },
    { key: 'navy', label: 'Navy', sub: 'Deep blue', dark: '#38475C', mid: '#4C5F78', light: '#7A8CA3' },
    { key: 'berry', label: 'Berry', sub: 'Rich pink', dark: '#803D5D', mid: '#A5527A', light: '#C689A3' },
    { key: 'seaglass', label: 'Sea glass', sub: 'Soft aqua', dark: '#4E7A72', mid: '#6B9C92', light: '#9EC0B7' },
    { key: 'apricot', label: 'Apricot', sub: 'Peachy warm', dark: '#B06B45', mid: '#CB7943', light: '#E5B593' },
    { key: 'periwinkle', label: 'Periwinkle', sub: 'Blue-violet', dark: '#5C5FA0', mid: '#7E80C4', light: '#ABABDD' }
  ];
  var SIZES = [
    { label: 'A', scale: 1, name: 'Standard' },
    { label: 'A+', scale: 1.15, name: 'Larger' },
    { label: 'A++', scale: 1.3, name: 'Large' },
    { label: 'A+++', scale: 1.5, name: 'Largest' }
  ];
  var FONTS = [
    { id: 'default', label: 'Standard', sub: 'Cormorant and Inter' },
    { id: 'lexend', label: 'Lexend', sub: 'Easier on tired eyes' },
    { id: 'atkinson', label: 'Atkinson Hyperlegible', sub: 'Clear, distinct letters' },
    { id: 'opendyslexic', label: 'OpenDyslexic', sub: 'Weighted letter shapes' }
  ];
  var SPACINGS = [
    { id: '0', label: 'Normal' },
    { id: '1', label: 'Roomy' },
    { id: '2', label: 'Extra roomy' }
  ];
  var RATES = [
    { id: '0', label: 'Slower', rate: 0.85 },
    { id: '1', label: 'Normal', rate: 1 },
    { id: '2', label: 'Faster', rate: 1.2 }
  ];
  var DEFAULTS = { theme: 'sage', size: 0, font: 'default', contrast: false, targets: false,
    spacing: 0, letters: false, links: false, guide: false, motion: false, rate: 1 };
  var OS_REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- colour helpers ---------- */
  function rgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function hex(a) { return '#' + a.map(function (v) { return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'); }).join(''); }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex(x.map(function (v, i) { return v + (y[i] - v) * t; })); }
  function lum(h) {
    var c = rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function ratio(a, b) { var x = lum(a), y = lum(b); if (x < y) { var t = x; x = y; y = t; } return (x + 0.05) / (y + 0.05); }
  // Darken a theme colour by the smallest amount that makes it readable as small text and as a button fill with white text
  function readable(dark, bg) {
    var c = dark, t = 0;
    while ((ratio(c, '#FFFFFF') < 4.5 || ratio(c, bg) < 4.5) && t < 1) { t += 0.02; c = mix(dark, '#1A1A1A', t); }
    return c;
  }

  /* ---------- saved choices ---------- */
  function load() {
    var p = {};
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) p = JSON.parse(raw) || {};
      else { var old = localStorage.getItem('veda-font'); if (old) p.font = old; }
    } catch (e) { p = {}; }
    return Object.assign({}, DEFAULTS, p);
  }
  var state = load();
  var listeners = [];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private window: lasts for this visit */ } }

  function apply() {
    var root = document.documentElement;
    var pal = THEMES.filter(function (t) { return t.key === state.theme; })[0] || THEMES[0];
    var bg = pal.key === 'sage' ? CREAM : mix(CREAM, pal.light, 0.14);
    var s = root.style;
    s.setProperty('--cream', bg);
    s.setProperty('--cream-deep', pal.key === 'sage' ? PARCHMENT : mix(PARCHMENT, pal.light, 0.14));
    s.setProperty('--sage-deep', readable(pal.dark, bg));
    // Text-sized sage (links, small labels): readable even on the tinted panels, in every colour
    var tint = mix(bg, pal.mid, 0.13), deepBg = pal.key === 'sage' ? PARCHMENT : mix(PARCHMENT, pal.light, 0.14), paleBg = mix(bg, pal.light, 0.38);
    var sageText = pal.dark, tt = 0;
    while ([bg, tint, deepBg, paleBg].some(function (b) { return ratio(sageText, b) < 4.5; }) && tt < 1) { tt += 0.02; sageText = mix(pal.dark, '#1A1A1A', tt); }
    if (state.contrast) s.removeProperty('--sage-text'); else s.setProperty('--sage-text', sageText);
    s.setProperty('--sage', pal.mid);
    s.setProperty('--sage-mid', pal.mid);
    s.setProperty('--accent-light', pal.light);
    var pale = mix(bg, pal.light, 0.38);
    s.setProperty('--sage-pale', pale);
    // Secondary text stays readable on every colour's tinted panels (at least 4.5 to 1)
    var soft = '#5A5A5A', st = 0;
    while (ratio(soft, pale) < 4.5 && st < 1) { st += 0.05; soft = mix('#5A5A5A', '#1A1A1A', st); }
    if (state.contrast) s.removeProperty('--ink-soft'); else s.setProperty('--ink-soft', soft);
    s.fontSize = (SIZES[state.size] || SIZES[0]).scale * 100 + '%';
    state.font !== 'default' ? root.setAttribute('data-font', state.font) : root.removeAttribute('data-font');
    state.contrast ? root.setAttribute('data-contrast', 'high') : root.removeAttribute('data-contrast');
    state.targets ? root.setAttribute('data-targets', 'large') : root.removeAttribute('data-targets');
    state.spacing ? root.setAttribute('data-spacing', String(state.spacing)) : root.removeAttribute('data-spacing');
    state.letters ? root.setAttribute('data-letters', 'wide') : root.removeAttribute('data-letters');
    state.links ? root.setAttribute('data-links', 'underline') : root.removeAttribute('data-links');
    (state.motion || OS_REDUCE) ? root.setAttribute('data-motion', 'reduce') : root.removeAttribute('data-motion');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', bg);
    if (document.body) { setGuide(state.guide); syncMotion(); }
  }
  function set(partial) {
    Object.assign(state, partial);
    save(); apply();
    listeners.forEach(function (fn) { fn(state); });
  }
  /* ---------- reading guide: a soft band that follows your pointer, finger or keyboard focus ---------- */
  var guideEl = null;
  function moveGuide(y) { if (guideEl) guideEl.style.top = Math.max(0, y - guideEl.offsetHeight / 2) + 'px'; }
  function setGuide(on) {
    if (on && !guideEl) {
      guideEl = document.createElement('div');
      guideEl.className = 'reading-guide'; guideEl.setAttribute('aria-hidden', 'true');
      document.body.appendChild(guideEl);
      moveGuide(window.innerHeight / 3);
    } else if (!on && guideEl) { guideEl.remove(); guideEl = null; }
  }
  document.addEventListener('pointermove', function (e) { if (guideEl && e.pointerType !== 'touch') moveGuide(e.clientY); }, { passive: true });
  ['touchstart', 'touchmove'].forEach(function (t) {
    document.addEventListener(t, function (e) { if (guideEl && e.touches && e.touches[0]) moveGuide(e.touches[0].clientY); }, { passive: true });
  });
  document.addEventListener('focusin', function (e) {
    if (guideEl && e.target && e.target.getBoundingClientRect) { var r = e.target.getBoundingClientRect(); moveGuide(r.top + r.height / 2); }
  });

  /* ---------- pause for movement: stops looping videos; a person can still press Watch or Play ---------- */
  var heroPaused = false;
  function syncMotion() {
    var reduce = state.motion || OS_REDUCE;
    document.querySelectorAll('video[autoplay]').forEach(function (v) {
      if (reduce || heroPaused) { v.pause(); } else { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
    });
    if (reduce) document.querySelectorAll('video:not([autoplay])').forEach(function (v) { v.pause(); });
    document.querySelectorAll('.video-toggle').forEach(function (b) { videoToggleLabel(b); });
  }
  function videoToggleLabel(b) {
    var v = b._video; if (!v) return;
    var paused = v.paused;
    b.textContent = paused ? 'Play video' : 'Pause video';
    b.setAttribute('aria-pressed', paused ? 'true' : 'false');
  }

  /* ---------- Listen: the device's own voice reads the page (nothing is sent anywhere) ---------- */
  var speech = ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) ? window.speechSynthesis : null;
  var listening = null, listenUIs = [];
  function pickVoice() {
    if (!speech) return null;
    var vs = speech.getVoices() || [];
    var base = ((document.documentElement.lang || 'en').toLowerCase()).slice(0, 2);
    // Only voices that run on the device itself, so the words never leave it
    var local = vs.filter(function (v) { return v.localService && v.lang && v.lang.toLowerCase().indexOf(base) === 0; });
    if (!local.length) return null;
    var gb = local.filter(function (v) { return /en[-_]gb/i.test(v.lang); });
    return gb[0] || local[0];
  }
  function pageBlocks() {
    var roots = [document.querySelector('header.hero, header.page-header'), document.querySelector('main')].filter(Boolean);
    var skip = '[hidden],[aria-hidden="true"],.prefs,.font-panel,.mine-stage,.try-panel,nav,footer,form,script,style,.video-toggle';
    var out = [];
    roots.forEach(function (r) {
      r.querySelectorAll('h1,h2,h3,p,li,dt,dd,blockquote,figcaption').forEach(function (n) {
        if (n.closest(skip)) return;
        var t = (n.textContent || '').replace(/\(opens in a new tab\)/g, '').replace(/\s+/g, ' ').trim();
        if (t.length < 2) return;
        if (out.some(function (o) { return o.node.contains(n) || n.contains(o.node); })) return;
        out.push({ node: n, text: t });
      });
    });
    return out;
  }
  function chunk(text) {
    var parts = text.match(/[^.!?]+[.!?]*\s*/g) || [text], out = [], cur = '';
    parts.forEach(function (p) { if ((cur + p).length > 220 && cur) { out.push(cur); cur = p; } else cur += p; });
    if (cur) out.push(cur);
    return out;
  }
  var marked = null;
  function mark(node) {
    if (marked) marked.classList.remove('veda-listening');
    marked = node; node.classList.add('veda-listening');
    var r = node.getBoundingClientRect();
    if (r.top < 80 || r.bottom > window.innerHeight - 40) node.scrollIntoView({ block: 'center', behavior: (state.motion || OS_REDUCE) ? 'auto' : 'smooth' });
  }
  function listenUI() { listenUIs.forEach(function (fn) { fn(); }); }
  function stopListening() {
    if (listening) listening.cancelled = true;
    if (speech) speech.cancel();
    if (marked) { marked.classList.remove('veda-listening'); marked = null; }
    listening = null; listenUI();
  }
  function startListening() {
    stopListening();
    var v = pickVoice(); if (!v) return;
    var pieces = [];
    pageBlocks().forEach(function (b) { chunk(b.text).forEach(function (c) { pieces.push({ node: b.node, text: c }); }); });
    if (!pieces.length) return;
    var token = { cancelled: false, paused: false }; listening = token;
    var i = 0;
    (function next() {
      if (token.cancelled) return;
      if (i >= pieces.length) { stopListening(); return; }
      var p = pieces[i++];
      mark(p.node);
      var u = new SpeechSynthesisUtterance(p.text);
      u.voice = v; u.lang = v.lang;
      u.rate = (RATES.filter(function (r) { return r.id === String(state.rate); })[0] || RATES[1]).rate;
      u.onend = next;
      u.onerror = function (e) { if (e.error === 'interrupted' || e.error === 'canceled') return; stopListening(); };
      speech.speak(u);
    })();
    listenUI();
  }
  function togglePause() {
    if (!listening || !speech) return;
    if (listening.paused) { speech.resume(); listening.paused = false; } else { speech.pause(); listening.paused = true; }
    listenUI();
  }
  window.addEventListener('pagehide', function () { if (speech) speech.cancel(); });

apply(); // before the page paints, so there is no flash of the standard look

  /* ---------- controls (used in the header menu and in the "make it your own" section) ---------- */
  var uid = 0;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }

  function radioGroup(title, name, items, current, onPick, build) {
    var g = el('fieldset', 'prefs-group');
    var legend = el('legend', 'label-caps', title); g.appendChild(legend);
    var row = el('div', 'prefs-row');
    items.forEach(function (it) {
      var label = el('label', 'prefs-opt');
      var input = document.createElement('input');
      input.type = 'radio'; input.name = name; input.value = it.id;
      input.checked = it.id === current;
      input.addEventListener('change', function () { onPick(it.id); });
      label.appendChild(input);
      label.appendChild(build(it));
      row.appendChild(label);
    });
    g.appendChild(row);
    return g;
  }

  function switchRow(title, sub, id, checked, onChange) {
    var label = el('label', 'prefs-switch');
    var input = document.createElement('input');
    input.type = 'checkbox'; input.setAttribute('role', 'switch'); input.checked = checked; input.id = id;
    input.addEventListener('change', function () { onChange(input.checked); });
    var copy = el('span', 'prefs-switch-copy');
    copy.appendChild(el('span', 'prefs-switch-title', title));
    copy.appendChild(el('span', 'prefs-switch-sub', sub));
    var track = el('span', 'prefs-track'); track.setAttribute('aria-hidden', 'true');
    label.appendChild(copy); label.appendChild(track); label.insertBefore(input, copy);
    return label;
  }

  function mount(container, opts) {
    opts = opts || {};
    var n = ++uid;
    var wrap = el('div', 'prefs' + (opts.compact ? ' prefs-compact' : ''));

    // Colour
    var colour = radioGroup('Colour', 'veda-theme-' + n,
      THEMES.map(function (t) { return { id: t.key, t: t }; }), state.theme,
      function (id) { set({ theme: id }); },
      function (it) {
        var sw = el('span', 'swatch'); sw.style.setProperty('--sw', it.t.mid); sw.style.setProperty('--sw2', it.t.light);
        sw.setAttribute('role', 'img'); sw.setAttribute('aria-label', it.t.label + ', ' + it.t.sub.toLowerCase());
        sw.title = it.t.label;
        return sw;
      });
    colour.querySelector('.prefs-row').classList.add('prefs-swatches');
    var colourName = el('p', 'prefs-note');
    colour.appendChild(colourName);
    wrap.appendChild(colour);

    // Text size
    wrap.appendChild(radioGroup('Text size', 'veda-size-' + n,
      SIZES.map(function (s, i) { return { id: String(i), s: s }; }), String(state.size),
      function (id) { set({ size: Number(id) }); },
      function (it) {
        var b = el('span', 'size-btn', it.s.label);
        b.style.fontSize = (0.8 + Number(it.id) * 0.12) + 'rem';
        b.setAttribute('aria-label', it.s.name + ' text');
        return b;
      }));

    // Font
    wrap.appendChild(radioGroup('Reading font', 'veda-font-' + n,
      FONTS, state.font,
      function (id) { set({ font: id }); },
      function (it) {
        var s = el('span', 'font-chip font-chip-' + it.id);
        s.appendChild(el('span', 'font-chip-name', it.label));
        s.appendChild(el('span', 'font-chip-sub', it.sub));
        return s;
      }));

    // Switches
    var sw = el('div', 'prefs-switches');
    sw.appendChild(switchRow('Higher contrast', 'Darker text and stronger borders.', 'veda-contrast-' + n, state.contrast, function (v) { set({ contrast: v }); }));
    sw.appendChild(switchRow('Larger tap targets', 'Bigger buttons and links.', 'veda-targets-' + n, state.targets, function (v) { set({ targets: v }); }));
    wrap.appendChild(sw);

    // More ways to read
    var more = el('details', 'prefs-more');
    if (!opts.compact) more.open = true;
    more.appendChild(el('summary', 'prefs-more-sum', 'More ways to read'));
    var body = el('div', 'prefs-more-body');
    function chipBuild(it) { return el('span', 'opt-chip', it.label); }
    body.appendChild(radioGroup('Line spacing', 'veda-spacing-' + n, SPACINGS, String(state.spacing), function (id) { set({ spacing: Number(id) }); }, chipBuild));
    body.appendChild(radioGroup('Letter spacing', 'veda-letters-' + n,
      [{ id: '0', label: 'Normal' }, { id: '1', label: 'Wide' }], state.letters ? '1' : '0',
      function (id) { set({ letters: id === '1' }); }, chipBuild));
    var sw2 = el('div', 'prefs-switches');
    sw2.appendChild(switchRow('Underline links', 'Every link gets a line, so it is easy to spot.', 'veda-links-' + n, state.links, function (v) { set({ links: v }); }));
    sw2.appendChild(switchRow('Reading guide', 'A soft band follows you down the page and dims the rest.', 'veda-guide-' + n, state.guide, function (v) { set({ guide: v }); }));
    sw2.appendChild(switchRow('Pause movement', 'Stops fades and looping videos.' + (OS_REDUCE ? ' Your device already asks for this.' : ''), 'veda-motion-' + n, state.motion || OS_REDUCE, function (v) { set({ motion: v }); }));
    body.appendChild(sw2);

    var listenBox = el('div', 'prefs-listen'); listenBox.hidden = true;
    listenBox.appendChild(el('p', 'label-caps', 'Listen'));
    listenBox.appendChild(el('p', 'prefs-switch-sub', 'Reads this page out loud in your device’s own voice. Nothing is sent anywhere.'));
    var lrow = el('div', 'prefs-row prefs-listen-row');
    var lbtn = el('button', 'btn-pill solid prefs-listen-btn', 'Listen to this page'); lbtn.type = 'button';
    var pbtn = el('button', 'btn-pill prefs-listen-pause', 'Pause'); pbtn.type = 'button';
    lbtn.addEventListener('click', function () { listening ? stopListening() : startListening(); });
    pbtn.addEventListener('click', togglePause);
    lrow.appendChild(lbtn); lrow.appendChild(pbtn);
    listenBox.appendChild(lrow);
    listenBox.appendChild(radioGroup('Speed', 'veda-rate-' + n, RATES, String(state.rate), function (id) { set({ rate: Number(id) }); }, chipBuild));
    var lstatus = el('p', 'sr-only'); lstatus.setAttribute('role', 'status'); lstatus.setAttribute('aria-live', 'polite');
    listenBox.appendChild(lstatus);
    body.appendChild(listenBox);
    more.appendChild(body);
    wrap.appendChild(more);

    function listenRefresh() {
      listenBox.hidden = !pickVoice();
      lbtn.textContent = listening ? 'Stop listening' : 'Listen to this page';
      pbtn.hidden = !listening;
      pbtn.textContent = listening && listening.paused ? 'Resume' : 'Pause';
      lstatus.textContent = listening ? (listening.paused ? 'Paused.' : 'Listening.') : '';
    }
    listenUIs.push(listenRefresh);
    if (speech && speech.addEventListener) speech.addEventListener('voiceschanged', listenRefresh);

    var reset = el('button', 'prefs-reset', 'Back to the original');
    reset.type = 'button';
    reset.addEventListener('click', function () { stopListening(); set(Object.assign({}, DEFAULTS)); });
    wrap.appendChild(reset);

    function refresh() {
      var pal = THEMES.filter(function (t) { return t.key === state.theme; })[0] || THEMES[0];
      colourName.textContent = pal.label + ', ' + pal.sub.toLowerCase();
      wrap.querySelectorAll('input[type=radio]').forEach(function (i) {
        var nm = i.name, v = i.value;
        if (nm.indexOf('veda-theme-') === 0) i.checked = v === state.theme;
        else if (nm.indexOf('veda-size-') === 0) i.checked = v === String(state.size);
        else if (nm.indexOf('veda-font-') === 0) i.checked = v === state.font;
      });
      wrap.querySelectorAll('input[type=radio]').forEach(function (i) {
        var nm = i.name, v = i.value;
        if (nm.indexOf('veda-spacing-') === 0) i.checked = v === String(state.spacing);
        else if (nm.indexOf('veda-letters-') === 0) i.checked = v === (state.letters ? '1' : '0');
        else if (nm.indexOf('veda-rate-') === 0) i.checked = v === String(state.rate);
      });
      wrap.querySelector('#veda-contrast-' + n).checked = state.contrast;
      wrap.querySelector('#veda-targets-' + n).checked = state.targets;
      wrap.querySelector('#veda-links-' + n).checked = state.links;
      wrap.querySelector('#veda-guide-' + n).checked = state.guide;
      wrap.querySelector('#veda-motion-' + n).checked = state.motion || OS_REDUCE;
      listenRefresh();
    }
    listeners.push(refresh);
    refresh();
    container.appendChild(wrap);
    return wrap;
  }

  window.VedaPrefs = { mount: mount, set: set, get: function () { return Object.assign({}, state); } };

  /* ---------- header menu ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var list = document.querySelector('nav .nav-links');
    if (list) {
      var li = el('li', 'font-menu');
      var btn = el('button', 'font-btn', 'Aa');
      btn.type = 'button';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', 'prefs-panel');
      btn.setAttribute('aria-label', 'Make it yours: colour, text size, font and reading help');
      var panel = el('div', 'font-panel');
      panel.id = 'prefs-panel'; panel.hidden = true; panel.setAttribute('role', 'group'); panel.setAttribute('aria-label', 'Make it yours');
      var head = el('div', 'font-head');
      head.appendChild(el('p', 'label-caps font-title', 'Make it yours'));
      var closeBtn = el('button', 'font-close', 'Close'); closeBtn.type = 'button';
      head.appendChild(closeBtn);
      panel.appendChild(head);
      mount(panel, { compact: true });
      var close = function () { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
      closeBtn.addEventListener('click', function () { close(); btn.focus(); });
      btn.addEventListener('click', function (e) {
        e.stopPropagation(); var open = panel.hidden; panel.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) { var first = panel.querySelector('input:checked') || panel.querySelector('input'); if (first) first.focus(); }
      });
      document.addEventListener('click', function (e) { if (!li.contains(e.target)) close(); });
      li.addEventListener('focusout', function (e) { if (e.relatedTarget && !li.contains(e.relatedTarget)) close(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); btn.focus(); } });
      li.appendChild(btn); li.appendChild(panel);
      list.appendChild(li);
    }
    // Skip link for keyboard and screen reader users
    var target = document.querySelector('main') || document.querySelector('header.hero, header.page-header');
    if (target) {
      if (!target.id) target.id = 'main-content';
      target.setAttribute('tabindex', '-1');
      var skip = document.createElement('a');
      skip.className = 'skip-link';
      skip.href = '#' + target.id;
      skip.textContent = 'Skip to main content';
      document.body.insertBefore(skip, document.body.firstChild);
    }
    document.querySelectorAll('[data-prefs-mount]').forEach(function (c) { mount(c, {}); });

    // Links that open a new tab say so, for screen readers
    document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
      var label = a.getAttribute('aria-label');
      if (label) { if (!/new tab/i.test(label)) a.setAttribute('aria-label', label + ', opens in a new tab'); }
      else { var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = ' (opens in a new tab)'; a.appendChild(sr); }
    });

    // The looping video at the top gets a pause button
    var hero = document.querySelector('video[autoplay]');
    if (hero && hero.parentNode) {
      var tb = el('button', 'video-toggle'); tb.type = 'button'; tb._video = hero;
      tb.addEventListener('click', function () {
        if (hero.paused) { heroPaused = false; var pr = hero.play(); if (pr && pr.catch) pr.catch(function () {}); } else { heroPaused = true; hero.pause(); }
        videoToggleLabel(tb);
      });
      hero.addEventListener('play', function () { videoToggleLabel(tb); });
      hero.addEventListener('pause', function () { videoToggleLabel(tb); });
      hero.parentNode.appendChild(tb); videoToggleLabel(tb);
    }
    syncMotion();

    // Sideways-scrolling areas can be reached and scrolled with the keyboard
    var names = { 'panels': 'Pictures from the app, scroll sideways', 'screen-track': 'App screens, scroll sideways', 'logo-links': 'Logo downloads', 'shots': 'App screenshots, scroll sideways' };
    function scrollers() {
      document.querySelectorAll('.panels, .screen-track, .shots, .logo-links').forEach(function (n) {
        var over = n.scrollWidth > n.clientWidth + 2;
        if (over) {
          n.setAttribute('tabindex', '0'); n.setAttribute('role', 'region'); n.setAttribute('data-auto-scroll', '1');
          var k = Object.keys(names).filter(function (c) { return n.classList.contains(c); })[0];
          if (!n.getAttribute('aria-label')) n.setAttribute('aria-label', names[k] || 'Scrollable area');
        } else if (n.getAttribute('data-auto-scroll')) { n.removeAttribute('tabindex'); n.removeAttribute('role'); n.removeAttribute('aria-label'); n.removeAttribute('data-auto-scroll'); }
      });
    }
    scrollers(); window.addEventListener('resize', scrollers); window.addEventListener('load', scrollers);
  });
})();

/* A new page always opens at its top (unless the link points at a section, or the visitor pressed Back). */
(function () {
  if (location.hash) return;
  var nav = window.performance && performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
  if (nav && nav.type === 'back_forward') return;
  var touched = false;
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (t) { window.addEventListener(t, function () { touched = true; }, { passive: true, once: true }); });
  function top() {
    if (touched) return;
    var d = document.documentElement, prev = d.style.scrollBehavior;
    d.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    d.style.scrollBehavior = prev;
  }
  top();
  document.addEventListener('DOMContentLoaded', top);
  window.addEventListener('load', top);
})();
