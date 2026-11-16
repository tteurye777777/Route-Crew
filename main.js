/* ROUTE CREW — interactions
   - reveal on scroll (one fade-up, once)
   - right-side progress dots
   - Home: auto-advancing highlights
   - Feature flow players: screens play in the order the app is used (from the Figma prototype)
   - Crew check-in run: 3→2→1 countdown, then live recording
   - copy HEX in the design system */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);

  /* run a callback only while an element is on screen */
  const whenVisible = (el, onShow, onHide, threshold = 0.35) => {
    if (!('IntersectionObserver' in window)) { onShow(); return; }
    new IntersectionObserver(([e]) => (e.isIntersecting ? onShow() : onHide && onHide()), { threshold }).observe(el);
  };

  /* ---------- reveal ---------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- copy HEX ---------- */
  const toast = $('#toast');
  let toastTimer;
  $$('[data-hex]').forEach((btn) => btn.addEventListener('click', () => {
    const hex = btn.dataset.hex;
    try { navigator.clipboard && navigator.clipboard.writeText(hex).catch(() => {}); } catch (e) { /* ignore */ }
    toast.querySelector('i').style.background = hex;
    toast.querySelector('span').textContent = `${hex} 복사됨`;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 1500);
  }));

  /* ---------- progress dots (right) ---------- */
  const dotsNav = $('#dots');
  const sections = $$('[data-cp]');
  const dots = sections.map((sec) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<span>${sec.dataset.cp}</span>`;
    b.setAttribute('aria-label', `${sec.dataset.cp}(으)로 이동`);
    b.addEventListener('click', () => window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY, behavior: reduce ? 'auto' : 'smooth' }));
    dotsNav.appendChild(b);
    return b;
  });
  const updateDots = () => {
    const mid = window.innerHeight * 0.4;
    let cur = 0;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top <= mid) cur = i; });
    dots.forEach((d, i) => { d.classList.toggle('is-current', i === cur); if (i === cur) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
  };
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { updateDots(); ticking = false; });
  }, { passive: true });
  updateDots();

  /* ---------- Home: auto-advancing highlights ---------- */
  $$('[data-stepper]').forEach((root) => {
    const items = $$('.step-item', root);
    const phones = $$('.phone', root);
    const row = phones[0] && phones[0].parentElement;
    const duration = Number(root.dataset.duration) || 2400;
    let index = 0; let timer = 0; let visible = false;
    const go = (i) => {
      index = (i + items.length) % items.length;
      const targets = (items[index].dataset.targets || '').split(',').map(Number);
      items.forEach((it, k) => { it.classList.toggle('is-active', k === index); it.setAttribute('aria-selected', String(k === index)); });
      phones.forEach((p, k) => p.classList.toggle('is-active', targets.includes(k)));
      if (row && row.scrollWidth > row.clientWidth + 4 && visible) {
        row.scrollTo({ left: phones[targets[0]].offsetLeft - row.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
      }
      clearTimeout(timer);
      if (!reduce && visible) timer = setTimeout(() => go(index + 1), duration);
    };
    items.forEach((it, k) => it.addEventListener('click', () => go(k)));
    whenVisible(root, () => { if (visible) return; visible = true; root.classList.add('stepper-on'); go(index); }, () => { visible = false; clearTimeout(timer); });
  });

  /* ---------- Feature flow players ----------
     Each screen = fixed top bar + scrolling body + fixed bottom bar, like the real app.
     SCREENS: [image height, top bar, bottom bar] in screen-image px (width 402).
     frame: { s, step, dur?, scroll?, tap?: [x, y] px, stay? (same screen, e.g. a pin appears), sheet?: sheet top px } */
  // both chat rooms share one input bar (quick status buttons + message field), pinned at the same spot
  const CHAT_BAR = { src: 'assets/img/flow/chat-bar.png', h: 136 };
  // screens whose status bar sits over a photo, a map or a dimmed sheet: transparent, icons only
  const CLEAR = new Set(['wf/regular-detail', 'wf/regular-joined', 'wf/popup-detail', 'flow/popup-apply', 'flow/popup-joined', 'flow/feed-compose']);
  const SCREENS = {
    'wf/discover-map': [874, 0, 71], 'wf/regular-main': [1370, 100, 90], 'wf/regular-detail': [1018, 0, 78],
    'flow/regular-profile': [911, 93, 91], 'wf/regular-joined': [1232, 0, 76],
    'wf/popup-main': [1114, 100, 78], 'wf/popup-detail': [1776, 0, 82], 'flow/popup-apply': [874, 0, 0],
    'flow/popup-joined': [1892, 0, 86], 'wf/chat-popup': [1200, 172, 118, CHAT_BAR], 'wf/chat-regular': [1218, 172, 125, CHAT_BAR],
    'wf/studio-info': [1638, 105, 98], 'flow/studio-saved': [874, 0, 0],
    'wf/feed-home': [2313, 160, 98], 'flow/feed-compose': [874, 0, 0], 'wf/feed-write': [1020, 110, 104], 'wf/feed-saved': [952, 102, 0],
    'flow/checkout': [874, 0, 0], 'flow/rating-clean': [874, 0, 0], 'flow/rating-result': [874, 0, 0],
  };
  for (let n = 0; n <= 6; n++) SCREENS[`flow/studio-step${n}`] = [1252, 95, 108];
  const pin = { S: [176, 437], p1: [275, 437], p2: [369, 376], p3: [275, 317], p4: [182, 377] };
  const FLOWS = {
    f1: [
      { s: 'wf/discover-map', step: 0 },
      { s: 'wf/regular-main', step: 1, scroll: true },
      { s: 'wf/regular-detail', step: 2, scroll: true, tap: [220, 972] },
      { s: 'flow/regular-profile', step: 3, scroll: true, tap: [200, 870] },
      { s: 'wf/regular-joined', step: 4, scroll: true },
    ],
    f2: [
      { s: 'wf/popup-main', step: 0, scroll: true },
      { s: 'wf/popup-detail', step: 1, scroll: true, dur: 3800, tap: [200, 1740] },
      { s: 'flow/popup-apply', step: 2, sheet: 458, tap: [294, 812] },
      { s: 'flow/popup-joined', step: 3, scroll: true, dur: 3800, tap: [80, 1845] },
      { s: 'wf/chat-popup', step: 4, scroll: true },
    ],
    f3: [
      { s: 'flow/studio-step0', step: 0, dur: 1600, tap: pin.S },
      { s: 'flow/studio-step1', step: 1, dur: 1200, stay: true, tap: pin.p1 },
      { s: 'flow/studio-step2', step: 1, dur: 1200, stay: true, tap: pin.p2 },
      { s: 'flow/studio-step3', step: 1, dur: 1200, stay: true, tap: pin.p3 },
      { s: 'flow/studio-step4', step: 1, dur: 1200, stay: true, tap: pin.p4 },
      { s: 'flow/studio-step5', step: 2, dur: 1400, stay: true, tap: pin.S },
      { s: 'flow/studio-step6', step: 2, dur: 3600, stay: true, scroll: true, tap: [200, 1185] },
      { s: 'wf/studio-info', step: 3, scroll: true, dur: 3800, tap: [200, 1590] },
      { s: 'flow/studio-saved', step: 4 },
    ],
    f4: [
      { s: 'wf/feed-home', step: 0, scroll: true, dur: 4200, tap: [362, 69] },
      { s: 'flow/feed-compose', step: 1, sheet: 486, tap: [200, 620] },
      { s: 'wf/feed-write', step: 2, scroll: true, tap: [200, 960] },
      { s: 'wf/feed-saved', step: 3, scroll: true },
    ],
    f5: [
      { s: 'wf/regular-joined', step: 0, scroll: true, tap: [200, 1185] },
      { s: 'wf/chat-regular', step: 1, scroll: true, dur: 3800 },
      { s: 'wf/chat-popup', step: 2, scroll: true, dur: 3800 },
    ],
    pace: [
      { s: 'flow/checkout', step: 0, tap: [200, 770] },
      { s: 'flow/rating-clean', step: 1 },
      { s: 'flow/rating-result', step: 2 },
    ],
  };
  const tapHTML = (cls, x, y) => `<i class="${cls}" style="left:calc(${x} * var(--u));top:calc(${y} * var(--u))"></i>`;

  $$('.pframes[data-flow]').forEach((host) => {
    const frames = FLOWS[host.dataset.flow];
    if (!frames) return;
    const stepsEl = $(`.psteps[data-for="${host.dataset.flow}"]`);
    const stepItems = stepsEl ? $$('li', stepsEl) : [];
    host.innerHTML = '';
    const els = frames.map((fr, i) => {
      const [h, t, b, bar] = SCREENS[fr.s];
      const src = `assets/img/${fr.s}.jpg`;
      const lazy = i ? ' loading="lazy"' : '';
      const el = document.createElement('div');
      el.className = 'pframe';
      el.style.cssText = `--t:${t};--b:${bar ? bar.h : b}`;
      const tx = fr.tap ? fr.tap[0] : 0; const ty = fr.tap ? fr.tap[1] : 0;
      if (fr.sheet) {
        el.classList.add('pframe--sheet');
        el.innerHTML = `<div class="pf-dim"></div><div class="pf-sheet" style="--st:${fr.sheet};--sh:${h - fr.sheet}"><img src="${src}" alt=""${lazy}>${fr.tap ? tapHTML('tap', tx, ty - fr.sheet) : ''}</div>`;
      } else {
        const where = !fr.tap ? '' : ty < t ? 'top' : ty >= h - b ? 'bot' : 'body';
        el.innerHTML =
          `<div class="pf-body"><div class="pf-scroll"><img src="${src}" alt=""${lazy}>${where === 'body' ? tapHTML('tap', tx, ty) : ''}</div></div>` +
          (t ? `<div class="pf-top"><img src="${src}" alt=""${lazy}>${where === 'top' ? tapHTML('tap', tx, ty) : ''}</div>` : '') +
          (bar ? `<div class="pf-bot"><img src="${bar.src}" alt=""></div>` : b ? `<div class="pf-bot"><img src="${src}" alt=""${lazy}>${where === 'bot' ? tapHTML('tap', tx, ty - (h - b)) : ''}</div>` : '');
      }
      host.appendChild(el);
      return el;
    });
    // the phone's status bar (time · signal · wifi · battery) never moves between screens
    host.insertAdjacentHTML('beforeend', '<div class="pf-status" aria-hidden="true"><img src="assets/img/flow/statusbar-icons.png" alt=""></div>');
    const status = host.lastElementChild;
    let index = -1; let under = -1; let timer = 0; let tapTimer = 0; let cleanTimer = 0; let visible = false;
    const resetScroll = (el) => { const sc = $('.pf-scroll', el); if (sc) { sc.style.transition = 'none'; sc.style.translate = '0 0'; } };
    // how far a tall screen scrolls to reach its bottom
    const scrollDist = (k) => { const [h, t, b] = SCREENS[frames[k].s]; const body = $('.pf-body', els[k]); return body ? (h - t - b) * (els[k].clientWidth / 402) - body.clientHeight : 0; };

    const show = (i, instant) => {
      const prev = index; const prevUnder = under;
      index = (i + frames.length) % frames.length;
      const fr = frames[index]; const el = els[index];
      const quiet = instant || reduce || prev < 0;
      const stay = !quiet && fr.stay && prev === index - 1;
      // a sheet always opens over the screen right before it (even when jumping from a step button)
      under = fr.sheet && index > 0 ? index - 1 : -1;
      const dur = fr.dur || (fr.scroll ? 3400 : 2400);

      els.forEach((e, k) => {
        if (k === index) return;
        e.classList.remove('is-on', 'is-enter', 'is-stay');
        const old = k === prev || k === prevUnder;
        e.classList.toggle('is-under', k === under);
        e.classList.toggle('is-off', old && k !== under && !quiet);
        e.classList.toggle('is-stay-out', !!stay || !!fr.sheet);
        const t = $('.tap', e); if (t) t.classList.remove('is-go');
        if (!old && k !== under) resetScroll(e);
      });
      if (under >= 0 && under !== prev) { const sc = $('.pf-scroll', els[under]); const d = scrollDist(under); if (sc && frames[under].scroll && d > 4) { sc.style.transition = 'none'; sc.style.translate = `0 ${-d}px`; } }
      el.classList.remove('is-off', 'is-under', 'is-stay-out');
      el.classList.toggle('is-instant', !!quiet);
      el.classList.toggle('is-stay', !!stay);
      if (prev !== index) resetScroll(el);
      $$('.drop', el).forEach((d) => d.remove());
      if (!quiet && !stay) el.classList.add('is-enter');
      el.classList.add('is-on');
      void el.offsetWidth;
      el.classList.remove('is-enter');
      // a pin appears where the previous tap landed
      if (stay && frames[prev].tap) $('.pf-scroll', el).insertAdjacentHTML('beforeend', tapHTML('drop', ...frames[prev].tap));
      clearTimeout(cleanTimer);
      cleanTimer = setTimeout(() => els.forEach((e, k) => { if (k !== index && k !== under) { e.classList.remove('is-off', 'is-stay-out'); resetScroll(e); } }), 650);

      status.classList.toggle('is-clear', CLEAR.has(fr.s));
      stepItems.forEach((li, k) => li.classList.toggle('is-active', k === fr.step));
      clearTimeout(tapTimer);
      if (!reduce && visible) {
        const body = $('.pf-body', el); const sc = $('.pf-scroll', el);
        if (fr.scroll && body) {
          requestAnimationFrame(() => {
            const dist = scrollDist(index);
            if (dist > 4) {
              sc.style.transition = `translate ${dur - 1200}ms cubic-bezier(.45,0,.25,1) 500ms`;
              sc.style.translate = `0 ${-dist}px`;
            }
          });
        }
        const tap = $('.tap', el);
        if (tap) tapTimer = setTimeout(() => tap.classList.add('is-go'), Math.max(300, dur - 750));
      }
      clearTimeout(timer);
      if (!reduce && visible) timer = setTimeout(() => show(index + 1), dur);
    };
    stepItems.forEach((li, k) => $('button', li).addEventListener('click', () => {
      const first = frames.findIndex((fr) => fr.step === k);
      if (first >= 0) show(first);
    }));
    show(0, true);
    whenVisible(host.closest('.feat__stage, .temp') || host, () => { if (visible) return; visible = true; show(index, true); },
      () => { visible = false; clearTimeout(timer); clearTimeout(tapTimer); });
  });

  /* ---------- Crew check-in run: countdown → recording → rating ---------- */
  const live = $('#liveRun');
  if (live) {
    const steps = $$('.step-item', live);
    const phones = $$('.live__phones .phone', live);
    const count = $('#liveCount');
    const ovDist = $('#ovDist'); const ovTime = $('#ovTime'); const ovPace = $('#ovPace');
    let token = 0; let visible = false;
    const setStep = (i) => {
      steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
      phones.forEach((p, k) => p.classList.toggle('is-active', k === i));
      live.classList.add('stepper-on');
    };
    const resetRecord = () => { ovDist.textContent = '0.00'; ovTime.textContent = '00:00'; ovPace.textContent = '0\'00"'; };
    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const countdown = async (t) => {
      setStep(0); resetRecord();
      for (const n of [3, 2, 1]) {
        if (t !== token) return false;
        count.src = `assets/img/flow/count-${n}.png`;
        count.classList.remove('is-pop'); void count.offsetWidth; count.classList.add('is-pop');
        await wait(900);
      }
      return t === token;
    };
    const record = (t, ms) => new Promise((done) => {
      setStep(1);
      const t0 = performance.now();
      const tick = (now) => {
        if (t !== token) return done(false);
        const r = clamp((now - t0) / ms, 0, 1);
        ovDist.textContent = (3.42 * r).toFixed(2);
        ovTime.textContent = fmt(1278 * r);
        ovPace.textContent = r > 0.08 ? '6\'14"' : '0\'00"';
        if (r < 1) requestAnimationFrame(tick); else done(true);
      };
      requestAnimationFrame(tick);
    });
    const loop = async () => {
      const t = ++token;
      while (visible && t === token) {
        if (!(await countdown(t))) return;
        if (!(await record(t, 4200))) return;
        await wait(700);
        if (t !== token) return;
        setStep(2);
        await wait(2600);
      }
    };
    const jump = async (i) => {
      const t = ++token;
      if (i === 0) { if (await countdown(t)) { if (await record(t, 4200)) { await wait(700); if (t === token) setStep(2); } } }
      if (i === 1) { count.src = 'assets/img/flow/count-1.png'; await record(t, 4200); }
      if (i === 2) { ovDist.textContent = '3.42'; ovTime.textContent = '21:18'; ovPace.textContent = '6\'14"'; setStep(2); }
      if (t === token && visible && !reduce) { await wait(2600); if (t === token) loop(); }
    };
    steps.forEach((s, k) => s.addEventListener('click', () => jump(k)));
    if (reduce) {
      ovDist.textContent = '3.42'; ovTime.textContent = '21:18'; ovPace.textContent = '6\'14"';
      count.src = 'assets/img/flow/count-3.png';
    } else {
      whenVisible(live, () => { if (visible) return; visible = true; loop(); }, () => { visible = false; token++; });
    }
  }
})();
