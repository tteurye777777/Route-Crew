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
     frame: { src, step, dur?, scroll?, tap?: [x%, y%] }  (tap position is % of the screen image) */
  const W = 'assets/img/wf/';
  const F = 'assets/img/flow/';
  const pin = { S: [43.8, 34.9], p1: [68.4, 34.9], p2: [91.8, 30.0], p3: [68.4, 25.3], p4: [45.3, 30.1] };
  const FLOWS = {
    f1: [
      { src: W + 'discover-map.jpg', step: 0 },
      { src: W + 'regular-main.jpg', step: 1, scroll: true },
      { src: W + 'regular-detail.jpg', step: 2, scroll: true },
      { src: F + 'regular-profile.jpg', step: 3 },
      { src: W + 'regular-joined.jpg', step: 4, scroll: true },
    ],
    f2: [
      { src: W + 'popup-main.jpg', step: 0, scroll: true },
      { src: W + 'popup-detail.jpg', step: 1, scroll: true },
      { src: F + 'popup-apply.jpg', step: 2 },
      { src: F + 'popup-joined.jpg', step: 3, scroll: true },
      { src: W + 'chat-popup.jpg', step: 4, scroll: true },
    ],
    f3: [
      { src: F + 'studio-step0.jpg', step: 0, dur: 1500, tap: pin.S },
      { src: F + 'studio-step1.jpg', step: 1, dur: 1100, tap: pin.p1 },
      { src: F + 'studio-step2.jpg', step: 1, dur: 1100, tap: pin.p2 },
      { src: F + 'studio-step3.jpg', step: 1, dur: 1100, tap: pin.p3 },
      { src: F + 'studio-step4.jpg', step: 1, dur: 1100, tap: pin.p4 },
      { src: F + 'studio-step5.jpg', step: 2, dur: 1300, tap: pin.S },
      { src: F + 'studio-step6.jpg', step: 2, dur: 2200 },
      { src: W + 'studio-info.jpg', step: 3, scroll: true },
      { src: F + 'studio-saved.jpg', step: 4 },
    ],
    f4: [
      { src: W + 'feed-home.jpg', step: 0, scroll: true, dur: 3800 },
      { src: F + 'feed-compose.jpg', step: 1 },
      { src: W + 'feed-write.jpg', step: 2, scroll: true },
      { src: W + 'feed-saved.jpg', step: 3, scroll: true },
    ],
    f5: [
      { src: W + 'regular-joined.jpg', step: 0, scroll: true },
      { src: W + 'chat-regular.jpg', step: 1, scroll: true },
      { src: W + 'chat-popup.jpg', step: 2, scroll: true },
    ],
    pace: [
      { src: F + 'checkout.jpg', step: 0 },
      { src: W + 'rating.jpg', step: 1 },
      { src: F + 'rating-result.jpg', step: 2 },
    ],
  };

  $$('.pframes[data-flow]').forEach((host) => {
    const frames = FLOWS[host.dataset.flow];
    if (!frames) return;
    const stepsEl = $(`.psteps[data-for="${host.dataset.flow}"]`);
    const stepItems = stepsEl ? $$('li', stepsEl) : [];
    host.innerHTML = '';
    const els = frames.map((fr, i) => {
      const el = document.createElement('div');
      el.className = 'pframe';
      el.innerHTML = `<div class="pframe__inner"><img src="${fr.src}" alt="" ${i ? 'loading="lazy"' : ''}>${fr.tap ? `<i class="tap" style="left:${fr.tap[0]}%;top:${fr.tap[1]}%"></i>` : ''}</div>`;
      host.appendChild(el);
      return el;
    });
    let index = -1; let timer = 0; let tapTimer = 0; let visible = false;

    const show = (i, instant) => {
      const prev = index;
      index = (i + frames.length) % frames.length;
      const fr = frames[index];
      const dur = fr.dur || (fr.scroll ? 3400 : 2400);
      els.forEach((el, k) => {
        el.classList.toggle('is-instant', !!instant || reduce);
        el.classList.toggle('is-on', k === index);
        el.classList.toggle('is-off', k === prev && k !== index);
        if (k !== index) {
          const inner = $('.pframe__inner', el);
          inner.style.transition = 'none'; inner.style.translate = '0 0';
          const t = $('.tap', el); if (t) t.classList.remove('is-go');
        }
      });
      stepItems.forEach((li, k) => li.classList.toggle('is-active', k === fr.step));
      // tall screens scroll down like a user reading, taps appear before moving on
      const el = els[index];
      const inner = $('.pframe__inner', el);
      clearTimeout(tapTimer);
      if (!reduce && visible) {
        if (fr.scroll) {
          requestAnimationFrame(() => {
            const dist = inner.offsetHeight - el.clientHeight;
            if (dist > 4) {
              inner.style.transition = `translate ${dur - 1100}ms cubic-bezier(.45,0,.25,1) 500ms`;
              inner.style.translate = `0 ${-dist}px`;
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
    whenVisible(host.closest('.feat__stage, .temp') || host, () => { if (visible) return; visible = true; show(index); },
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
