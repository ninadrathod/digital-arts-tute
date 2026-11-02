/* ==========================================================================
   Digital Arts Masterclass — script.js
   --------------------------------------------------------------------------
   Architecture (all plain JS, no build step):
     1. CURRICULUM  – the master list of modules (shown in the sidebar even
                      before their content exists → "Coming soon").
     3. Store       – tiny localStorage wrapper for lesson progress.
     4. Nav         – builds sidebar + mobile drawer from CURRICULUM + the DOM.
     5. Progress    – "mark complete" buttons, colour-puck ring, reading bar.
     6. ScrollSpy   – highlights the lesson currently on screen.
     8. WIDGETS     – interactive diagrams mounted into [data-widget] elements.
   To add a module: add its <section> to index.html (it is already listed in CURRICULUM).
   ========================================================================== */

(() => {
  'use strict';

  /* ------------------------------------------------------------------------
     1. CURRICULUM
     ------------------------------------------------------------------------ */
  const CURRICULUM = [
    { id: 'm0', num: '00', title: 'Prerequisites & Studio Setup',            blurb: 'Hardware, install, interface, gestures, canvas maths, colour profiles.' },
    { id: 'm1', num: '01', title: 'The Procreate Engine: Brushes & Layers',  blurb: 'Brush anatomy, pressure, StreamLine, layers, masks, blend modes, selections, adjustments.' },
    { id: 'm2', num: '02', title: 'Drawing Fundamentals for the Screen',     blurb: 'Line confidence, shape → form, perspective guides, light & shadow, anatomy shortcuts.' },
    { id: 'm3', num: '03', title: 'Colour Theory & Colour Combination Types', blurb: 'Hue/value/chroma, the colour wheel, harmonies, palettes, temperature, gradient maps.' },
    { id: 'm4', num: '04', title: 'Illustration Workflows',                   blurb: 'Thumbnail → sketch → line art → flats → render. Flat, cel, painterly, textured styles.' },
    { id: 'm5', num: '05', title: 'Design Principles & Design Types',         blurb: 'Gestalt, hierarchy, grids, balance; editorial, branding, packaging, social, UI illustration.' },
    { id: 'm6', num: '06', title: 'Typography Fundamentals',                  blurb: 'Anatomy of type, classification, pairing, kerning, leading, the Text tool in Procreate.' },
    { id: 'm7', num: '07', title: 'Text Art, Hand Lettering & Calligraphy',   blurb: 'Monoline & brush lettering, letterform construction, dimensional and illustrated type.' },
    { id: 'm8', num: '08', title: 'Poster Design Masterclass',                blurb: 'Concept, composition, type-image integration, print sizes, bleed, CMYK proofing.' },
    { id: 'm9', num: '09', title: 'Advanced Procreate: Brush Studio & Animation', blurb: 'Building custom brushes, Animation Assist, 3D painting, automation habits.' },
    { id: 'm10', num: '10', title: 'Export, Print & Portfolio',               blurb: 'File formats, print shops, mockups, time-lapse, building and pricing a portfolio.' },
  ];

  /* ------------------------------------------------------------------------
     3. Store — localStorage with graceful fallback (private mode etc.)
     ------------------------------------------------------------------------ */
  const STORE_KEY = 'procreate-masterclass-v1';
  const Store = {
    data: { done: {} },
    load() {
      try { const raw = localStorage.getItem(STORE_KEY); if (raw) this.data = { done: {}, ...JSON.parse(raw) }; } catch (_) { /* ignore */ }
    },
    save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (_) { /* ignore */ } },
    isDone(id) { return !!this.data.done[id]; },
    toggle(id) { this.data.done[id] = !this.data.done[id]; if (!this.data.done[id]) delete this.data.done[id]; this.save(); },
    reset() { this.data = { done: {} }; this.save(); },
  };

  /* ------------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------------ */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const el = (tag, attrs = {}, html = '') => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v);
    }
    if (html) n.innerHTML = html;
    return n;
  };
  const allLessons = () => $$('article[data-lesson]');
  // colour helpers (HSB = Procreate's Hue / Saturation / Brightness)
  const hsbHex = (h, s, b) => {
    s /= 100; b /= 100; const k = (n) => (n + h / 60) % 6; const f = (n) => b - b * s * Math.max(0, Math.min(k(n), 4 - k(n), 1));
    return '#' + [f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
  };
  // Mushroom-house drawing used throughout Module 04 (one subject, every stage)
  let mushId = 0;
  const mushroomSVG = (style) => {
    const id = 'mh' + ++mushId;
    const P = {
      ground: 'M0 172 Q100 152 200 172 V200 H0Z',
      stem: 'M76 166 L81 106 H119 L124 166Z',
      cap: 'M42 112 Q100 28 158 112 Q100 124 42 112Z',
      door: 'M92 166 V142 Q100 131 108 142 V166Z',
      capShade: 'M104 40 Q152 62 158 112 Q134 118 114 119 Q142 84 104 40Z',
      stemShade: 'M108 112 H119 L124 166 H111Z',
      under: 'M50 113 Q100 122 150 113 L146 118 Q100 128 54 118Z',
      tufts: 'M20 172 l4 -10 l3 10 M30 170 l3 -8 l3 8 M160 168 l4 -10 l3 10 M172 170 l3 -8 l3 8',
    };
    const spots = [[78, 96, 7], [104, 80, 8], [128, 98, 6], [62, 106, 4]];
    const spotsSVG = (fill, extra = '') => spots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`).join('');
    const C = { sky: '#cfe8f5', ground: '#86b86b', stem: '#f4e4c1', cap: '#dc2626', door: '#7c4a2a', win: '#fde68a', line: '#3b1d0e' };
    const lines = (outer, inner, col = C.line) => `<g fill="none" stroke="${col}" stroke-linecap="round" stroke-linejoin="round">
      <path d="${P.cap}" stroke-width="${outer}"/><path d="M80.5 117 L76 166 H124 L119.5 117" stroke-width="${outer}"/><path d="M0 172 Q100 152 200 172" stroke-width="${outer}"/>
      <path d="${P.door}" stroke-width="${inner}"/><circle cx="113" cy="128" r="6" stroke-width="${inner}"/>${spotsSVG('none', `stroke-width="${inner}"`)}<path d="${P.tufts}" stroke-width="${inner}"/></g>`;
    const flats = (c = C) => `<rect width="200" height="200" fill="${c.sky}"/><path d="${P.ground}" fill="${c.ground}"/><path d="${P.stem}" fill="${c.stem}"/>
      <path d="${P.door}" fill="${c.door}"/><circle cx="113" cy="128" r="6" fill="${c.win}"/><path d="${P.cap}" fill="${c.cap}"/>${spotsSVG('#fff7ed')}`;
    const cel = `<path d="${P.capShade}" fill="#7f1d1d" opacity=".55" clip-path="url(#${id}cp)"/><path d="${P.stemShade}" fill="#a16207" opacity=".35"/><path d="${P.under}" fill="#7c2d12" opacity=".5"/><ellipse cx="128" cy="168" rx="34" ry="5" fill="#365314" opacity=".45"/>`;
    const defs = `<defs><clipPath id="${id}cp"><path d="${P.cap}"/></clipPath>
      <radialGradient id="${id}c" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fb7185"/><stop offset=".5" stop-color="#dc2626"/><stop offset="1" stop-color="#5b0d0d"/></radialGradient>
      <linearGradient id="${id}s" x1="0" x2="1"><stop offset="0" stop-color="#fff7e6"/><stop offset=".6" stop-color="#f4e4c1"/><stop offset="1" stop-color="#b08a54"/></linearGradient>
      <linearGradient id="${id}k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd3f0"/><stop offset="1" stop-color="#fdf2d0"/></linearGradient>
      <filter id="${id}b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="${id}n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="4"/><feColorMatrix type="saturate" values="0"/></filter>
      <pattern id="${id}h" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="2.5" cy="2.5" r="1.4" fill="#1e1b4b"/></pattern></defs>`;
    const paint = `<rect width="200" height="200" fill="url(#${id}k)"/><path d="${P.ground}" fill="#6fa356"/><ellipse cx="130" cy="168" rx="40" ry="7" fill="#2f4a1d" opacity=".5" filter="url(#${id}b)"/>
      <path d="${P.stem}" fill="url(#${id}s)"/><path d="${P.door}" fill="#6b3d22"/><circle cx="113" cy="128" r="6" fill="#fde68a"/><circle cx="113" cy="128" r="12" fill="#fde68a" opacity=".5" filter="url(#${id}b)"/>
      <path d="${P.cap}" fill="url(#${id}c)"/><path d="${P.under}" fill="#3f0a0a" opacity=".45" filter="url(#${id}b)"/>${spotsSVG('#fff1e6', 'opacity=".95"')}<ellipse cx="80" cy="84" rx="16" ry="6" fill="#fff" opacity=".35" filter="url(#${id}b)" clip-path="url(#${id}cp)"/>`;
    let body = '';
    switch (style) {
      case 'thumb': body = `<rect width="200" height="200" fill="#a3a3a3"/><path d="${P.ground}" fill="#525252"/><path d="${P.stem}" fill="#e5e5e5"/><path d="${P.cap}" fill="#262626"/>`; break;
      case 'sketch': body = `<rect width="200" height="200" fill="#fafaf7"/>${[[0, 0, 1], [1.8, -1.2, .45], [-1.4, 1.6, .35]].map(([x, y, o]) => `<g transform="translate(${x} ${y})" opacity="${o}">${lines(1.3, 1.1, '#60a5fa')}</g>`).join('')}<ellipse cx="100" cy="85" rx="60" ry="40" fill="none" stroke="#93c5fd" stroke-dasharray="2 3"/>`; break;
      case 'refined': body = `<rect width="200" height="200" fill="#fafaf7"/>${lines(1.4, 1.2, '#3b82f6')}`; break;
      case 'lines-uniform': body = `<rect width="200" height="200" fill="#fafaf7"/>${lines(1.6, 1.6)}`; break;
      case 'lines': body = `<rect width="200" height="200" fill="#fafaf7"/>${lines(4, 1.4)}`; break;
      case 'flats': body = flats() + lines(4, 1.4); break;
      case 'flat': body = flats({ ...C, sky: '#fde7c8', ground: '#5b8c51', cap: '#e4572e' }); break;
      case 'cel': body = flats() + cel + lines(3.5, 1.4); break;
      case 'painterly': body = paint; break;
      case 'textured': body = flats({ sky: '#f4e9d8', ground: '#2a9d8f', stem: '#f4e9d8', cap: '#e76f51', door: '#264653', win: '#e9c46a' }) + `<path d="${P.capShade}" fill="url(#${id}h)" opacity=".6" clip-path="url(#${id}cp)"/><path d="${P.stemShade}" fill="url(#${id}h)" opacity=".4"/><rect width="200" height="200" filter="url(#${id}n)" style="mix-blend-mode:multiply" opacity=".35"/>`; break;
      case 'night': body = paint + `<rect width="200" height="200" fill="#1e1b4b" style="mix-blend-mode:multiply" opacity=".85"/><circle cx="113" cy="128" r="22" fill="#fbbf24" opacity=".7" filter="url(#${id}b)" style="mix-blend-mode:screen"/><circle cx="113" cy="128" r="6" fill="#fef3c7"/><g fill="#fef9c3">${[[20, 20], [60, 35], [170, 25], [150, 50], [35, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2"/>`).join('')}</g>`; break;
      case 'final': body = paint + `<path d="${P.capShade}" fill="#4c0519" opacity=".25" clip-path="url(#${id}cp)"/>` + lines(2.6, 1.1, '#5b0d0d') + `<rect width="200" height="200" filter="url(#${id}n)" style="mix-blend-mode:overlay" opacity=".3"/>`; break;
      default: body = flats();
    }
    return `<svg viewBox="0 0 200 200" class="block h-auto w-full" role="img" aria-label="Mushroom house illustration, ${style} stage">${defs}${body}</svg>`;
  };
  const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const posterSVG = ([bg, c1, c2, c3, ink], title = '') => `<svg viewBox="0 0 200 260" class="block h-auto w-full" role="img" aria-label="Sample poster in this palette">
    <rect width="200" height="260" fill="${bg}"/><circle cx="138" cy="86" r="38" fill="${c1}"/>
    <path d="M0 172 L58 122 L108 162 L160 108 L200 140 V260 H0Z" fill="${c2}"/><path d="M0 208 L70 176 L130 212 L200 186 V260 H0Z" fill="${c3}"/>
    <text x="16" y="42" font-family="Fraunces, Georgia, serif" font-size="24" font-weight="600" fill="${ink}">${title}</text>
    <rect x="16" y="50" width="40" height="3" fill="${c1}"/><rect x="16" y="236" width="80" height="4" rx="2" fill="${bg}" opacity=".85"/></svg>`;
  const wordsIn = (node) => (node.textContent || '').trim().split(/\s+/).length;

  /* ------------------------------------------------------------------------
     4. Nav — sidebar (desktop) + drawer (mobile) share one builder
     ------------------------------------------------------------------------ */
  function buildNav(container) {
    container.innerHTML = '';
    CURRICULUM.forEach((mod) => {
      const section = document.getElementById(mod.id);
      const wrap = el('div', { class: 'mb-1' });
      if (!section) {
        wrap.innerHTML = `
          <div class="flex items-start gap-3 rounded-xl px-3 py-2.5 opacity-45 select-none" title="Coming soon">
            <span class="mt-0.5 font-mono text-[12.5px] text-ink-mute">${mod.num}</span>
            <span class="flex-1 text-[15px] leading-snug text-ink-soft">${mod.title}
              <span class="mt-1 block text-[11px] uppercase tracking-widest text-ink-mute">Coming soon</span></span>
          </div>`;
        container.appendChild(wrap);
        return;
      }
      const lessons = $$('article[data-lesson]', section);
      const mins = Math.max(1, Math.round(wordsIn(section) / 200));
      const details = el('details', { class: 'group', 'data-nav-module': mod.id });
      details.open = true;
      details.innerHTML = `
        <summary class="flex cursor-pointer list-none items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5">
          <span class="mt-0.5 font-mono text-[12.5px] text-accent">${mod.num}</span>
          <span class="flex-1 text-[15px] font-semibold leading-snug text-ink"><a href="#${mod.id}" data-nav-module-link="${mod.id}" class="nav-link hover:text-accent">${mod.title}</a>
            <span class="mt-1 flex items-center gap-2 text-[11px] font-normal uppercase tracking-widest text-ink-mute">
              <span data-mod-count="${mod.id}">0/${lessons.length}</span> · ~${mins} min read</span></span>
          <svg class="mt-1 h-3.5 w-3.5 shrink-0 text-ink-mute transition-transform group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M7 4l6 6-6 6"/></svg>
        </summary>`;
      const list = el('ol', { class: 'ml-5 border-l border-line pl-2 pb-2' });
      lessons.forEach((art, i) => {
        const li = el('li');
        li.innerHTML = `
          <a href="#${art.id}" data-nav-link="${art.id}"
             class="nav-link flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] leading-snug text-ink-soft hover:bg-white/5 hover:text-ink">
            <span data-check="${art.id}" class="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border border-line text-[10px]"></span>
            <span class="flex-1">${mod.num.replace(/^0/, '')}.${i + 1} ${art.dataset.title || art.querySelector('h3')?.textContent || ''}</span>
          </a>`;
        list.appendChild(li);
      });
      details.appendChild(list);
      wrap.appendChild(details);
      container.appendChild(wrap);
    });
  }

  /* ------------------------------------------------------------------------
     5. Progress — completion buttons, colour puck ring, nav ticks
     ------------------------------------------------------------------------ */
  function injectCompleteButtons() {
    allLessons().forEach((art) => {
      if (art.querySelector('[data-complete-btn]')) return;
      const btn = el('button', { type: 'button', 'data-complete-btn': art.id,
        class: 'mt-10 inline-flex items-center gap-2 rounded-full border border-line bg-panel-2 px-4 py-2 text-sm text-ink-soft transition hover:border-accent hover:text-ink' });
      btn.addEventListener('click', () => { Store.toggle(art.id); renderProgress(); });
      art.appendChild(btn);
    });
  }

  function renderProgress() {
    const lessons = allLessons();
    const total = lessons.length;
    const done = lessons.filter((a) => Store.isDone(a.id)).length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    $$('[data-progress-ring]').forEach((ring) => {
      const r = 15.915; const c = 2 * Math.PI * r;
      ring.style.strokeDasharray = `${(pct / 100) * c} ${c}`;
    });
    $$('[data-progress-text]').forEach((n) => (n.textContent = `${pct}%`));
    $$('[data-progress-detail]').forEach((n) => (n.textContent = `${done} of ${total} lessons complete`));

    lessons.forEach((art) => {
      const isDone = Store.isDone(art.id);
      $$(`[data-check="${art.id}"]`).forEach((c) => {
        c.textContent = isDone ? '✓' : '';
        c.classList.toggle('bg-accent', isDone); c.classList.toggle('border-accent', isDone); c.classList.toggle('text-white', isDone);
      });
      const btn = art.querySelector('[data-complete-btn]');
      if (btn) {
        btn.innerHTML = isDone
          ? '<span class="grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] text-white">✓</span> Completed — click to undo'
          : '<span class="h-5 w-5 rounded-full border border-ink-mute"></span> Mark lesson as complete';
        btn.classList.toggle('border-accent', isDone);
      }
    });

    CURRICULUM.forEach((m) => {
      const s = document.getElementById(m.id); if (!s) return;
      const ls = $$('article[data-lesson]', s);
      const d = ls.filter((a) => Store.isDone(a.id)).length;
      $$(`[data-mod-count="${m.id}"]`).forEach((n) => (n.textContent = `${d}/${ls.length} done`));
    });
  }

  function readingBar() {
    const bar = $('#reading-bar'); if (!bar) return;
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
    };
    document.addEventListener('scroll', update, { passive: true }); update();
  }

  /* ------------------------------------------------------------------------
     6. ScrollSpy
     ------------------------------------------------------------------------ */
  function scrollSpy() {
    const links = () => $$('[data-nav-link]');
    const setActive = (id) => {
      links().forEach((a) => {
        const on = a.dataset.navLink === id;
        a.classList.toggle('bg-accent/15', on); a.classList.toggle('text-ink', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
      const active = $(`#sidebar [data-nav-link="${id}"]`);
      const scroller = $('#sidebar-scroll');
      if (active && scroller) {
        const r = active.getBoundingClientRect(); const sr = scroller.getBoundingClientRect();
        // Scroll only the sidebar — scrollIntoView() would also scroll the window and cancel an in-flight jump
        if (r.top < sr.top + 40 || r.bottom > sr.bottom - 40) scroller.scrollTo({ top: scroller.scrollTop + (r.top - sr.top) - (sr.height - r.height) / 2, behavior: 'smooth' });
      }
      const mod = document.getElementById(id)?.closest('section[data-module]');
      const crumb = $('#crumb');
      if (crumb && mod) { const m = CURRICULUM.find((x) => x.id === mod.id); crumb.textContent = m ? `${m.num} · ${m.title}` : ''; }
    };
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: '-20% 0px -70% 0px' });
    allLessons().forEach((a) => io.observe(a));
  }

  /* ------------------------------------------------------------------------
     Mobile drawer
     ------------------------------------------------------------------------ */
  function drawer() {
    const d = $('#drawer'), scrim = $('#scrim'), openBtn = $('#menu-btn'), closeBtn = $('#drawer-close');
    if (!d) return;
    const open = () => { d.classList.remove('-translate-x-full'); scrim.classList.remove('pointer-events-none', 'opacity-0'); document.body.style.overflow = 'hidden'; openBtn.setAttribute('aria-expanded', 'true'); closeBtn.focus(); };
    const close = () => { d.classList.add('-translate-x-full'); scrim.classList.add('pointer-events-none', 'opacity-0'); document.body.style.overflow = ''; openBtn.setAttribute('aria-expanded', 'false'); };
    openBtn.addEventListener('click', open); closeBtn.addEventListener('click', close); scrim.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    d.addEventListener('click', (e) => { if (e.target.closest('a[href^="#"]')) close(); });
  }

  /* ------------------------------------------------------------------------
     Jump-to — hero module grid + searchable dialog (⌘K / Ctrl+K / "/")
     ------------------------------------------------------------------------ */
  function moduleGrid() {
    const grid = $('#module-grid'); if (!grid) return;
    grid.innerHTML = CURRICULUM.map((m) => {
      const s = document.getElementById(m.id);
      const n = s ? $$('article[data-lesson]', s).length : 0;
      const inner = `<span class="font-mono text-[12.5px] ${s ? 'text-accent' : 'text-ink-mute'}">${m.num}</span>
        <span class="mt-1 block font-semibold leading-snug text-ink">${m.title}</span>
        <span class="mt-1 block text-xs text-ink-mute">${s ? `${n} lessons · ${m.blurb}` : 'Coming soon'}</span>`;
      return s
        ? `<a href="#${m.id}" class="card block transition hover:border-accent">${inner}</a>`
        : `<div class="card opacity-45" aria-disabled="true">${inner}</div>`;
    }).join('');
  }

  function jumpTo() {
    const dlg = $('#jump'), input = $('#jump-input'), list = $('#jump-list'), btn = $('#jump-btn');
    if (!dlg || !input || !list) return;
    const entries = [];
    CURRICULUM.forEach((m) => {
      const s = document.getElementById(m.id); if (!s) return;
      entries.push({ id: m.id, kind: 'module', label: m.title, meta: `Module ${m.num}` });
      $$('article[data-lesson]', s).forEach((a, i) => entries.push({
        id: a.id, kind: 'lesson', label: a.dataset.title || a.querySelector('h3')?.textContent || a.id,
        meta: `${m.num.replace(/^0/, '')}.${i + 1} · ${m.title}`,
      }));
    });
    const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    entries.forEach((e) => (e.hay = norm(`${e.label} ${e.meta}`)));
    const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    let shown = [], sel = 0;

    const render = () => {
      const terms = norm(input.value).split(/\s+/).filter(Boolean);
      shown = terms.length ? entries.filter((e) => terms.every((t) => e.hay.includes(t))) : entries;
      sel = Math.min(sel, Math.max(0, shown.length - 1));
      list.innerHTML = shown.length ? shown.map((e, i) => `
        <li role="option" id="jump-opt-${i}" data-i="${i}" aria-selected="${i === sel}"
            class="flex cursor-pointer items-baseline gap-3 rounded-lg px-3 py-2 ${e.kind === 'module' ? 'mt-1' : 'pl-7'} ${i === sel ? 'bg-accent/20 text-ink' : 'hover:bg-white/5'}">
          <span class="flex-1 ${e.kind === 'module' ? 'font-semibold text-ink' : 'text-[14px]'}">${esc(e.label)}</span>
          <span class="shrink-0 font-mono text-[11px] text-ink-mute">${esc(e.kind === 'module' ? e.meta : e.meta.split(' · ')[0])}</span>
        </li>`).join('')
        : '<li class="px-3 py-6 text-center text-sm text-ink-mute">No matching lessons</li>';
      input.setAttribute('aria-activedescendant', shown.length ? `jump-opt-${sel}` : '');
      const opt = $(`#jump-opt-${sel}`, list);
      if (opt) { // keep the highlighted option visible without touching the page scroll
        if (opt.offsetTop < list.scrollTop) list.scrollTop = opt.offsetTop;
        else if (opt.offsetTop + opt.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = opt.offsetTop + opt.offsetHeight - list.clientHeight;
      }
    };
    const go = (e) => {
      if (!e) return;
      dlg.close();
      const target = document.getElementById(e.id);
      history.pushState(null, '', `#${e.id}`);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const h = target.querySelector('h2, h3');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    };
    const open = () => {
      if (dlg.open) return;
      $('#drawer-close')?.click();
      input.value = ''; sel = 0; render();
      dlg.showModal(); input.focus();
    };

    btn?.addEventListener('click', open);
    input.addEventListener('input', () => { sel = 0; render(); });
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowDown') { ev.preventDefault(); sel = Math.min(sel + 1, shown.length - 1); render(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); sel = Math.max(sel - 1, 0); render(); }
      else if (ev.key === 'Enter') { ev.preventDefault(); go(shown[sel]); }
    });
    list.addEventListener('click', (ev) => { const li = ev.target.closest('[data-i]'); if (li) go(shown[+li.dataset.i]); });
    list.addEventListener('mousemove', (ev) => { const li = ev.target.closest('[data-i]'); if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; render(); } });
    dlg.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close(); }); // backdrop click
    document.addEventListener('keydown', (ev) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      if ((ev.key === 'k' || ev.key === 'K') && (ev.metaKey || ev.ctrlKey)) { ev.preventDefault(); dlg.open ? dlg.close() : open(); }
      else if (ev.key === '/' && !typing && !dlg.open) { ev.preventDefault(); open(); }
    });
  }

  /* ------------------------------------------------------------------------
     8. WIDGETS — interactive diagrams
     ------------------------------------------------------------------------ */
  const WIDGETS = {

    /* Before / after slider ------------------------------------------------
       <div data-widget="before-after" data-before-label=".." data-after-label="..">
         <div data-before>…svg…</div><div data-after>…svg…</div></div>          */
    'before-after'(root) {
      const before = root.querySelector('[data-before]'), after = root.querySelector('[data-after]');
      if (!before || !after) return;
      const bl = root.dataset.beforeLabel || 'Before', al = root.dataset.afterLabel || 'After';
      root.classList.add('relative', 'overflow-hidden', 'rounded-2xl', 'border', 'border-line', 'select-none', 'touch-none');
      before.classList.add('block'); after.classList.add('absolute', 'inset-0');
      $$('svg', root).forEach((s) => s.classList.add('block', 'w-full', 'h-auto'));
      const handle = el('div', { class: 'absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,.3)] pointer-events-none' },
        '<span class="absolute top-1/2 left-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-xs text-black shadow">⇆</span>');
      const tagL = el('span', { class: 'absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-white' }, bl);
      const tagR = el('span', { class: 'absolute right-2 top-2 rounded-md bg-accent px-2 py-0.5 text-[11px] text-white' }, al);
      const range = el('input', { type: 'range', min: '0', max: '100', value: '50', 'aria-label': `Compare ${bl} and ${al}`, class: 'absolute inset-0 h-full w-full cursor-ew-resize opacity-0' });
      root.append(handle, tagL, tagR, range);
      const set = (v) => { after.style.clipPath = `inset(0 0 0 ${v}%)`; handle.style.left = `${v}%`; };
      range.addEventListener('input', () => set(range.value)); set(50);
    },

    /* Canvas size / DPI calculator ---------------------------------------- */
    'dpi-calc'(root) {
      const presets = {
        'A4 poster': [210, 297, 'mm', 300], 'A3 poster': [297, 420, 'mm', 300], 'A2 poster': [420, 594, 'mm', 300],
        'US Letter': [8.5, 11, 'in', 300], '18×24 in poster': [18, 24, 'in', 300], 'Instagram post (4:5)': [1080, 1350, 'px', 72],
        '4K wallpaper': [3840, 2160, 'px', 72],
      };
      root.innerHTML = `
        <div class="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <form class="grid grid-cols-2 gap-3 text-sm" onsubmit="return false">
            <label class="col-span-2">Preset
              <select data-k="preset" class="field mt-1"><option value="">Custom…</option>${Object.keys(presets).map((p) => `<option>${p}</option>`).join('')}</select></label>
            <label>Width<input data-k="w" type="number" min="1" step="any" value="210" class="field mt-1"></label>
            <label>Height<input data-k="h" type="number" min="1" step="any" value="297" class="field mt-1"></label>
            <label>Unit<select data-k="u" class="field mt-1"><option value="mm">mm</option><option value="cm">cm</option><option value="in">inches</option><option value="px">pixels</option></select></label>
            <label>DPI<input data-k="dpi" type="number" min="1" step="1" value="300" class="field mt-1"></label>
          </form>
          <div class="rounded-2xl border border-line bg-canvas/70 p-4">
            <div class="flex items-center gap-4">
              <svg viewBox="0 0 120 120" class="h-28 w-28 shrink-0"><rect x="0" y="0" width="120" height="120" fill="none"/><rect data-shape x="20" y="10" width="80" height="100" rx="3" fill="#2f80ed22" stroke="#2f80ed" stroke-width="1.5"/></svg>
              <dl class="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt class="text-ink-mute">Pixels</dt><dd data-o="px" class="font-mono text-ink"></dd>
                <dt class="text-ink-mute">Megapixels</dt><dd data-o="mp" class="font-mono text-ink"></dd>
                <dt class="text-ink-mute">Print size</dt><dd data-o="print" class="font-mono text-ink"></dd>
                <dt class="text-ink-mute">1 layer ≈</dt><dd data-o="mem" class="font-mono text-ink"></dd>
              </dl>
            </div>
            <p data-o="note" class="mt-4 text-xs leading-relaxed text-ink-mute"></p>
          </div>
        </div>`;
      const f = (k) => $(`[data-k="${k}"]`, root); const o = (k) => $(`[data-o="${k}"]`, root);
      const toIn = { mm: 1 / 25.4, cm: 1 / 2.54, in: 1 };
      function calc() {
        const w = +f('w').value, h = +f('h').value, u = f('u').value, dpi = Math.max(1, +f('dpi').value);
        let pw, ph;
        if (u === 'px') { pw = Math.round(w); ph = Math.round(h); } else { pw = Math.round(w * toIn[u] * dpi); ph = Math.round(h * toIn[u] * dpi); }
        const mp = (pw * ph) / 1e6; const bytes = pw * ph * 4;
        o('px').textContent = `${pw.toLocaleString()} × ${ph.toLocaleString()}`;
        o('mp').textContent = `${mp.toFixed(1)} MP`;
        o('print').textContent = `${(pw / dpi).toFixed(2)} × ${(ph / dpi).toFixed(2)} in`;
        o('mem').textContent = bytes > 1e9 ? `${(bytes / 1e9).toFixed(2)} GB` : `${(bytes / 1e6).toFixed(0)} MB`;
        const maxSide = Math.max(pw, ph);
        o('note').innerHTML = `Uncompressed RGBA = width × height × 4 bytes. ${maxSide > 8000
          ? '<span class="text-amber-300">Very large canvas — many iPads will cap this size or allow only a handful of layers.</span>'
          : maxSide > 5000 ? '<span class="text-amber-200">Large canvas — expect a reduced layer limit on devices with less RAM.</span>'
          : 'Comfortable size for most iPads.'} Procreate shows the exact maximum layer count for your device in the canvas creation screen.`;
        const s = Math.min(100 / pw, 100 / ph); const rw = pw * s, rh = ph * s; const shape = $('[data-shape]', root);
        shape.setAttribute('width', rw); shape.setAttribute('height', rh); shape.setAttribute('x', (120 - rw) / 2); shape.setAttribute('y', (120 - rh) / 2);
      }
      f('preset').addEventListener('change', (e) => { const p = presets[e.target.value]; if (!p) return; [f('w').value, f('h').value, f('u').value, f('dpi').value] = p; calc(); });
      ['w', 'h', 'u', 'dpi'].forEach((k) => f(k).addEventListener('input', () => { f('preset').value = ''; calc(); }));
      calc();
    },

    /* Pressure curve editor ------------------------------------------------ */
    'pressure-curve'(root) {
      const S = 220, P = 14;
      root.innerHTML = `
        <div class="grid items-center gap-6 md:grid-cols-[auto_1fr]">
          <div>
            <svg viewBox="0 0 ${S + P * 2} ${S + P * 2}" class="h-64 w-64 touch-none select-none rounded-2xl border border-line bg-canvas" aria-label="Pressure curve editor">
              <g transform="translate(${P},${P})">
                ${[0.25, 0.5, 0.75].map((t) => `<line x1="${t * S}" y1="0" x2="${t * S}" y2="${S}" stroke="#ffffff10"/><line x1="0" y1="${t * S}" x2="${S}" y2="${t * S}" stroke="#ffffff10"/>`).join('')}
                <line x1="0" y1="${S}" x2="${S}" y2="0" stroke="#ffffff22" stroke-dasharray="4 4"/>
                <line data-h1 stroke="#2f80ed66"/><line data-h2 stroke="#2f80ed66"/>
                <path data-curve fill="none" stroke="#2f80ed" stroke-width="3" stroke-linecap="round"/>
                <circle data-p="1" r="9" fill="#1e1e21" stroke="#fff" stroke-width="2" class="cursor-grab"/>
                <circle data-p="2" r="9" fill="#1e1e21" stroke="#fff" stroke-width="2" class="cursor-grab"/>
                <text x="${S / 2}" y="${S + 12}" fill="#8e8e96" font-size="9" text-anchor="middle">Pencil pressure (input) →</text>
                <text x="-8" y="${S / 2}" fill="#8e8e96" font-size="9" text-anchor="middle" transform="rotate(-90 -8 ${S / 2})">Output →</text>
              </g>
            </svg>
            <div class="mt-3 flex flex-wrap gap-2 text-xs">
              <button type="button" data-preset="linear" class="chip">Linear</button>
              <button type="button" data-preset="soft" class="chip">Light hand</button>
              <button type="button" data-preset="firm" class="chip">Heavy hand</button>
              <button type="button" data-preset="s" class="chip">S-curve</button>
            </div>
          </div>
          <div>
            <p class="text-sm text-ink-soft">Stroke preview — pressure ramps from 0 (left) to 100% (right):</p>
            <svg viewBox="0 0 400 90" class="mt-3 w-full rounded-2xl border border-line bg-[#f4f1ea]"><path data-stroke fill="#1d1d1f"/></svg>
            <p data-readout class="mt-3 font-mono text-xs text-ink-mute"></p>
            <p class="mt-3 text-xs leading-relaxed text-ink-mute">Drag the two white handles. A curve that sags <em>below</em> the diagonal needs more force for the same output (more control for heavy-handed artists); a curve that bulges <em>above</em> rewards a light touch.</p>
          </div>
        </div>`;
      const svg = $('svg', root); const pts = { 1: [0.35, 0.35], 2: [0.65, 0.65] };
      const presets = { linear: [[0.33, 0.33], [0.66, 0.66]], soft: [[0.1, 0.55], [0.45, 0.95]], firm: [[0.55, 0.05], [0.9, 0.45]], s: [[0.6, 0.0], [0.4, 1.0]] };
      const bez = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
      function outFor(x) { // solve x(t)=x by bisection, return y(t)
        let lo = 0, hi = 1, t = x;
        for (let i = 0; i < 30; i++) { t = (lo + hi) / 2; if (bez(t, pts[1][0], pts[2][0]) < x) lo = t; else hi = t; }
        return Math.min(1, Math.max(0, bez(t, pts[1][1], pts[2][1])));
      }
      function draw() {
        const X = (v) => v * S, Y = (v) => S - v * S;
        $('[data-curve]', svg).setAttribute('d', `M0 ${S} C ${X(pts[1][0])} ${Y(pts[1][1])}, ${X(pts[2][0])} ${Y(pts[2][1])}, ${S} 0`);
        [1, 2].forEach((k) => { const c = $(`[data-p="${k}"]`, svg); c.setAttribute('cx', X(pts[k][0])); c.setAttribute('cy', Y(pts[k][1])); });
        const h1 = $('[data-h1]', svg), h2 = $('[data-h2]', svg);
        h1.setAttribute('x1', 0); h1.setAttribute('y1', S); h1.setAttribute('x2', X(pts[1][0])); h1.setAttribute('y2', Y(pts[1][1]));
        h2.setAttribute('x1', S); h2.setAttribute('y1', 0); h2.setAttribute('x2', X(pts[2][0])); h2.setAttribute('y2', Y(pts[2][1]));
        const top = [], bot = []; const N = 60;
        for (let i = 0; i <= N; i++) {
          const x = i / N; const w = 1 + outFor(x) * 34; const px = 15 + x * 370; const py = 45 + Math.sin(x * Math.PI * 2) * 12;
          top.push(`${px.toFixed(1)},${(py - w / 2).toFixed(1)}`); bot.unshift(`${px.toFixed(1)},${(py + w / 2).toFixed(1)}`);
        }
        $('[data-stroke]', root).setAttribute('d', `M${top.join(' L')} L${bot.join(' L')} Z`);
        $('[data-readout]', root).textContent = `25% pressure → ${Math.round(outFor(0.25) * 100)}% output · 50% → ${Math.round(outFor(0.5) * 100)}% · 75% → ${Math.round(outFor(0.75) * 100)}%`;
      }
      let drag = null;
      svg.addEventListener('pointerdown', (e) => { const k = e.target.dataset?.p; if (k) { drag = k; svg.setPointerCapture(e.pointerId); } });
      svg.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
        pts[drag] = [Math.min(1, Math.max(0, (loc.x - P) / S)), Math.min(1, Math.max(0, 1 - (loc.y - P) / S))];
        draw();
      });
      svg.addEventListener('pointerup', () => (drag = null));
      $$('[data-preset]', root).forEach((b) => b.addEventListener('click', () => { const p = presets[b.dataset.preset]; pts[1] = [...p[0]]; pts[2] = [...p[1]]; draw(); }));
      draw();
    },

    /* StreamLine playground ------------------------------------------------ */
    'streamline'(root) {
      root.innerHTML = `
        <div class="flex flex-wrap items-center gap-4 text-sm">
          <label class="flex items-center gap-3 text-ink-soft">StreamLine <input data-s type="range" min="0" max="100" value="45" class="w-40 accent-[#2f80ed]"><span data-sv class="w-10 font-mono text-ink">45%</span></label>
          <label class="flex items-center gap-2 text-ink-soft"><input data-raw type="checkbox" checked class="accent-[#2f80ed]"> show raw input</label>
          <button type="button" data-clear class="chip">Clear</button>
        </div>
        <canvas class="mt-4 h-64 w-full touch-none rounded-2xl border border-line bg-[#f4f1ea]" aria-label="Drawing pad: draw to compare raw and stabilised strokes"></canvas>
        <p class="mt-2 text-xs text-ink-mute">Draw a wobbly signature or a circle. <span class="text-rose-400">Red</span> = what your hand did, <span class="text-ink">black</span> = what the stabilised brush lays down.</p>`;
      const cv = $('canvas', root), ctx = cv.getContext('2d'); const sl = $('[data-s]', root);
      let pos = null, sm = null, down = false;
      function fit() { const r = cv.getBoundingClientRect(); const d = window.devicePixelRatio || 1; cv.width = r.width * d; cv.height = r.height * d; ctx.setTransform(d, 0, 0, d, 0, 0); ctx.lineCap = ctx.lineJoin = 'round'; }
      const local = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      cv.addEventListener('pointerdown', (e) => { down = true; cv.setPointerCapture(e.pointerId); pos = local(e); sm = [...pos]; });
      cv.addEventListener('pointermove', (e) => {
        if (!down) return;
        const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        for (const ev of events) {
          const p = local(ev); const k = 1 - (+sl.value / 100) * 0.94;
          if ($('[data-raw]', root).checked) { ctx.strokeStyle = 'rgba(225,29,72,.55)'; ctx.lineWidth = 1.25; ctx.beginPath(); ctx.moveTo(...pos); ctx.lineTo(...p); ctx.stroke(); }
          const nx = sm[0] + (p[0] - sm[0]) * k, ny = sm[1] + (p[1] - sm[1]) * k;
          ctx.strokeStyle = '#1d1d1f'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(...sm); ctx.lineTo(nx, ny); ctx.stroke();
          sm = [nx, ny]; pos = p;
        }
      });
      const up = () => { down = false; };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      sl.addEventListener('input', () => ($('[data-sv]', root).textContent = `${sl.value}%`));
      $('[data-clear]', root).addEventListener('click', () => ctx.clearRect(0, 0, cv.width, cv.height));
      fit(); window.addEventListener('resize', fit);
    },

    /* Blend mode playground ------------------------------------------------ */
    'blend-modes'(root) {
      const modes = {
        normal: ['Normal', 'Result = blend', 'Default. The top layer simply covers what is below.'],
        multiply: ['Multiply', 'Result = base × blend', 'Always darker (or equal). White is invisible. Shadows, line art over colour, ink washes.'],
        darken: ['Darken', 'Result = min(base, blend)', 'Keeps whichever channel value is darker.'],
        'color-burn': ['Color Burn', 'Result = 1 − (1 − base) ÷ blend', 'Dark, saturated, high-contrast darkening. Rich shadows.'],
        screen: ['Screen', 'Result = 1 − (1 − base)(1 − blend)', 'Always lighter (or equal). Black is invisible. Glows, mist, light beams.'],
        lighten: ['Lighten', 'Result = max(base, blend)', 'Keeps whichever channel value is lighter.'],
        'color-dodge': ['Color Dodge', 'Result = base ÷ (1 − blend)', 'Intense, burning-hot highlights. Sparks, neon, magic.'],
        overlay: ['Overlay', 'base < .5 ? 2·base·blend : 1 − 2(1 − base)(1 − blend)', 'Multiply in the darks, Screen in the lights — boosts contrast. 50% grey is neutral.'],
        'soft-light': ['Soft Light', 'Gentler Overlay', 'Subtle contrast and tint; great for colour grading textures.'],
        'hard-light': ['Hard Light', 'Overlay with layers swapped', 'Strong contrast driven by the TOP layer\'s values.'],
        difference: ['Difference', 'Result = |base − blend|', 'Inverts where bright. Useful for checking alignment between two near-identical layers.'],
        exclusion: ['Exclusion', 'base + blend − 2·base·blend', 'Lower-contrast cousin of Difference.'],
        hue: ['Hue', 'Hue of blend, sat + lum of base', 'Recolour while keeping shading.'],
        saturation: ['Saturation', 'Sat of blend, hue + lum of base', 'Push or kill saturation in areas.'],
        color: ['Color', 'Hue + sat of blend, lum of base', 'Colourise a greyscale painting (the “grisaille” workflow).'],
        luminosity: ['Luminosity', 'Lum of blend, hue + sat of base', 'Transfer value structure only.'],
      };
      root.innerHTML = `
        <div class="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div class="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line" style="isolation:isolate">
            <div class="absolute inset-0" style="background:linear-gradient(90deg,#000 0%,#7f7f7f 50%,#fff 100%)"></div>
            <div class="absolute inset-x-0 bottom-0 h-1/2" style="background:linear-gradient(90deg,#e11d48,#f59e0b,#22c55e,#06b6d4,#6366f1,#d946ef)"></div>
            <div data-top class="absolute left-1/2 top-1/2 h-3/5 w-3/5 -translate-x-1/2 -translate-y-1/2 rounded-full" style="background:#2f80ed"></div>
            <span class="absolute left-2 top-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] text-white">Base: value ramp + hue band</span>
            <span class="absolute right-2 top-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] text-white">Top: circle layer</span>
          </div>
          <div class="text-sm">
            <label class="block text-ink-soft">Blend mode
              <select data-mode class="field mt-1">${Object.entries(modes).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select></label>
            <label class="mt-3 flex items-center gap-3 text-ink-soft">Top layer colour <input data-col type="color" value="#2f80ed" class="h-8 w-14 cursor-pointer rounded border border-line bg-transparent"></label>
            <label class="mt-3 flex items-center gap-3 text-ink-soft">Layer opacity <input data-op type="range" min="0" max="100" value="100" class="w-40 accent-[#2f80ed]"><span data-opv class="font-mono">100%</span></label>
            <div class="mt-5 rounded-2xl border border-line bg-canvas/70 p-4">
              <p data-name class="font-semibold text-ink"></p>
              <code data-formula class="mt-2 block rounded-lg bg-black/40 px-3 py-2 font-mono text-xs text-sky-300"></code>
              <p data-use class="mt-3 text-ink-soft"></p>
            </div>
            <p class="mt-3 text-xs text-ink-mute">Formulas use channel values from 0 (black) to 1 (white). Your browser is doing the same maths Procreate does.</p>
          </div>
        </div>`;
      const top = $('[data-top]', root), sel = $('[data-mode]', root);
      function apply() {
        const [n, f, u] = modes[sel.value];
        top.style.mixBlendMode = sel.value; top.style.background = $('[data-col]', root).value; top.style.opacity = $('[data-op]', root).value / 100;
        $('[data-opv]', root).textContent = `${$('[data-op]', root).value}%`;
        $('[data-name]', root).textContent = n; $('[data-formula]', root).textContent = f; $('[data-use]', root).textContent = u;
      }
      sel.value = 'multiply';
      ['change', 'input'].forEach((ev) => root.addEventListener(ev, apply));
      apply();
    },

    /* Layer stack explorer ------------------------------------------------- */
    'layer-stack'(root) {
      const layers = [
        { id: 'bg', name: 'Background colour', color: '#f4efe4', svg: '<rect width="200" height="150" fill="#f4efe4"/>' },
        { id: 'sky', name: 'Sky gradient', svg: '<defs><linearGradient id="lsg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dd3fc"/><stop offset="1" stop-color="#fde68a"/></linearGradient></defs><rect width="200" height="100" fill="url(#lsg)"/>' },
        { id: 'hills', name: 'Hills (flats)', svg: '<path d="M0 95 Q50 60 100 90 T200 80 V150 H0Z" fill="#65a30d"/>' },
        { id: 'shadow', name: 'Shadow · Multiply · clipped', svg: '<path d="M0 115 Q60 95 120 120 T200 110 V150 H0Z" fill="#7c3aed" style="mix-blend-mode:multiply" opacity=".55"/>' },
        { id: 'sun', name: 'Sun glow · Screen', svg: '<circle cx="150" cy="45" r="28" fill="#fb923c" style="mix-blend-mode:screen"/>' },
        { id: 'ink', name: 'Line art', svg: '<path d="M0 95 Q50 60 100 90 T200 80" fill="none" stroke="#1d1d1f" stroke-width="2.2"/><circle cx="150" cy="45" r="16" fill="none" stroke="#1d1d1f" stroke-width="2"/>' },
      ];
      const on = Object.fromEntries(layers.map((l) => [l.id, true]));
      root.innerHTML = `
        <div class="grid gap-6 md:grid-cols-[1.3fr_1fr]">
          <svg viewBox="0 0 200 150" class="w-full rounded-2xl border border-line" style="isolation:isolate" data-view></svg>
          <div class="rounded-2xl border border-line bg-panel-2 p-2" aria-label="Layers panel">
            <div class="flex items-center justify-between px-2 py-1.5 text-xs text-ink-mute"><span class="font-semibold text-ink">Layers</span><span>tap to toggle visibility</span></div>
            <ul data-list class="plain space-y-1"></ul>
          </div>
        </div>`;
      const view = $('[data-view]', root), list = $('[data-list]', root);
      function render() {
        view.innerHTML = layers.filter((l) => on[l.id]).map((l) => `<g>${l.svg}</g>`).join('');
        list.innerHTML = '';
        [...layers].reverse().forEach((l) => {
          const li = el('li');
          li.innerHTML = `<button type="button" class="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-xs ${on[l.id] ? 'bg-accent/15 text-ink' : 'text-ink-mute'} hover:bg-white/5">
            <svg viewBox="0 0 200 150" class="h-9 w-12 shrink-0 rounded border border-line bg-[repeating-conic-gradient(#3a3a40_0_25%,#2a2a2e_0_50%)] bg-[length:10px_10px]">${l.svg}</svg>
            <span class="flex-1">${l.name}</span>
            <span class="grid h-5 w-5 place-items-center rounded border ${on[l.id] ? 'border-accent bg-accent text-white' : 'border-line'}">${on[l.id] ? '✓' : ''}</span></button>`;
          li.firstElementChild.addEventListener('click', () => { on[l.id] = !on[l.id]; render(); });
          list.appendChild(li);
        });
      }
      render();
    },

    /* Brush stamp / spacing demo ------------------------------------------ */
    'brush-stamp'(root) {
      root.innerHTML = `
        <div class="flex flex-wrap items-center gap-5 text-sm text-ink-soft">
          <label class="flex items-center gap-3">Spacing <input data-sp type="range" min="2" max="120" value="18" class="w-36 accent-[#2f80ed]"><span data-spv class="w-10 font-mono text-ink"></span></label>
          <label class="flex items-center gap-3">Jitter <input data-j type="range" min="0" max="100" value="0" class="w-28 accent-[#2f80ed]"></label>
          <label class="flex items-center gap-2">Shape
            <select data-sh class="field !mt-0 !w-auto"><option value="round">Round</option><option value="square">Chisel</option><option value="leaf">Leaf</option><option value="star">Star</option></select></label>
        </div>
        <svg viewBox="0 0 600 140" class="mt-4 w-full rounded-2xl border border-line bg-[#f4f1ea]"><path data-guide fill="none" stroke="#2f80ed55" stroke-dasharray="3 5"/><g data-stamps></g></svg>
        <p class="mt-2 text-xs text-ink-mute">Each mark is one “stamp” of the brush Shape. Low spacing fuses them into a line; high spacing reveals the dabs.</p>`;
      const shapes = {
        round: (s) => `<circle r="${s}"/>`,
        square: (s) => `<rect x="${-s * 1.2}" y="${-s * 0.35}" width="${s * 2.4}" height="${s * 0.7}" rx="1"/>`,
        leaf: (s) => `<path d="M0 ${-s * 1.4} Q${s} 0 0 ${s * 1.4} Q${-s} 0 0 ${-s * 1.4}Z"/>`,
        star: (s) => `<path d="${Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? s * 0.45 : s * 1.2; const a = (Math.PI / 5) * i - Math.PI / 2; return `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`; }).join('')}Z"/>`,
      };
      const path = (t) => [30 + t * 540, 70 + Math.sin(t * Math.PI * 2.2) * 38];
      $('[data-guide]', root).setAttribute('d', 'M' + Array.from({ length: 101 }, (_, i) => path(i / 100).map((v) => v.toFixed(1)).join(' ')).join(' L'));
      let seed = 1; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      function draw() {
        seed = 7; const sp = +$('[data-sp]', root).value; const j = +$('[data-j]', root).value / 100; const sh = shapes[$('[data-sh]', root).value];
        $('[data-spv]', root).textContent = `${sp}%`;
        const size = 12; const step = Math.max(0.6, (sp / 100) * size * 2); let out = ''; let dist = 0; let prev = path(0);
        for (let i = 1; i <= 1200; i++) {
          const p = path(i / 1200); dist += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p;
          if (dist >= step) {
            dist = 0; const ang = Math.atan2(p[1] - path((i - 1) / 1200)[1], p[0] - path((i - 1) / 1200)[0]) * 180 / Math.PI;
            const ox = (rnd() - 0.5) * 30 * j, oy = (rnd() - 0.5) * 30 * j, sc = 1 - rnd() * 0.5 * j;
            out += `<g transform="translate(${(p[0] + ox).toFixed(1)} ${(p[1] + oy).toFixed(1)}) rotate(${ang.toFixed(0)}) scale(${sc.toFixed(2)})" fill="#1d1d1f" fill-opacity="${sp < 15 ? 0.35 : 0.85}">${sh(size)}</g>`;
          }
        }
        $('[data-stamps]', root).innerHTML = out;
      }
      root.addEventListener('input', draw); draw();
    },

    /* Perspective box drawer (1- and 2-point) ----------------------------- */
    'perspective'(root) {
      root.innerHTML = `
        <div class="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <button type="button" data-m="1" class="chip">1-point</button>
          <button type="button" data-m="2" class="chip">2-point</button>
          <label class="ml-2 flex items-center gap-2 text-ink-soft">Depth <input data-d type="range" min="10" max="70" value="35" class="w-28 accent-[#2f80ed]"></label>
        </div>
        <svg viewBox="0 0 600 320" class="w-full touch-none select-none rounded-2xl border border-line bg-[#f4f1ea]" aria-label="Perspective diagram with draggable vanishing points"><g data-g></g></svg>
        <p class="cap">Drag the blue vanishing point(s). Every box edge going "into" the picture points at one.</p>`;
      const svg = $('svg', root), g = $('[data-g]', root);
      let mode = 1; const vp1 = { x: 300, y: 120 }; const vps = [{ x: 30, y: 120 }, { x: 570, y: 120 }];
      const L = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      const P = (pts) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
      const inter = (p1, p2, p3, p4) => { const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x); if (Math.abs(d) < 1e-6) return p2; const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d; return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) }; };
      function draw() {
        const depth = +$('[data-d]', root).value / 100; let out = '';
        const hy = mode === 1 ? vp1.y : vps[0].y;
        out += `<line x1="0" y1="${hy}" x2="600" y2="${hy}" stroke="#2f80ed" stroke-width="1.2"/><text x="8" y="${hy - 6}" font-family="Inter" font-size="10" fill="#2f80ed">horizon / eye level</text>`;
        if (mode === 1) {
          [{ x: 60, y: 190, w: 110, h: 90 }, { x: 250, y: 30, w: 110, h: 55 }, { x: 420, y: 200, w: 120, h: 80 }, { x: 440, y: 50, w: 70, h: 50 }].forEach((b) => {
            const f = [{ x: b.x, y: b.y }, { x: b.x + b.w, y: b.y }, { x: b.x + b.w, y: b.y + b.h }, { x: b.x, y: b.y + b.h }];
            const k = f.map((p) => L(p, vp1, depth));
            f.forEach((p) => (out += `<line x1="${p.x}" y1="${p.y}" x2="${vp1.x}" y2="${vp1.y}" stroke="#2f80ed33" stroke-dasharray="3 4"/>`));
            [[0, 1], [1, 2], [2, 3], [3, 0]].forEach(([i, j]) => (out += `<polygon points="${P([f[i], f[j], k[j], k[i]])}" fill="${[ '#d6d0c4', '#bdb6a8', '#a8a091', '#cfc8ba'][i]}" stroke="#1d1d1f" stroke-width="1.5"/>`));
            out += `<polygon points="${P(f)}" fill="#f59e0b" stroke="#1d1d1f" stroke-width="2"/>`;
          });
          out += `<circle data-vp="0" cx="${vp1.x}" cy="${vp1.y}" r="9" fill="#2f80ed" stroke="#fff" stroke-width="2" class="cursor-grab"/>`;
        } else {
          const [VL, VR] = vps;
          [{ x: 300, t: 175, b: 290, a: depth, c: depth }, { x: 150, t: 20, b: 85, a: depth * 0.6, c: depth * 0.8 }, { x: 470, t: 30, b: 95, a: depth * 0.7, c: depth * 0.5 }].forEach((bx) => {
            const T = { x: bx.x, y: bx.t }, B = { x: bx.x, y: bx.b };
            const Tl = L(T, VL, bx.a), Bl = L(B, VL, bx.a), Tr = L(T, VR, bx.c), Br = L(B, VR, bx.c);
            [T, B].forEach((p) => [VL, VR].forEach((v) => (out += `<line x1="${p.x}" y1="${p.y}" x2="${v.x}" y2="${v.y}" stroke="#2f80ed2e" stroke-dasharray="3 4"/>`)));
            out += `<polygon points="${P([T, B, Bl, Tl])}" fill="#bdb6a8" stroke="#1d1d1f" stroke-width="1.8"/>`;
            out += `<polygon points="${P([T, B, Br, Tr])}" fill="#f59e0b" stroke="#1d1d1f" stroke-width="1.8"/>`;
            if (bx.t > hy) { const X = inter(Tl, VR, Tr, VL); out += `<polygon points="${P([T, Tl, X, Tr])}" fill="#e7e1d4" stroke="#1d1d1f" stroke-width="1.8"/>`; }
            else if (bx.b < hy) { const X = inter(Bl, VR, Br, VL); out += `<polygon points="${P([B, Bl, X, Br])}" fill="#8f8778" stroke="#1d1d1f" stroke-width="1.8"/>`; }
          });
          vps.forEach((v, i) => (out += `<circle data-vp="${i}" cx="${v.x}" cy="${v.y}" r="9" fill="#2f80ed" stroke="#fff" stroke-width="2" class="cursor-grab"/>`));
        }
        g.innerHTML = out;
        $$('[data-m]', root).forEach((b) => b.classList.toggle('!border-accent', +b.dataset.m === mode));
      }
      let drag = null;
      svg.addEventListener('pointerdown', (e) => { if (e.target.dataset.vp != null) { drag = +e.target.dataset.vp; svg.setPointerCapture(e.pointerId); } });
      svg.addEventListener('pointermove', (e) => {
        if (drag === null) return;
        const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse());
        const y = Math.max(10, Math.min(310, p.y));
        if (mode === 1) { vp1.x = Math.max(10, Math.min(590, p.x)); vp1.y = y; }
        else { vps[drag].x = drag === 0 ? Math.max(-100, Math.min(260, p.x)) : Math.max(340, Math.min(700, p.x)); vps[0].y = vps[1].y = y; }
        draw();
      });
      svg.addEventListener('pointerup', () => (drag = null));
      $$('[data-m]', root).forEach((b) => b.addEventListener('click', () => { mode = +b.dataset.m; draw(); }));
      $('[data-d]', root).addEventListener('input', draw);
      draw();
    },

    /* Light on a sphere ----------------------------------------------------- */
    'light-sphere'(root) {
      const id = 'ls' + Math.random().toString(36).slice(2, 7);
      root.innerHTML = `
        <svg viewBox="0 0 600 340" class="w-full touch-none select-none rounded-2xl border border-line" aria-label="Sphere lit by a draggable light">
          <defs>
            <radialGradient id="${id}g" gradientUnits="userSpaceOnUse" r="190"><stop offset="0" stop-color="#fff8e7"/><stop offset=".12" stop-color="#f9b46b"/><stop offset=".45" stop-color="#d9773a"/><stop offset=".68" stop-color="#5b2a1d"/><stop offset=".8" stop-color="#4a2219"/><stop offset="1" stop-color="#8a4a33"/></radialGradient>
            <filter id="${id}b" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="7"/></filter>
          </defs>
          <rect width="600" height="340" fill="#2a2a30"/><rect y="250" width="600" height="90" fill="#3a3a42"/>
          <ellipse data-cast rx="110" ry="16" fill="#0b0b0e" opacity=".65" filter="url(#${id}b)"/>
          <ellipse cx="300" cy="258" rx="58" ry="7" fill="#000" opacity=".8" filter="url(#${id}b)"/>
          <circle cx="300" cy="175" r="85" fill="url(#${id}g)"/>
          <g data-labels font-family="Inter" font-size="11" fill="#f2f2f4"></g>
          <g data-sun class="cursor-grab"><circle r="16" fill="#fde047"/><circle r="24" fill="none" stroke="#fde04766" stroke-width="4"/></g>
        </svg>
        <label class="mt-3 flex items-center gap-2 text-sm text-ink-soft"><input data-show type="checkbox" checked class="accent-[#2f80ed]"> Show labels</label>`;
      const svg = $('svg', root), grad = $(`#${id}g`, root), C = { x: 300, y: 175 }, R = 85; let sun = { x: 470, y: 55 };
      function draw() {
        let dx = sun.x - C.x, dy = sun.y - C.y; const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
        const hx = C.x + dx * R * 0.5, hy = C.y + dy * R * 0.5;
        grad.setAttribute('cx', hx); grad.setAttribute('cy', hy); grad.setAttribute('fx', hx); grad.setAttribute('fy', hy);
        const cast = $('[data-cast]', root); cast.setAttribute('cx', C.x - dx * 140); cast.setAttribute('cy', 266); cast.setAttribute('rx', 90 + Math.abs(dx) * 70);
        $('[data-sun]', root).setAttribute('transform', `translate(${sun.x} ${sun.y})`);
        const lab = (x, y, t) => `<g><circle cx="${x}" cy="${y}" r="3" fill="#2f80ed"/><text x="${x + 7}" y="${y + 4}" paint-order="stroke" stroke="#000" stroke-width="3">${t}</text></g>`;
        $('[data-labels]', root).innerHTML = $('[data-show]', root).checked
          ? lab(hx, hy, 'Highlight') + lab(C.x, C.y, 'Mid-tone') + lab(C.x - dx * R * 0.55, C.y - dy * R * 0.55, 'Core shadow') + lab(C.x - dx * R * 0.9, C.y - dy * R * 0.9, 'Reflected light') + lab(C.x - dx * 150, 272, 'Cast shadow') + lab(300, 262, 'Occlusion')
          : '';
      }
      let drag = false;
      svg.addEventListener('pointerdown', (e) => { if (e.target.closest('[data-sun]')) { drag = true; svg.setPointerCapture(e.pointerId); } });
      svg.addEventListener('pointermove', (e) => {
        if (!drag) return; const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse());
        sun = { x: Math.max(20, Math.min(580, p.x)), y: Math.max(20, Math.min(230, p.y)) }; draw();
      });
      svg.addEventListener('pointerup', () => (drag = false));
      $('[data-show]', root).addEventListener('change', draw);
      draw();
    },

    /* HSB mixer ------------------------------------------------------------ */
    'hsb'(root) {
      root.innerHTML = `
        <div class="grid gap-6 md:grid-cols-[1fr_auto]">
          <div class="space-y-4 text-sm">
            ${[['h', 'Hue', 360, 210], ['s', 'Saturation', 100, 75], ['b', 'Brightness', 100, 90]].map(([k, n, m, v]) => `
              <label class="block text-ink-soft"><span class="flex justify-between"><span>${n}</span><span data-v="${k}" class="font-mono text-ink"></span></span>
                <input data-k="${k}" type="range" min="0" max="${m}" value="${v}" class="mt-1 w-full accent-[#2f80ed]">
                <div data-strip="${k}" class="mt-1 h-3 rounded-full"></div></label>`).join('')}
          </div>
          <div class="flex gap-3">
            <div class="text-center"><div data-sw class="h-28 w-28 rounded-2xl border border-line"></div><p data-hex class="mt-2 font-mono text-xs text-ink"></p></div>
            <div class="text-center"><div data-grey class="h-28 w-28 rounded-2xl border border-line"></div><p class="mt-2 text-xs text-ink-mute">its value (grey)</p></div>
          </div>
        </div>`;
      const v = (k) => +$(`[data-k="${k}"]`, root).value;
      function draw() {
        const h = v('h'), s = v('s'), b = v('b'); const hex = hsbHex(h, s, b); const [r, g, bl] = hexRgb(hex);
        const y = Math.round(0.299 * r + 0.587 * g + 0.114 * bl);
        $('[data-sw]', root).style.background = hex; $('[data-grey]', root).style.background = `rgb(${y},${y},${y})`;
        $('[data-hex]', root).textContent = hex.toUpperCase();
        $('[data-v="h"]', root).textContent = `${h}°`; $('[data-v="s"]', root).textContent = `${s}%`; $('[data-v="b"]', root).textContent = `${b}%`;
        $('[data-strip="h"]', root).style.background = `linear-gradient(90deg,${[0, 60, 120, 180, 240, 300, 360].map((x) => hsbHex(x, s, b)).join(',')})`;
        $('[data-strip="s"]', root).style.background = `linear-gradient(90deg,${hsbHex(h, 0, b)},${hsbHex(h, 100, b)})`;
        $('[data-strip="b"]', root).style.background = `linear-gradient(90deg,#000,${hsbHex(h, s, 100)})`;
      }
      root.addEventListener('input', draw); draw();
    },

    /* Colour harmony wheel + live poster ----------------------------------- */
    'harmony'(root) {
      const types = {
        complementary: ['Complementary', [0, 180], 'Opposites. Maximum contrast and energy. Let one colour dominate.'],
        split: ['Split complementary', [0, 150, 210], 'A base plus the two neighbours of its opposite. Contrast with less tension.'],
        analogous: ['Analogous', [-30, 0, 30], 'Neighbours on the wheel. Calm and harmonious, like nature.'],
        triadic: ['Triadic', [0, 120, 240], 'Three evenly spaced hues. Playful and balanced. Mute two of them.'],
        tetradic: ['Tetradic (rectangle)', [0, 60, 180, 240], 'Two complementary pairs. Rich, but needs one dominant colour.'],
        square: ['Square', [0, 90, 180, 270], 'Four evenly spaced hues. Bold. Vary the saturation.'],
        mono: ['Monochromatic', [0], 'One hue in many values and saturations. Elegant and unified.'],
      };
      root.innerHTML = `
        <div class="grid gap-6 md:grid-cols-[auto_1fr] 2xl:grid-cols-[auto_1fr_auto] md:items-start">
          <div class="mx-auto">
            <div data-wheel class="relative h-56 w-56 cursor-crosshair touch-none select-none rounded-full" style="background:radial-gradient(circle,#fff 0,rgba(255,255,255,0) 72%),conic-gradient(from 0deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)">
              <svg viewBox="0 0 100 100" class="pointer-events-none absolute inset-0 h-full w-full"><polygon data-poly fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="2 1.5"/></svg>
              <div data-marks></div>
            </div>
            <p class="cap text-center">Drag on the wheel to change the base hue</p>
          </div>
          <div class="text-sm">
            <label class="block text-ink-soft">Combination type<select data-type class="field mt-1">${Object.entries(types).map(([k, t]) => `<option value="${k}">${t[0]}</option>`).join('')}</select></label>
            <div data-sw class="mt-4 flex overflow-hidden rounded-xl border border-line"></div>
            <p data-desc class="mt-3 text-ink-soft"></p>
            <p class="mt-4 text-xs text-ink-mute">60 · 30 · 10 split</p>
            <div data-bar class="mt-1 flex h-4 overflow-hidden rounded-full"></div>
          </div>
          <div data-poster class="mx-auto w-44 overflow-hidden rounded-xl border border-line shadow-float md:col-span-2 2xl:col-span-1"></div>
        </div>`;
      let base = 210;
      function palette() {
        const [, offs] = types[$('[data-type]', root).value];
        const hs = offs.map((o) => (base + o + 360) % 360);
        if (hs.length === 1) return { hs, cols: [hsbHex(hs[0], 12, 97), hsbHex(hs[0], 80, 90), hsbHex(hs[0], 60, 65), hsbHex(hs[0], 70, 38), hsbHex(hs[0], 70, 18)] };
        const main = hs.length === 3 && $('[data-type]', root).value === 'analogous' ? hs[1] : hs[0];
        const acc = hs.filter((h) => h !== main);
        return { hs, cols: [hsbHex(main, 10, 97), hsbHex(acc[0], 78, 92), hsbHex(main, 65, 70), hsbHex(acc[1] ?? main, 60, 45), hsbHex(main, 70, 20)] };
      }
      function draw() {
        const { hs, cols } = palette(); const t = types[$('[data-type]', root).value];
        const pos = (h, r = 42) => [50 + Math.sin((h * Math.PI) / 180) * r, 50 - Math.cos((h * Math.PI) / 180) * r];
        $('[data-marks]', root).innerHTML = hs.map((h, i) => { const [x, y] = pos(h); return `<span class="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white shadow ${i === 0 ? 'h-6 w-6' : 'h-4 w-4'}" style="left:${x}%;top:${y}%;background:${hsbHex(h, 100, 100)}"></span>`; }).join('');
        $('[data-poly]', root).setAttribute('points', hs.length > 1 ? hs.map((h) => pos(h).join(',')).join(' ') : '');
        $('[data-sw]', root).innerHTML = cols.map((c) => `<div class="flex h-16 flex-1 items-end justify-center pb-1 font-mono text-[9px]" style="background:${c};color:${hexRgb(c).reduce((a, b) => a + b) > 380 ? '#000' : '#fff'}">${c.toUpperCase()}</div>`).join('');
        $('[data-bar]', root).innerHTML = `<div style="flex:60;background:${cols[0]}"></div><div style="flex:30;background:${cols[2]}"></div><div style="flex:10;background:${cols[1]}"></div>`;
        $('[data-desc]', root).textContent = t[2];
        $('[data-poster]', root).innerHTML = posterSVG(cols, 'Bloom');
      }
      const wheel = $('[data-wheel]', root); let down = false;
      const setFrom = (e) => { const r = wheel.getBoundingClientRect(); base = Math.round((Math.atan2(e.clientX - r.left - r.width / 2, -(e.clientY - r.top - r.height / 2)) * 180) / Math.PI + 360) % 360; draw(); };
      wheel.addEventListener('pointerdown', (e) => { down = true; wheel.setPointerCapture(e.pointerId); setFrom(e); });
      wheel.addEventListener('pointermove', (e) => down && setFrom(e));
      wheel.addEventListener('pointerup', () => (down = false));
      $('[data-type]', root).addEventListener('change', draw);
      draw();
    },

    /* Static mini poster from a palette: data-colors="bg,c1,c2,c3,ink" ----- */
    'poster'(root) {
      root.innerHTML = posterSVG(root.dataset.colors.split(',').map((s) => s.trim()), root.dataset.title || '');
    },

    /* Mushroom-house illustration in any pipeline stage / style ----------- */
    'mushroom'(root) { root.innerHTML = mushroomSVG(root.dataset.style || 'flat'); },

    /* Toggleable overlays: <svg>…<g data-ov="Rule of thirds">…</g></svg> --- */
    'overlay'(root) {
      const groups = $$('[data-ov]', root);
      const bar = el('div', { class: 'mb-3 flex flex-wrap gap-2 text-xs' });
      groups.forEach((g, i) => {
        const b = el('button', { type: 'button', class: 'chip' }, g.dataset.ov);
        const set = (on) => { g.style.display = on ? '' : 'none'; b.classList.toggle('!border-accent', on); b.classList.toggle('text-ink', on); b.setAttribute('aria-pressed', on); };
        b.addEventListener('click', () => set(g.style.display === 'none'));
        set(i === 0); bar.appendChild(b);
      });
      root.prepend(bar);
    },

    /* Type anatomy: guide lines measured from the real font ---------------- */
    'type-anatomy'(root) {
      const F = root.dataset.font || 'Fraunces', W = 600, base = 210, size = 150;
      root.innerHTML = `<svg viewBox="0 0 ${W} 300" class="w-full rounded-2xl border border-line bg-[#f4f1ea]" role="img" aria-label="Type anatomy: baseline, x-height, cap height, ascender and descender lines over the letters Hxbp.">
        <g data-lines font-family="Inter" font-size="12"></g>
        <text x="30" y="${base}" font-family="${F}" font-weight="600" font-size="${size}" fill="#1d1d1f">Hxbp</text></svg>`;
      function draw() {
        const c = document.createElement('canvas').getContext('2d'); c.font = `600 ${size}px "${F}"`;
        const m = (t) => c.measureText(t);
        const rows = [
          ['Ascender', base - m('b').actualBoundingBoxAscent, '#7c3aed'],
          ['Cap height', base - m('H').actualBoundingBoxAscent, '#e11d48'],
          ['x-height', base - m('x').actualBoundingBoxAscent, '#2f80ed'],
          ['Baseline', base, '#1d1d1f'],
          ['Descender', base + m('p').actualBoundingBoxDescent, '#f59e0b'],
        ];
        let y0 = -99;
        $('[data-lines]', root).innerHTML = rows.map(([n, y, col]) => {
          let ly = y + 4; if (Math.abs(ly - y0) < 14) ly = y0 + 14; y0 = ly;
          return `<line x1="20" y1="${y}" x2="440" y2="${y}" stroke="${col}" stroke-width="1.5" ${n === 'Baseline' ? '' : 'stroke-dasharray="5 4"'}/><text x="455" y="${ly}" fill="${col}" font-weight="600">${n}</text>`;
        }).join('');
      }
      draw(); if (document.fonts) document.fonts.ready.then(draw);
    },

    /* Spacing playground: size, tracking, leading -------------------------- */
    'type-spacing'(root) {
      const fonts = ['Inter', 'Fraunces', 'Playfair Display', 'Bebas Neue', 'Space Grotesk', 'Roboto Slab'];
      root.innerHTML = `
        <div class="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div class="space-y-4 text-sm">
            <label class="block text-ink-soft">Font<select data-f class="field mt-1">${fonts.map((f) => `<option>${f}</option>`).join('')}</select></label>
            ${[['s', 'Size', 14, 72, 34, 'px'], ['t', 'Tracking', -10, 40, 0, ''], ['l', 'Leading', 80, 200, 120, '%']].map(([k, n, mn, mx, v, u]) => `
              <label class="block text-ink-soft"><span class="flex justify-between"><span>${n}</span><span data-v="${k}" class="font-mono text-ink"></span></span>
              <input data-k="${k}" type="range" min="${mn}" max="${mx}" value="${v}" class="mt-1 w-full accent-[#2f80ed]" data-u="${u}"></label>`).join('')}
            <div class="flex flex-wrap gap-2 text-xs"><button type="button" data-p="tight" class="chip">Tight headline</button><button type="button" data-p="caps" class="chip">Spaced caps</button><button type="button" data-p="body" class="chip">Comfortable body</button></div>
          </div>
          <div data-out class="min-h-[220px] overflow-hidden rounded-2xl bg-[#f4f1ea] p-6 text-[#1d1d1f]"></div>
        </div>`;
      const g = (k) => $(`[data-k="${k}"]`, root);
      const presets = { tight: ['Fraunces', 64, -4, 95], caps: ['Space Grotesk', 22, 30, 140], body: ['Inter', 18, 0, 150] };
      function draw() {
        const f = $('[data-f]', root).value, s = +g('s').value, t = +g('t').value, l = +g('l').value;
        const caps = t > 15;
        $('[data-v="s"]', root).textContent = `${s}px`; $('[data-v="t"]', root).textContent = `${t > 0 ? '+' : ''}${t * 10}`; $('[data-v="l"]', root).textContent = `${l}%`;
        const o = $('[data-out]', root);
        o.style.fontFamily = `"${f}"`; o.style.fontSize = `${s}px`; o.style.letterSpacing = `${t / 100}em`; o.style.lineHeight = `${l / 100}`;
        o.style.textTransform = caps ? 'uppercase' : 'none';
        o.textContent = 'Every letter needs room to breathe, but not so much that words fall apart. Spacing is invisible when it is right.';
      }
      $$('[data-p]', root).forEach((b) => b.addEventListener('click', () => { const [f, s, t, l] = presets[b.dataset.p]; $('[data-f]', root).value = f; g('s').value = s; g('t').value = t; g('l').value = l; draw(); }));
      root.addEventListener('input', draw); draw();
    },

    /* Font pairing explorer ------------------------------------------------- */
    'font-pair'(root) {
      const pairs = [
        ['Fraunces', 'Inter', 1, 'Soft serif headline + neutral sans body. Editorial, warm, timeless.', 600],
        ['Bebas Neue', 'Inter', 1, 'Tall condensed caps + clean sans. Posters, sport, events.', 400],
        ['Playfair Display', 'Space Grotesk', 1, 'High-contrast serif + geometric sans. Fashion, luxury.', 700],
        ['Roboto Slab', 'Inter', 1, 'Sturdy slab + sans. Friendly, techy, readable.', 700],
        ['Pacifico', 'Space Grotesk', 1, 'One script used sparingly for a logo-like headline.', 400],
        ['Pacifico', 'Caveat', 0, 'Two decorative scripts fight each other. Nothing leads.', 400],
        ['Playfair Display', 'Fraunces', 0, 'Two similar serifs: not enough contrast, so it looks like a mistake.', 700],
      ];
      root.innerHTML = `<div class="mb-4 flex flex-wrap gap-2 text-xs">${pairs.map((p, i) => `<button type="button" data-i="${i}" class="chip">${p[2] ? '✓' : '✕'} ${p[0]} + ${p[1]}</button>`).join('')}</div>
        <div class="grid gap-4 md:grid-cols-[1.3fr_1fr]"><div data-card class="rounded-2xl bg-[#f4f1ea] p-6 text-[#1d1d1f] sm:p-8"></div><div data-note class="rounded-2xl border border-line bg-panel-2 p-5 text-sm"></div></div>`;
      function show(i) {
        const [h, b, ok, note, w] = pairs[i];
        $$('[data-i]', root).forEach((x) => x.classList.toggle('!border-accent', +x.dataset.i === i));
        $('[data-card]', root).innerHTML = `<p style="font-family:'${h}';font-weight:${w};font-size:44px;line-height:1.05">Night Market</p>
          <p class="mt-4" style="font-family:'${b}';font-size:16px;line-height:1.6">Street food, live music and handmade crafts under the lanterns. Every Saturday from 6 pm at the old harbour.</p>`;
        $('[data-note]', root).innerHTML = `<p class="font-semibold ${ok ? 'text-emerald-300' : 'text-rose-300'}">${ok ? '✓ Works' : '✕ Clashes'}</p><p class="mt-2 text-ink-soft">${note}</p>
          <p class="mt-4 text-xs text-ink-mute">Headline: <span class="text-ink">${h}</span><br>Body: <span class="text-ink">${b}</span></p>`;
      }
      $$('[data-i]', root).forEach((x) => x.addEventListener('click', () => show(+x.dataset.i)));
      show(0);
    },

    /* Brush-lettering pad: thin upstrokes, thick downstrokes ---------------- */
    'brush-letter'(root) {
      root.innerHTML = `
        <div class="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
          <label>Mode <select data-m class="field !mt-0 !inline-block !w-auto"><option value="dir">Brush pen (thick down, thin up)</option><option value="press">Pencil pressure</option><option value="mono">Monoline</option></select></label>
          <label class="flex items-center gap-2">Size <input data-s type="range" min="6" max="30" value="16" class="w-28 accent-[#2f80ed]"></label>
          <label class="flex items-center gap-2"><input data-g type="checkbox" checked class="accent-[#2f80ed]"> Guides</label>
          <button type="button" data-c class="chip">Clear</button>
        </div>
        <canvas class="mt-4 h-72 w-full touch-none rounded-2xl border border-line bg-[#f4f1ea]" aria-label="Lettering practice pad"></canvas>
        <p class="cap">Write a word in cursive. Strokes going <b class="text-ink">down</b> get thick and strokes going <b class="text-ink">up</b> get thin, just like a brush pen.</p>`;
      const cv = $('canvas', root), ctx = cv.getContext('2d'); let W = 0, H = 0, last = null, w = 4;
      function guides() {
        ctx.clearRect(0, 0, W, H); if (!$('[data-g]', root).checked) return;
        ctx.lineWidth = 1;
        [[0.22, '#7c3aed55'], [0.42, '#2f80ed88'], [0.72, '#1d1d1f88'], [0.9, '#f59e0b55']].forEach(([f, c]) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(0, H * f); ctx.lineTo(W, H * f); ctx.stroke(); });
        ctx.strokeStyle = '#2f80ed22'; for (let x = -H; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + H * Math.tan((35 * Math.PI) / 180), 0); ctx.stroke(); }
      }
      function fit() { const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1; W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); ctx.lineCap = ctx.lineJoin = 'round'; guides(); }
      const loc = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pressure || 0.5 }; };
      cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); last = loc(e); w = +$('[data-s]', root).value * 0.3; });
      cv.addEventListener('pointermove', (e) => {
        if (!last) return; const max = +$('[data-s]', root).value, min = Math.max(1.5, max * 0.15), mode = $('[data-m]', root).value;
        for (const ev of (e.getCoalescedEvents ? e.getCoalescedEvents() : [e])) {
          const p = loc(ev), dx = p.x - last.x, dy = p.y - last.y, len = Math.hypot(dx, dy); if (len < 0.5) continue;
          let target = mode === 'mono' ? max * 0.35 : mode === 'press' ? min + (max - min) * p.p : min + (max - min) * Math.min(1, Math.max(0, (dy / len + 0.15) / 1.0));
          w += (target - w) * 0.25;
          ctx.strokeStyle = '#1d1d1f'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p;
        }
      });
      const up = () => (last = null); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      $('[data-c]', root).addEventListener('click', guides); $('[data-g]', root).addEventListener('change', guides);
      fit(); window.addEventListener('resize', fit);
    },

    /* Viewing-distance test: <div data-widget="distance"><div data-p>svg</div>…</div> */
    'distance'(root) {
      const items = $$('[data-p]', root);
      const bar = el('label', { class: 'mb-4 flex flex-wrap items-center gap-3 text-sm text-ink-soft' },
        'Viewing distance <input data-d type="range" min="1" max="12" value="1" class="w-48 accent-[#2f80ed]"><span data-dv class="font-mono text-ink">0.5 m</span>');
      root.prepend(bar);
      items.forEach((p) => { p.style.transition = 'transform .15s, filter .15s'; p.style.transformOrigin = 'center top'; });
      const d = $('[data-d]', root);
      const set = () => { const v = +d.value; items.forEach((p) => { p.style.transform = `scale(${1 / (1 + (v - 1) * 0.35)})`; p.style.filter = `blur(${(v - 1) * 0.35}px)`; }); $('[data-dv]', root).textContent = `${(v * 0.5).toFixed(1)} m`; };
      d.addEventListener('input', set); set();
    },

    /* Flipbook with onion skin -------------------------------------------- */
    'flipbook'(root) {
      // bouncing ball: [x, y, scaleX, scaleY]
      const F = [[40, 30, 1, 1], [70, 45, 0.95, 1.08], [100, 80, 0.9, 1.15], [130, 130, 0.88, 1.2], [160, 168, 1.35, 0.7], [190, 130, 0.88, 1.2], [220, 80, 0.9, 1.15], [250, 45, 0.95, 1.08], [280, 30, 1, 1]];
      root.innerHTML = `
        <div class="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
          <button type="button" data-play class="chip !border-accent text-ink">❚❚ Pause</button>
          <label class="flex items-center gap-2">FPS <input data-fps type="range" min="1" max="24" value="8" class="w-28 accent-[#2f80ed]"><span data-fv class="w-6 font-mono text-ink">8</span></label>
          <label class="flex items-center gap-2"><input data-on type="checkbox" class="accent-[#2f80ed]"> Onion skin</label>
          <select data-mode class="field !mt-0 !inline-block !w-auto"><option value="loop">Loop</option><option value="ping">Ping-Pong</option><option value="once">One Shot</option></select>
        </div>
        <svg viewBox="0 0 320 200" class="mx-auto mt-4 block w-full max-w-2xl rounded-2xl border border-line bg-[#f4f1ea]"><line x1="0" y1="190" x2="320" y2="190" stroke="#1d1d1f" stroke-width="2"/><g data-onion></g><g data-ball></g></svg>
        <div data-strip class="mx-auto mt-3 flex max-w-2xl gap-1 overflow-x-auto"></div>`;
      const ball = (f, col, op) => `<ellipse cx="${f[0]}" cy="${f[1] + 12 * (1 - f[3])}" rx="${12 * f[2]}" ry="${12 * f[3]}" fill="${col}" opacity="${op}"/>`;
      $('[data-strip]', root).innerHTML = F.map((f, i) => `<button type="button" data-fr="${i}" class="grid h-12 w-14 shrink-0 place-items-center rounded-lg border border-line bg-panel-2 font-mono text-xs text-ink-mute">${i + 1}</button>`).join('');
      let i = 0, dir = 1, playing = true, timer = null;
      function render() {
        $('[data-ball]', root).innerHTML = ball(F[i], '#e11d48', 1);
        $('[data-onion]', root).innerHTML = $('[data-on]', root).checked
          ? [[-2, '#ef4444', .15], [-1, '#ef4444', .3], [1, '#22c55e', .3], [2, '#22c55e', .15]].map(([o, c, a]) => F[i + o] ? ball(F[i + o], c, a) : '').join('') : '';
        $$('[data-fr]', root).forEach((b) => { const on = +b.dataset.fr === i; b.classList.toggle('!border-accent', on); b.classList.toggle('text-ink', on); });
      }
      function step() {
        const mode = $('[data-mode]', root).value;
        if (mode === 'ping') { if (i + dir < 0 || i + dir >= F.length) dir = -dir; i += dir; }
        else if (mode === 'once') { if (i < F.length - 1) i++; else { toggle(false); } }
        else i = (i + 1) % F.length;
        render();
      }
      function schedule() { clearInterval(timer); if (playing) timer = setInterval(step, 1000 / +$('[data-fps]', root).value); }
      function toggle(p = !playing) { playing = p; if (p && $('[data-mode]', root).value === 'once' && i === F.length - 1) i = 0; $('[data-play]', root).textContent = playing ? '❚❚ Pause' : '▶ Play'; schedule(); }
      $('[data-play]', root).addEventListener('click', () => toggle());
      $('[data-fps]', root).addEventListener('input', (e) => { $('[data-fv]', root).textContent = e.target.value; schedule(); });
      $('[data-on]', root).addEventListener('change', render);
      $('[data-mode]', root).addEventListener('change', () => { dir = 1; });
      $$('[data-fr]', root).forEach((b) => b.addEventListener('click', () => { toggle(false); i = +b.dataset.fr; render(); }));
      // pause when off-screen to save battery
      new IntersectionObserver(([e]) => { if (!e.isIntersecting) clearInterval(timer); else schedule(); }).observe(root);
      render(); schedule();
    },

    /* Custom brush stroke previews: data-kind = stipple|foliage|ribbon|rake|chalk|stamp */
    'recipe'(root) {
      const kind = root.dataset.kind; let seed = 11; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const P = (t) => [20 + t * 260, 40 + Math.sin(t * Math.PI * 2) * 18];
      const ang = (t) => { const a = P(t), b = P(Math.min(1, t + 0.01)); return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; };
      let out = '';
      if (kind === 'stipple') for (let k = 0; k < 220; k++) { const t = r(), [x, y] = P(t); out += `<circle cx="${(x + (r() - .5) * 26).toFixed(1)}" cy="${(y + (r() - .5) * 26).toFixed(1)}" r="${(0.6 + r() * 1.4).toFixed(1)}" fill="#1d1d1f"/>`; }
      if (kind === 'foliage') for (let k = 0; k < 34; k++) { const t = k / 33, [x, y] = P(t); out += `<path d="M0 0 Q5 -9 0 -18 Q-5 -9 0 0Z" fill="${['#15803d', '#22c55e', '#65a30d'][k % 3]}" transform="translate(${(x + (r() - .5) * 18).toFixed(1)} ${(y + (r() - .5) * 18).toFixed(1)}) rotate(${(r() * 360).toFixed(0)}) scale(${(0.7 + r() * 0.6).toFixed(2)})"/>`; }
      if (kind === 'ribbon') for (let k = 0; k <= 24; k++) { const t = k / 24, [x, y] = P(t); out += `<path d="M-5 -8 L3 0 L-5 8" stroke="${k % 2 ? '#e11d48' : '#2f80ed'}" stroke-width="3" fill="none" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang(t).toFixed(0)})"/>`; }
      if (kind === 'rake') for (let k = -4; k <= 4; k++) out += `<path d="${Array.from({ length: 41 }, (_, j) => { const [x, y] = P(j / 40); return `${j ? 'L' : 'M'}${x.toFixed(1)} ${(y + k * 3).toFixed(1)}`; }).join('')}" stroke="#7c2d12" stroke-width="${(0.6 + r()).toFixed(1)}" fill="none" opacity="${(0.5 + r() * 0.5).toFixed(2)}"/>`;
      if (kind === 'chalk') out = `<path d="${Array.from({ length: 41 }, (_, j) => { const [x, y] = P(j / 40); return `${j ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join('')}" stroke="#f4f1ea" stroke-width="16" fill="none" stroke-linecap="round" filter="url(#f-grain)"/>`;
      if (kind === 'stamp') [[70, 40], [150, 30], [230, 45]].forEach(([x, y], k) => { out += `<g transform="translate(${x} ${y}) rotate(${k * 12})"><path d="${Array.from({ length: 10 }, (_, i) => { const rr = i % 2 ? 7 : 18, a = (Math.PI / 5) * i - Math.PI / 2; return `${i ? 'L' : 'M'}${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)}`; }).join('')}Z" fill="#f59e0b"/></g>`; });
      root.innerHTML = `<svg viewBox="0 0 300 80" class="block w-full" style="background:${kind === 'chalk' ? '#1f3b2d' : '#f4f1ea'}">${out}</svg>`;
    },

    /* Commission quote calculator (example multipliers) --------------------- */
    'quote'(root) {
      root.innerHTML = `
        <div class="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <label class="text-ink-soft">Currency<select data-k="cur" class="field mt-1"><option>₹</option><option>$</option><option>€</option><option>£</option></select></label>
            <label class="text-ink-soft">Hourly rate<input data-k="rate" type="number" min="0" value="800" class="field mt-1"></label>
            <label class="text-ink-soft">Hours<input data-k="hrs" type="number" min="0" step="0.5" value="10" class="field mt-1"></label>
            <label class="text-ink-soft">Extra revisions<input data-k="rev" type="number" min="0" value="0" class="field mt-1"></label>
            <label class="col-span-2 text-ink-soft">Usage<select data-k="use" class="field mt-1">
              <option value="1">Personal (gift, wall art) · ×1</option><option value="1.5">Small business / social media · ×1.5</option><option value="2">Commercial (ads, packaging) · ×2</option><option value="3">Exclusive / buyout · ×3</option></select></label>
            <label class="col-span-2 flex items-center gap-2 text-ink-soft"><input data-k="rush" type="checkbox" class="accent-[#2f80ed]"> Rush (under 1 week) · ×1.25</label>
          </div>
          <div class="rounded-2xl border border-line bg-canvas/70 p-5">
            <p class="text-xs uppercase tracking-widest text-ink-mute">Estimate</p>
            <p data-total class="mt-1 font-mono text-4xl text-ink"></p>
            <div data-bars class="mt-4 space-y-2 text-xs"></div>
            <p data-dep class="mt-4 text-sm text-ink-soft"></p>
          </div>
        </div>
        <p class="cap">Example multipliers only. Research rates in your market and set your own. Not legal or financial advice.</p>`;
      const v = (k) => $(`[data-k="${k}"]`, root);
      function calc() {
        const c = v('cur').value, rate = +v('rate').value || 0, hrs = +v('hrs').value || 0, rev = +v('rev').value || 0, use = +v('use').value, rush = v('rush').checked ? 1.25 : 1;
        const labour = rate * hrs, revisions = rev * rate * 1.5, base = labour + revisions, usage = base * (use - 1), rushAmt = (base + usage) * (rush - 1), total = base + usage + rushAmt;
        const f = (n) => c + Math.round(n).toLocaleString();
        v('cur'); $('[data-total]', root).textContent = f(total);
        const rows = [['Labour', labour, '#2f80ed'], ['Extra revisions', revisions, '#a855f7'], ['Usage rights', usage, '#f59e0b'], ['Rush', rushAmt, '#e11d48']];
        $('[data-bars]', root).innerHTML = rows.map(([n, a, col]) => `<div><div class="flex justify-between text-ink-soft"><span>${n}</span><span class="font-mono">${f(a)}</span></div><div class="mt-1 h-2 rounded-full bg-panel-2"><div class="h-2 rounded-full" style="width:${total ? (a / total) * 100 : 0}%;background:${col}"></div></div></div>`).join('');
        $('[data-dep]', root).innerHTML = `50% deposit before starting: <b class="text-ink">${f(total / 2)}</b>`;
      }
      root.addEventListener('input', calc); root.addEventListener('change', calc); calc();
    },

    /* Hero: mushroom cycling through the illustration pipeline ------------ */
    'hero-cycle'(root) {
      const stages = [['thumb', 'thumbnail'], ['sketch', 'sketch'], ['lines', 'line art'], ['flats', 'flats'], ['cel', 'shading'], ['final', 'final ✨']];
      root.classList.add('relative');
      root.innerHTML = stages.map(([s], i) => `<div data-st="${i}" class="${i ? 'absolute inset-0 ' : ''}transition-opacity duration-700" style="opacity:${i === stages.length - 1 ? 1 : 0}">${mushroomSVG(s)}</div>`).join('')
        + '<span data-lbl class="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-2.5 py-1 font-mono text-[10px] text-white"></span>';
      let i = stages.length - 1, timer = null;
      const show = () => { $$('[data-st]', root).forEach((n) => (n.style.opacity = +n.dataset.st === i ? 1 : 0)); $('[data-lbl]', root).textContent = `${i + 1}/6 · ${stages[i][1]}`; };
      show();
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const run = () => { clearInterval(timer); timer = setInterval(() => { i = (i + 1) % stages.length; show(); }, 1300); };
      new IntersectionObserver(([e]) => (e.isIntersecting ? run() : clearInterval(timer))).observe(root);
    },
  };

  function mountWidgets() {
    $$('[data-widget]').forEach((node) => {
      const fn = WIDGETS[node.dataset.widget];
      if (fn && !node.dataset.mounted) { node.dataset.mounted = '1'; try { fn(node); } catch (err) { console.error('[widget]', node.dataset.widget, err); } }
    });
  }


  /* Wide diagrams stay readable on phones: keep a min width and let the card scroll sideways */
  function readableWideFigures() {
    $$('.figure > svg[viewBox]').forEach((svg) => {
      const [, , w, h] = svg.getAttribute('viewBox').split(/[\s,]+/).map(Number);
      if (w >= 600 && w / h >= 2.2) { svg.classList.add('wide-svg'); svg.parentElement.classList.add('figure-scroll'); }
    });
  }

  /* Tabs (used for small comparison panels in content) */
  function tabs() {
    $$('[data-tabs]').forEach((group) => {
      const btns = $$('[data-tab]', group), panes = $$('[data-pane]', group);
      const show = (k) => { btns.forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === k)); panes.forEach((p) => p.classList.toggle('hidden', p.dataset.pane !== k)); };
      btns.forEach((b) => b.addEventListener('click', () => show(b.dataset.tab)));
      if (btns[0]) show(btns[0].dataset.tab);
    });
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  function boot() {
    Store.load();
    buildNav($('#nav-desktop'));
    buildNav($('#nav-mobile'));
    moduleGrid();
    jumpTo();
    injectCompleteButtons();
    mountWidgets();
    readableWideFigures();
    tabs();
    renderProgress();
    scrollSpy();
    readingBar();
    drawer();
    $$('[data-reset]').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.armed) { Store.reset(); renderProgress(); b.textContent = 'Progress reset'; delete b.dataset.armed; setTimeout(() => (b.textContent = 'Reset progress'), 1500); }
      else { b.dataset.armed = '1'; b.textContent = 'Tap again to confirm'; setTimeout(() => { delete b.dataset.armed; b.textContent = 'Reset progress'; }, 3000); }
    }));
    const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  // Expose for follow-up modules / debugging
  window.Masterclass = { CURRICULUM, WIDGETS, Store };
})();
