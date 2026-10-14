/* TPFX Garage – script.js */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const pad = n => String(n).padStart(2, '0');

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer  = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* =========================================================
     1. LOADER
     ========================================================= */
  const loader = $('#loader');
  const loaderCount = $('#loaderCount');
  const loaderBar = $('#loaderBar');
  let pageLoaded = document.readyState === 'complete';
  let loaderDone = false;
  addEventListener('load', () => { pageLoaded = true; });
  setTimeout(() => { pageLoaded = true; }, 6000);

  function finishLoader() {
    if (loaderDone) return;
    loaderDone = true;
    root.classList.add('loaded');
    root.classList.remove('lock');
    loader.classList.add('done');
    setTimeout(() => loader.remove(), 1300);
  }

  (function loaderTick() {
    const t0 = performance.now();
    const DUR = reduceMotion ? 1 : 1300;
    (function tick(now) {
      const t = clamp((now - t0) / DUR, 0, 1);
      let v = (1 - Math.pow(1 - t, 3)) * 100;
      if (!pageLoaded) v = Math.min(v, 92);
      loaderCount.textContent = String(Math.floor(v)).padStart(2, '0');
      loaderBar.style.transform = `scaleX(${v / 100})`;
      if (v >= 100) { setTimeout(finishLoader, 150); return; }
      requestAnimationFrame(tick);
    })(t0);
  })();

  /* =========================================================
     2. Hero-Buchstaben splitten
     ========================================================= */
  let charIndex = 0;
  $$('[data-split]').forEach(el => {
    const text = el.textContent.trim();
    el.textContent = '';
    el.setAttribute('aria-hidden', 'true');
    [...text].forEach(c => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.style.setProperty('--i', charIndex++);
      s.textContent = c;
      el.appendChild(s);
    });
  });

  /* =========================================================
     3. Cursor
     ========================================================= */
  const cursor = $('#cursor');
  if (finePointer && !reduceMotion) {
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; cursor.classList.add('on'); }, { passive: true });
    document.addEventListener('pointerover', e => {
      cursor.classList.toggle('big', !!e.target.closest('a, button, .lb, [data-cmp], .hs__bar, .hs__viewport'));
    });
    document.addEventListener('mouseleave', () => cursor.classList.remove('on'));
    (function loop() {
      cx = lerp(cx, x, 0.2); cy = lerp(cy, y, 0.2);
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    })();
  } else if (cursor) {
    cursor.remove();
  }

  /* =========================================================
     4. Mobile-Menü
     ========================================================= */
  const nav = $('#nav');
  const burger = $('#burger');
  const menu = $('#menu');
  let menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    burger.classList.toggle('open', open);
    menu.classList.toggle('open', open);
    root.classList.toggle('lock', open);
    burger.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    if (open) nav.classList.remove('is-hidden');
  }
  burger.addEventListener('click', () => setMenu(!menuOpen));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* =========================================================
     5. Reveal-Animationen
     ========================================================= */
  $$('[data-stagger]').forEach(p => {
    Array.from(p.children).forEach((c, i) => c.style.setProperty('--d', (i * 0.12).toFixed(2) + 's'));
  });

  const revealEls = $$('.reveal, .clip');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('in'));
  } else {
    const revealIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => revealIO.observe(el));
  }

  // Zähler
  const stats = $('#stats');
  function countUp(el) {
    const end = +el.dataset.count;
    const pad = +(el.dataset.pad || 0);
    const t0 = performance.now(), dur = 1400;
    (function step(now) {
      const t = clamp((now - t0) / dur, 0, 1);
      const v = Math.round(end * (1 - Math.pow(1 - t, 4)));
      el.textContent = pad ? String(v).padStart(pad, '0') : String(v);
      if (t < 1) requestAnimationFrame(step);
    })(t0);
  }
  if (stats && !reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      if (es[0].isIntersecting) { $$('[data-count]', stats).forEach(countUp); io.disconnect(); }
    }, { threshold: 0.5 });
    io.observe(stats);
  }

  // Wort-für-Wort-Highlight
  const wordBlocks = $$('[data-words]').map(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    const spans = words.map(w => {
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w + ' ';
      el.appendChild(s);
      return s;
    });
    return { el, spans, lit: -1 };
  });
  function wordsUpdate() {
    wordBlocks.forEach(b => {
      const r = b.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = reduceMotion ? 1 : clamp((innerHeight * 0.9 - r.top) / (innerHeight * 0.5), 0, 1);
      const lit = Math.round(p * b.spans.length);
      if (lit === b.lit) return;
      b.lit = lit;
      b.spans.forEach((s, i) => s.classList.toggle('on', i < lit));
    });
  }

  // Parallax für Bilder
  const parallaxEls = $$('[data-parallax]');
  function parallaxUpdate() {
    if (reduceMotion) return;
    parallaxEls.forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const c = r.top + r.height / 2 - innerHeight / 2;
      img.style.transform = `translate3d(0, ${(c * -0.06).toFixed(1)}px, 0)`;
    });
  }

  /* =========================================================
     6. Marquees (Text-Bänder + Bilderkette)
     ========================================================= */
  let vel = 0;
  const mqVisible = new Map();
  const mqIO = 'IntersectionObserver' in window
    ? new IntersectionObserver(es => es.forEach(e => mqVisible.set(e.target, e.isIntersecting)))
    : null;

  const marquees = $$('[data-mq]').map(el => {
    const m = {
      el, track: $('.mq__track', el),
      speed: parseFloat(el.dataset.speed || '1'),
      dir: parseFloat(el.dataset.dir || '-1'),
      x: 0, w: 0, k: 1, hover: false,
    };
    m.always = el.hasAttribute('data-always'); // läuft immer durch, auch bei reduzierter Bewegung
    m.build = () => {
      const groups = $$('.mq__group', m.track);
      groups.slice(1).forEach(g => g.remove());
      const first = groups[0];
      m.w = first.getBoundingClientRect().width;
      if (!m.w) return;
      const need = Math.ceil(el.clientWidth / m.w) + 1;
      for (let i = 0; i < need; i++) {
        const c = first.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        $$('.lb', c).forEach(n => n.setAttribute('data-clone', ''));
        m.track.appendChild(c);
      }
    };
    m.step = dt => {
      if (!m.w || (reduceMotion && !m.always) || mqVisible.get(el) === false) return;
      const boost = m.always ? 0 : Math.abs(vel) * 0.35;
      m.x += m.dir * (m.speed + boost) * dt;
      m.x %= m.w;
      if (m.x > 0) m.x -= m.w;
      m.track.style.transform = `translate3d(${m.x}px, 0, 0)`;
    };
    if (mqIO) mqIO.observe(el);
    return m;
  });
  const buildMarquees = () => marquees.forEach(m => { if (!reduceMotion || m.always) m.build(); });
  buildMarquees();

  /* =========================================================
     7. Projekt-Reihe: Pfeile, Scrollbar, Ziehen, Shift+Scroll
     ========================================================= */
  $$('[data-hs]').forEach(block => {
    const vp = $('.hs__viewport', block);
    const cards = $$('.hcard', block);
    const bar = $('.hs__bar', block);
    const thumb = $('[data-hs-thumb]', block);
    const now = $('[data-hs-now]', block);
    const prev = $('[data-hs-prev]', block);
    const next = $('[data-hs-next]', block);
    $('[data-hs-total]', block).textContent = pad(cards.length);

    const max = () => Math.max(0, vp.scrollWidth - vp.clientWidth);
    const step = () => (cards[0] ? cards[0].getBoundingClientRect().width : 300) + 24;

    function ui() {
      const m = max();
      const ratio = m > 0 ? vp.clientWidth / vp.scrollWidth : 1;
      const bw = bar.clientWidth;
      const tw = Math.max(56, bw * ratio);
      const p = m > 0 ? vp.scrollLeft / m : 0;
      thumb.style.width = tw + 'px';
      thumb.style.transform = `translate3d(${(p * (bw - tw)).toFixed(1)}px, 0, 0)`;
      now.textContent = pad(Math.round(p * (cards.length - 1)) + 1);
      prev.disabled = vp.scrollLeft <= 2;
      next.disabled = vp.scrollLeft >= m - 2;
    }
    const by = d => vp.scrollBy({ left: d, behavior: reduceMotion ? 'auto' : 'smooth' });
    prev.addEventListener('click', () => by(-step()));
    next.addEventListener('click', () => by(step()));
    vp.addEventListener('scroll', ui, { passive: true });

    // Tastatur
    vp.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); by(step()); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); by(-step()); }
      else if (e.key === 'Home') { e.preventDefault(); vp.scrollTo({ left: 0, behavior: 'smooth' }); }
      else if (e.key === 'End') { e.preventDefault(); vp.scrollTo({ left: max(), behavior: 'smooth' }); }
    });

    // Mausrad: Shift+Scroll wird nativ unterstützt; zusätzlich Trackpad-Seitwärts-Gesten.
    // Normales vertikales Scrollen bleibt bewusst unangetastet.

    // Ziehen mit der Maus
    let down = null, moved = false;
    vp.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = { x: e.clientX, left: vp.scrollLeft }; moved = false;
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - down.x;
      if (!moved && Math.abs(dx) > 5) { moved = true; vp.classList.add('drag'); }
      if (moved) vp.scrollLeft = down.left - dx;
    });
    const endDrag = () => { if (!down) return; down = null; vp.classList.remove('drag'); };
    addEventListener('pointerup', endDrag);
    addEventListener('pointercancel', endDrag);
    vp.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);

    // Scrollbar ziehen / anklicken
    let bd = null;
    bar.addEventListener('pointerdown', e => {
      e.preventDefault();
      const tr = thumb.getBoundingClientRect();
      const onThumb = e.clientX >= tr.left && e.clientX <= tr.right;
      const off = onThumb ? e.clientX - tr.left : tr.width / 2;
      bd = { off };
      bar.classList.add('drag');
      bar.setPointerCapture(e.pointerId);
      seek(e.clientX);
    });
    function seek(cx) {
      const r = bar.getBoundingClientRect(), tw = thumb.offsetWidth;
      const p = clamp((cx - r.left - bd.off) / Math.max(1, r.width - tw), 0, 1);
      vp.scrollLeft = p * max();
    }
    bar.addEventListener('pointermove', e => { if (bd) seek(e.clientX); });
    const bEnd = () => { bd = null; bar.classList.remove('drag'); };
    bar.addEventListener('pointerup', bEnd);
    bar.addEventListener('pointercancel', bEnd);

    addEventListener('resize', ui);
    addEventListener('load', ui);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ui);
    ui();
  });

  /* =========================================================
     7b. Vorher / Nachher-Slider
     ========================================================= */
  $$('[data-cmp]').forEach(el => {
    let drag = false;
    const set = p => {
      p = clamp(p, 0, 100);
      el.style.setProperty('--p', p + '%');
      el.setAttribute('aria-valuenow', String(Math.round(p)));
      el._p = p;
    };
    const fromX = x => { const r = el.getBoundingClientRect(); set(((x - r.left) / r.width) * 100); };
    set(50);
    el.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = true; el.classList.add('drag'); el.setPointerCapture(e.pointerId); fromX(e.clientX);
    });
    el.addEventListener('pointermove', e => { if (drag) { fromX(e.clientX); } });
    const end = () => { drag = false; el.classList.remove('drag'); };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('keydown', e => {
      const d = e.shiftKey ? 20 : 5;
      if (e.key === 'ArrowLeft') { e.preventDefault(); set(el._p - d); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); set(el._p + d); }
      else if (e.key === 'Home') { e.preventDefault(); set(0); }
      else if (e.key === 'End') { e.preventDefault(); set(100); }
    });
  });

  /* =========================================================
     8. Merch-Karten (Tilt)
     ========================================================= */
  $$('.product__media').forEach(media => {
    if (!finePointer) return;
    media.addEventListener('pointerleave', () => { media.style.transform = ''; });
    media.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || reduceMotion) return;
      const r = media.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      media.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      media.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      media.style.transform = `rotateY(${((x - 0.5) * 10).toFixed(2)}deg) rotateX(${((0.5 - y) * 10).toFixed(2)}deg)`;
    });
  });

  /* =========================================================
     9. Lightbox
     ========================================================= */
  const lbEl = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbCnt = $('#lbCnt');
  const lbStage = $('#lbStage');
  let lbItems = [], lbIdx = 0, lbFocus = null;
  const pad2 = n => String(n).padStart(2, '0');

  function lbRender() {
    const it = lbItems[lbIdx];
    lbImg.src = it.src;
    lbImg.alt = it.alt;
    lbCap.textContent = it.alt;
    lbCnt.textContent = lbItems.length > 1 ? `${pad2(lbIdx + 1)} / ${pad2(lbItems.length)}` : '';
    lbEl.classList.toggle('single', lbItems.length < 2);
    lbImg.classList.remove('pop'); void lbImg.offsetWidth; lbImg.classList.add('pop');
  }
  function lbOpen(items, i) {
    lbItems = items; lbIdx = i;
    lbFocus = document.activeElement;
    lbRender();
    lbEl.classList.add('open');
    lbEl.setAttribute('aria-hidden', 'false');
    root.classList.add('lock');
    $('#lbClose').focus({ preventScroll: true });
  }
  function lbClose() {
    lbEl.classList.remove('open');
    lbEl.setAttribute('aria-hidden', 'true');
    root.classList.remove('lock');
    if (lbFocus && lbFocus.focus) lbFocus.focus({ preventScroll: true });
    setTimeout(() => { if (!lbEl.classList.contains('open')) lbImg.removeAttribute('src'); }, 300);
  }
  function lbStep(d) {
    if (lbItems.length < 2) return;
    lbIdx = (lbIdx + d + lbItems.length) % lbItems.length;
    lbRender();
  }
  const toItem = n => ({ src: n.getAttribute('src'), alt: n.alt || '' });

  document.addEventListener('click', e => {
    const t = e.target.closest('.lb');
    if (t) {
      e.preventDefault();
      const all = $$(`.lb[data-group="${t.dataset.group}"]:not([data-clone])`);
      const idx = Math.max(0, all.findIndex(n => n.getAttribute('src') === t.getAttribute('src')));
      lbOpen(all.map(toItem), idx);
    }
  });

  $$('[data-lb-close]').forEach(el => el.addEventListener('click', lbClose));
  $('#lbPrev').addEventListener('click', () => lbStep(-1));
  $('#lbNext').addEventListener('click', () => lbStep(1));

  document.addEventListener('keydown', e => {
    if (!lbEl.classList.contains('open')) return;
    if (e.key === 'Escape') lbClose();
    else if (e.key === 'ArrowLeft') lbStep(-1);
    else if (e.key === 'ArrowRight') lbStep(1);
  });

  let swipeX = null;
  lbStage.addEventListener('pointerdown', e => { swipeX = e.clientX; });
  lbStage.addEventListener('pointerup', e => {
    if (swipeX === null) return;
    const dx = e.clientX - swipeX;
    swipeX = null;
    if (Math.abs(dx) > 50) lbStep(dx < 0 ? 1 : -1);
  });
  lbStage.addEventListener('pointercancel', () => { swipeX = null; });

  /* =========================================================
     10. Haupt-Loop
     ========================================================= */
  const sbar = $('#scrollBar');
  const hero = $('.hero');
  let lastY = scrollY, prevT = performance.now();
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };

  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  function frame(now) {
    const dt = clamp((now - prevT) / 16.67, 0.2, 3);
    prevT = now;

    const y = scrollY;
    const dy = y - lastY;
    lastY = y;
    vel = lerp(vel, dy, 0.12);

    const max = root.scrollHeight - innerHeight;
    sbar.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;

    nav.classList.toggle('is-solid', y > 40);
    if (!menuOpen) {
      if (y < 200) nav.classList.remove('is-hidden');
      else if (dy > 3) nav.classList.add('is-hidden');
      else if (dy < -3) nav.classList.remove('is-hidden');
    }

    if (!reduceMotion && y < innerHeight * 1.2) {
      pointer.sx = lerp(pointer.sx, pointer.x, 0.06);
      pointer.sy = lerp(pointer.sy, pointer.y, 0.06);
      hero.style.setProperty('--px', pointer.sx.toFixed(3));
      hero.style.setProperty('--py', pointer.sy.toFixed(3));
    }

    marquees.forEach(m => m.step(dt));
    wordsUpdate();
    parallaxUpdate();
    requestAnimationFrame(frame);
  }

  /* =========================================================
     11. Resize / Fonts
     ========================================================= */
  function relayout() { buildMarquees(); }
  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(relayout, 150); });
  addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

  requestAnimationFrame(frame);
})();
