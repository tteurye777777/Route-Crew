/* ROUTE CREW — interactions & scroll motion */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const root = document.documentElement;
  if (reduce) root.classList.add('reduce');
  // Always start at the hero so the intro motion plays (unless a #hash was requested)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);
  if (!hasGsap) root.classList.add('no-gsap');

  /* ------------------------------------------------------------
     Toast + copy HEX
  ------------------------------------------------------------ */
  const toast = $('#toast');
  let toastTimer;
  const showToast = (hex) => {
    toast.querySelector('i').style.background = hex;
    toast.querySelector('span').textContent = `${hex} 복사됨`;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 1600);
  };
  $$('[data-hex]').forEach((btn) => btn.addEventListener('click', () => {
    const hex = btn.dataset.hex;
    try { navigator.clipboard && navigator.clipboard.writeText(hex).catch(() => {}); } catch (e) { /* ignore */ }
    showToast(hex);
  }));

  /* ------------------------------------------------------------
     Icon set: hover shows Line + Fill pair together
  ------------------------------------------------------------ */
  const iconset = $('#iconset');
  const iconGroups = $$('g[id^="Icon/"]', iconset);
  const pairOf = (id) => {
    if (id === 'Icon/Run') return 'Icon/Line/run';
    if (id === 'Icon/Line/run') return 'Icon/Run';
    return id.includes('/Line/') ? id.replace('/Line/', '/Fill/') : id.replace('/Fill/', '/Line/');
  };
  const byId = (id) => $$(`g[id="${id}"]`, iconset);
  iconGroups.forEach((g) => {
    g.addEventListener('mouseenter', () => [...byId(g.id), ...byId(pairOf(g.id))].forEach((e) => e.classList.add('is-hot')));
    g.addEventListener('mouseleave', () => $$('.is-hot', iconset).forEach((e) => e.classList.remove('is-hot')));
  });

  /* ------------------------------------------------------------
     F02: regular ↔ flash switch (auto-plays until the user taps)
  ------------------------------------------------------------ */
  const f2 = $('#f2');
  let f2Timer = null;
  let f2Touched = false;
  const setMode = (m) => {
    f2.dataset.mode = m;
    $$('.switch button', f2).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  };
  const stopAuto = () => { clearInterval(f2Timer); f2Timer = null; };
  const startAuto = () => {
    if (f2Touched || reduce || f2Timer) return;
    f2Timer = setInterval(() => setMode(f2.dataset.mode === 'regular' ? 'flash' : 'regular'), 2800);
  };
  $$('.switch button', f2).forEach((b) => b.addEventListener('click', () => { f2Touched = true; stopAuto(); setMode(b.dataset.mode); }));
  $$('.phone[data-for]', f2).forEach((p) => p.addEventListener('click', () => { f2Touched = true; stopAuto(); setMode(p.dataset.for); }));
  new IntersectionObserver(([e]) => (e.isIntersecting ? startAuto() : stopAuto()), { threshold: 0.45 }).observe(f2);

  /* ------------------------------------------------------------
     F04: like button with heart burst
  ------------------------------------------------------------ */
  const like = $('#likeBtn');
  const likeCount = $('#likeCount');
  let likes = 128;
  const HEART = '<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.2-9.4C1.7 7.8 3.8 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.4 0 5.5 3.3 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"/></svg>';
  const burst = (count) => {
    if (reduce || !hasGsap) return;
    const host = like.parentElement;
    const r = like.getBoundingClientRect();
    const hr = host.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'heart-pop';
      el.innerHTML = HEART;
      el.style.left = `${r.left - hr.left + 14}px`;
      el.style.top = `${r.top - hr.top + 12}px`;
      host.appendChild(el);
      gsap.fromTo(el, { scale: 0.4, opacity: 1 }, {
        x: gsap.utils.random(-70, 30), y: gsap.utils.random(-150, -60),
        rotation: gsap.utils.random(-40, 40), scale: gsap.utils.random(0.8, 1.5), opacity: 0,
        duration: gsap.utils.random(0.9, 1.4), ease: 'power2.out', delay: i * 0.05,
        onComplete: () => el.remove(),
      });
    }
  };
  like.addEventListener('click', () => {
    const on = like.getAttribute('aria-pressed') !== 'true';
    like.setAttribute('aria-pressed', String(on));
    likes += on ? 1 : -1;
    likeCount.textContent = likes;
    if (on) burst(8);
  });

  /* ------------------------------------------------------------
     Nav theme + run meter + route rail
  ------------------------------------------------------------ */
  const sideNav = $('#sideNav');
  const kmEl = $('#km');
  const snPrev = $('#snPrev');
  const snNext = $('#snNext');
  const rail = $('#rail');
  const railPath = $('#railPath');
  const runner = $('#railRunner');
  const railLen = railPath.getTotalLength();
  railPath.style.strokeDasharray = railLen;
  const sections = $$('[data-cp]');
  const secTop = (sec) => sec.getBoundingClientRect().top + window.scrollY;
  const goTo = (sec) => window.scrollTo({ top: secTop(sec), behavior: reduce ? 'auto' : 'smooth' });
  const cps = sections.map((sec, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rail__cp';
    b.innerHTML = `<span><em>${String(i + 1).padStart(2, '0')}</em>${sec.dataset.cp}</span>`;
    b.setAttribute('aria-label', `${sec.dataset.cp} 섹션으로 이동`);
    b.addEventListener('click', () => goTo(sec));
    rail.appendChild(b);
    return { sec, b, f: 0 };
  });
  // Current section = last one whose top is at/above the middle of the viewport
  const currentIndex = () => {
    const mid = window.scrollY + window.innerHeight * 0.4;
    let idx = 0;
    sections.forEach((sec, i) => { if (secTop(sec) <= mid) idx = i; });
    return idx;
  };
  snPrev.addEventListener('click', () => {
    const i = currentIndex();
    // if we are well inside the current section, go back to its top first
    const target = window.scrollY - secTop(sections[i]) > 40 ? i : i - 1;
    goTo(sections[Math.max(0, target)]);
  });
  snNext.addEventListener('click', () => goTo(sections[Math.min(sections.length - 1, currentIndex() + 1)]));
  const darkSecs = $$('[data-theme="dark"]');
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

  const pointAt = (f) => {
    const pt = railPath.getPointAtLength(railLen * f);
    return { x: (pt.x / 34) * rail.clientWidth, y: (pt.y / 600) * rail.clientHeight };
  };
  const layoutRail = () => {
    const m = maxScroll();
    cps.forEach((cp) => {
      cp.f = clamp((cp.sec.getBoundingClientRect().top + window.scrollY) / m, 0, 1);
      const { x, y } = pointAt(cp.f);
      cp.b.style.transform = `translate(${x}px, ${y}px)`;
    });
    update();
  };
  function update() {
    const p = clamp(window.scrollY / maxScroll(), 0, 1);
    kmEl.textContent = (p * 5).toFixed(2);
    snPrev.disabled = window.scrollY < 4;
    snNext.disabled = p > 0.995;
    railPath.style.strokeDashoffset = railLen * (1 - p);
    const { x, y } = pointAt(p);
    runner.style.transform = `translate(${x}px, ${y}px)`;
    const current = currentIndex();
    cps.forEach((cp, i) => {
      cp.b.classList.toggle('is-passed', i <= current);
      cp.b.classList.toggle('is-current', i === current);
      if (i === current) cp.b.setAttribute('aria-current', 'true'); else cp.b.removeAttribute('aria-current');
    });
    const navMid = window.innerHeight / 2;
    const onDark = darkSecs.some((s) => { const r = s.getBoundingClientRect(); return r.top <= navMid && r.bottom > navMid; });
    sideNav.classList.toggle('on-dark', onDark);
  }
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', layoutRail);
  layoutRail();

  if (!hasGsap) return;

  /* ============================================================
     GSAP scroll motion
  ============================================================ */
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.addEventListener('refresh', layoutRail);
  window.addEventListener('load', () => ScrollTrigger.refresh());

  // Shared helpers for pinned sequences
  const homeSec = $('#home');
  const homeItems = $$('#homeList li');
  const homePhones = $$('#homePhones .phone');
  const homeMap = [[0, 2], [0], [1], [1]];
  const setHome = (i) => {
    homeItems.forEach((li, k) => li.classList.toggle('is-active', k === i));
    homePhones.forEach((ph, k) => ph.classList.toggle('is-active', homeMap[i].includes(k)));
  };

  const liveSec = $('#live');
  const steps = $$('#steps .step');
  const bars = steps.map((s) => s.querySelector('.step__bar'));
  const livePhones = $$('#livePhones .phone');
  const rdDist = $('#rdDist');
  const rdTime = $('#rdTime');
  const rdBpm = $('#rdBpm');
  const liveTag = $('#liveTag');
  const renderLive = (p) => {
    const i = Math.min(2, Math.floor(p * 3));
    const local = clamp(p * 3 - i, 0, 1);
    steps.forEach((s, k) => { s.classList.toggle('is-active', k === i); s.classList.toggle('is-done', k < i); });
    bars.forEach((b, k) => { b.style.transform = `scaleX(${k < i ? 1 : k === i ? local : 0})`; });
    livePhones.forEach((ph, k) => ph.classList.toggle('is-active', k === i));
    // On mobile the phones sit in a horizontal scroller: keep the active one in view
    const rowEl = livePhones[0].parentElement;
    if (i !== renderLive.last && rowEl.scrollWidth > rowEl.clientWidth + 4) {
      rowEl.scrollTo({ left: livePhones[i].offsetLeft - rowEl.offsetLeft - 8, behavior: 'smooth' });
    }
    renderLive.last = i;
    const run = i === 0 ? 0 : i === 1 ? local : 1;
    rdDist.textContent = (3.42 * run).toFixed(2);
    const secs = Math.round(1278 * run);
    rdTime.textContent = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
    rdBpm.textContent = i === 0 ? '—' : String(Math.round(100 + 52 * Math.min(1, run * 1.5)));
    liveTag.textContent = i === 0 ? `START IN ${Math.max(1, 3 - Math.floor(local * 3))}` : i === 1 ? 'LIVE · 크루 4명' : 'FINISHED';
  };
  const resetLive = () => {
    rdDist.textContent = '3.42'; rdTime.textContent = '21:18'; rdBpm.textContent = '152'; liveTag.textContent = 'LIVE';
    bars.forEach((b) => { b.style.transform = ''; });
  };

  const mm = gsap.matchMedia();
  mm.add({
    desk: '(min-width: 900px)',
    mob: '(max-width: 899px)',
    motion: '(prefers-reduced-motion: no-preference)',
  }, (ctx) => {
    const { desk, motion } = ctx.conditions;
    if (!motion) { iconset.classList.add('is-ready'); return undefined; }

    /* ---------- HERO intro ---------- */
    const intro = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.9 } });
    intro
      .from('.hero__meta p', { y: -14, autoAlpha: 0, stagger: 0.08 }, 0)
      .from('#heroMockup', { y: 140, autoAlpha: 0, duration: 1.5, ease: 'expo.out' }, 0.1)
      .from('.hero__title .line > span', { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.12 }, 0.15)
      .fromTo('#heroRoute', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 2, ease: 'power2.inOut' }, 0.35)
      .from('.hero__brand', { x: -24, autoAlpha: 0 }, 0.45)
      .from('.hero__sub', { y: 12, autoAlpha: 0 }, 0.65)
      .from('#heroNoti', { y: -26, scale: 0.7, autoAlpha: 0, duration: 0.8, ease: 'back.out(1.8)' }, 1.25)
      .from('#heroChip', { scale: 0.5, autoAlpha: 0, duration: 0.7, ease: 'back.out(2)' }, 1.5)
      .from('.scroll-cue', { autoAlpha: 0 }, 1.6);

    gsap.to('#heroStage', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
    if (desk) {
      gsap.to('#heroCopy', { y: -90, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: '70% top', scrub: true } });
    }

    let onMove;
    if (desk) {
      const mock = $('#heroMockup');
      gsap.set('#heroStage', { transformPerspective: 1400 });
      const rx = gsap.quickTo(mock, 'rotationX', { duration: 0.9, ease: 'power3' });
      const ry = gsap.quickTo(mock, 'rotationY', { duration: 0.9, ease: 'power3' });
      const mx = gsap.quickTo(mock, 'x', { duration: 0.9, ease: 'power3' });
      onMove = (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        ry(nx * 9); rx(-ny * 6); mx(nx * 18);
      };
      $('#hero').addEventListener('mousemove', onMove);
    }

    /* ---------- generic reveals ---------- */
    $$('[data-reveal]').forEach((el) => gsap.from(el, {
      y: 48, autoAlpha: 0, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%', once: true },
    }));

    /* ---------- ABOUT: Local × Community × Route converge ---------- */
    const orbItems = $$('#orbs .orb-item');
    gsap.timeline({ scrollTrigger: { trigger: '#orbs', start: 'top 90%', end: 'top 42%', scrub: 1 } })
      .from(orbItems[0], { xPercent: -95, autoAlpha: 0, scale: 0.7 }, 0)
      .from(orbItems[2], { xPercent: 95, autoAlpha: 0, scale: 0.7 }, 0)
      .from(orbItems[1], { yPercent: 45, autoAlpha: 0, scale: 0.7 }, 0)
      .from('#orbs .times', { scale: 0, autoAlpha: 0, stagger: 0.1 }, 0.55);

    /* ---------- BRAND ---------- */
    gsap.from('.logo-main img', { rotation: -40, scale: 0.6, autoAlpha: 0, duration: 1.1, ease: 'back.out(1.7)', clearProps: 'transform', scrollTrigger: { trigger: '.logo-row', start: 'top 85%', once: true } });
    gsap.from('.logo-vars > *', { x: 30, autoAlpha: 0, duration: 0.8, stagger: 0.1, scrollTrigger: { trigger: '.logo-row', start: 'top 85%', once: true } });
    gsap.fromTo('#typeHero', { '--w': 100 }, { '--w': 900, ease: 'none', scrollTrigger: { trigger: '#typeHero', start: 'top 92%', end: 'top 38%', scrub: true } });
    gsap.from('#weights li', { x: -30, autoAlpha: 0, duration: 0.8, stagger: 0.08, scrollTrigger: { trigger: '#weights', start: 'top 88%', once: true } });
    gsap.from('#mintBar .swatch, #grayBar .swatch', {
      scaleX: 0, transformOrigin: 'left center', duration: 0.9, ease: 'expo.out', stagger: 0.06, clearProps: 'transform',
      scrollTrigger: { trigger: '#colors', start: 'top 80%', once: true },
    });
    gsap.from('.point', { scale: 0, autoAlpha: 0, duration: 0.6, ease: 'back.out(2)', stagger: 0.1, scrollTrigger: { trigger: '.points', start: 'top 92%', once: true } });
    gsap.from(iconGroups, {
      scale: 0.2, autoAlpha: 0, duration: 0.6, ease: 'back.out(2)',
      stagger: { each: 0.012, from: 'random' },
      clearProps: 'transform,opacity,visibility',
      scrollTrigger: { trigger: iconset, start: 'top 82%', once: true },
      onComplete: () => iconset.classList.add('is-ready'),
    });

    /* ---------- HOME ---------- */
    const weekKm = $('#weekKm');
    const ringTxt = $('#ringTxt');
    const ringFg = $('#ringFg');
    const stat = { v: 0 };
    const drawStat = () => {
      weekKm.textContent = (68.4 * stat.v).toFixed(1);
      ringTxt.textContent = `${Math.round(68 * stat.v)}%`;
      ringFg.style.strokeDashoffset = 138.2 * (1 - 0.68 * stat.v);
    };
    drawStat();
    gsap.from('#homePhones .phone', { y: 120, duration: 1.3, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '#homePhones', start: 'top 88%', once: true } });
    gsap.from('#statCard', { y: 30, autoAlpha: 0, duration: 0.9, scrollTrigger: { trigger: '#homePhones', start: 'top 70%', once: true } });
    gsap.to(stat, { v: 1, duration: 1.8, ease: 'power2.out', onUpdate: drawStat, scrollTrigger: { trigger: '#homePhones', start: 'top 70%', once: true } });

    if (desk) {
      ScrollTrigger.create({
        trigger: '#homeInner', start: 'top top', end: '+=220%', pin: true,
        onToggle: (self) => homeSec.classList.toggle('is-stepping', self.isActive),
        onUpdate: (self) => setHome(Math.min(3, Math.floor(self.progress * 4))),
      });
    }

    /* ---------- FEATURES ---------- */
    $$('.f-card').forEach((card) => {
      gsap.set(card, { y: 70, autoAlpha: 0 });
      const phones = $$('.f-stage .phone', card);
      gsap.set(phones, { y: 90 });
      ScrollTrigger.create({
        trigger: card, start: 'top 85%', once: true,
        onEnter: () => {
          const delay = card.matches(':nth-child(even)') && desk ? 0.12 : 0;
          gsap.to(card, { y: 0, autoAlpha: 1, duration: 1.1, ease: 'power3.out', delay });
          gsap.to(phones, { y: 0, duration: 1.3, ease: 'expo.out', stagger: 0.12, delay: delay + 0.2 });
          card.classList.add('is-in');
        },
      });
    });
    gsap.from('#f1 .pin', { y: -70, autoAlpha: 0, duration: 1, ease: 'bounce.out', stagger: 0.25, scrollTrigger: { trigger: '#f1', start: 'top 70%', once: true } });

    const f3Lines = $$('#f3 .f-route path');
    const f3Len = $('#f3Path').getTotalLength();
    gsap.set(f3Lines, { strokeDasharray: f3Len, strokeDashoffset: f3Len });
    gsap.set('#f3 .f-route circle', { scale: 0, transformOrigin: 'center' });
    gsap.timeline({ scrollTrigger: { trigger: '#f3', start: 'top 70%', once: true } })
      .to('#f3 .f-route circle:first-of-type', { scale: 1, duration: 0.4, ease: 'back.out(3)' }, 0.4)
      .to(f3Lines, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut' }, 0.5)
      .to('#f3 .f-route__end', { scale: 1, duration: 0.5, ease: 'back.out(3)' }, 2.5);

    ScrollTrigger.create({ trigger: '#f4', start: 'top 60%', once: true, onEnter: () => setTimeout(() => burst(5), 900) });

    /* ---------- LIVE ---------- */
    renderLive(0);
    const liveST = ScrollTrigger.create(desk ? {
      trigger: '#liveInner', start: 'top top', end: '+=240%', pin: true,
      onToggle: (self) => liveSec.classList.toggle('is-stepping', self.isActive),
      onUpdate: (self) => renderLive(self.progress),
    } : {
      trigger: '.live__card', start: 'top 75%', end: 'bottom 35%', scrub: true,
      onToggle: (self) => liveSec.classList.toggle('is-stepping', self.isActive),
      onUpdate: (self) => renderLive(self.progress),
    });

    /* ---------- FINISH ---------- */
    gsap.to('#slogan .w', {
      color: (i, el) => (el.classList.contains('is-mint') ? '#2CF1B0' : '#FFFFFF'),
      stagger: 0.3, ease: 'none',
      scrollTrigger: { trigger: '#slogan', start: 'top 85%', end: 'bottom 72%', scrub: true },
    });
    gsap.from('.finish__badge', { y: 20, autoAlpha: 0, duration: 0.8, scrollTrigger: { trigger: '.finish__badge', start: 'top 90%', once: true } });
    gsap.from('.finish__logo', { y: 40, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.finish__logo', start: 'top 92%', once: true } });
    gsap.from('.finish__logo img', { rotation: -90, scale: 0.4, duration: 1.2, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.finish__logo', start: 'top 92%', once: true } });

    return () => {
      if (onMove) $('#hero').removeEventListener('mousemove', onMove);
      homeSec.classList.remove('is-stepping');
      liveSec.classList.remove('is-stepping');
      liveST.kill();
      resetLive();
    };
  });
})();
