/* TG Media — motion system, navigation and enquiry form.
   One rAF loop, no libraries.

   Two rules hold everywhere in this file:
   1. Nothing is hidden by CSS alone. Any "starts hidden" state is gated behind
      a class this script adds (.js-motion, .svc--enhanced, .transform--enhanced,
      .process--enhanced), so with JavaScript off every page renders complete.
   2. Anything that hides content to animate it in carries a timeout sweep, so a
      missed observer or a throttled frame can never leave content invisible. */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = function () { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var fine = function () { return window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var ease = function (t) { return t * t * (3 - 2 * t); };
  var slice = function (n) { return Array.prototype.slice.call(n); };

  /* ------------------------------------------------------------ scrub loop */
  var items = [];
  var ticking = false;

  function schedule() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  }

  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var r = it.el.getBoundingClientRect();
      // Skip anything comfortably off screen — keeps idle scrolling cheap.
      if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) { if (it.idle) it.idle(); continue; }
      it.run(r, vh);
    }
  }

  /* ------------------------------------------------------- generic reveals */
  /* [data-rise] elements fade/translate in once. The sweep is the safety net:
     whatever happens to the observer, everything is visible shortly after. */
  function rise() {
    var nodes = slice(document.querySelectorAll('[data-rise]'));
    if (!nodes.length) return;
    var show = function (n) { n.classList.add('is-in'); };

    if (reduced() || !('IntersectionObserver' in window)) {
      nodes.forEach(show);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    nodes.forEach(function (n) { io.observe(n); });

    var sweep = function () {
      var pending = 0;
      nodes.forEach(function (n) {
        if (n.classList.contains('is-in')) return;
        if (n.getBoundingClientRect().top > window.innerHeight * 0.96) { pending++; return; }
        show(n);
      });
      if (!pending) window.removeEventListener('scroll', sweep);
    };
    setTimeout(sweep, 1400);
    window.addEventListener('scroll', sweep, { passive: true });
  }

  /* Image crop reveals — clip-path opened on entry, applied by JS only. */
  function cropReveal() {
    var nodes = slice(document.querySelectorAll('[data-reveal]'));
    if (!nodes.length) return;
    if (reduced() || !('IntersectionObserver' in window)) return;

    nodes.forEach(function (n) {
      n.style.clipPath = 'inset(0 0 100% 0)';
      n.style.transition = 'clip-path 900ms cubic-bezier(.16,.84,.44,1)';
    });
    var open = function (n) {
      if (n.dataset.revealed) return;
      n.dataset.revealed = '1';
      n.style.clipPath = 'inset(0 0 0 0)';
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { open(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    nodes.forEach(function (n) { io.observe(n); });

    var sweep = function () {
      var pending = 0;
      nodes.forEach(function (n) {
        if (n.dataset.revealed) return;
        if (n.getBoundingClientRect().top > window.innerHeight * 0.94) { pending++; return; }
        open(n);
      });
      if (!pending) window.removeEventListener('scroll', sweep);
    };
    setTimeout(sweep, 1400);
    window.addEventListener('scroll', sweep, { passive: true });
  }

  /* ---------------------------------------------------------------- ident */
  /* Short opening: three words, once per session, then out of the way. */
  function ident() {
    var el = document.querySelector('[data-ident]');
    if (!el) return;
    var done = function () { if (el.parentNode) el.parentNode.removeChild(el); };
    var seen = false;
    try { seen = sessionStorage.getItem('tg-ident') === '1'; } catch (err) { seen = false; }
    if (seen || reduced()) { done(); return; }
    try { sessionStorage.setItem('tg-ident', '1'); } catch (err) {}

    var words = slice(el.querySelectorAll('[data-ident-word]'));
    el.style.display = 'flex';
    var step = 190;
    words.forEach(function (w, i) {
      setTimeout(function () {
        words.forEach(function (o) { o.style.opacity = '0'; o.style.transform = 'translate3d(0,-12%,0)'; });
        w.style.transition = 'opacity 110ms linear, transform 280ms cubic-bezier(.2,.9,.2,1)';
        w.style.opacity = '1';
        w.style.transform = 'translate3d(0,0,0)';
      }, i * step);
    });
    setTimeout(function () {
      el.style.transition = 'clip-path 420ms cubic-bezier(.6,0,.2,1)';
      el.style.clipPath = 'inset(0 0 100% 0)';
      setTimeout(done, 460);
    }, words.length * step + 120);
    // Never let the overlay outlive its animation.
    setTimeout(done, words.length * step + 1200);
  }

  /* ------------------------------------------------------- hero: noise → clarity */
  function heroIntro() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) return;

    var lines = slice(hero.querySelectorAll('[data-hero-line]'));
    var bits = slice(hero.querySelectorAll('[data-hero-el]'));
    var layer = hero.querySelector('[data-noise-layer]');

    if (reduced()) return;   // everything already in its resting state

    // Hidden state is set here, in JS, so it can never persist without JS.
    lines.forEach(function (l) { l.style.transform = 'translate3d(0,105%,0)'; });
    bits.forEach(function (b) { b.style.opacity = '0'; b.style.transform = 'translate3d(0,16px,0)'; });

    var settle = function () {
      lines.forEach(function (l, i) {
        l.style.transition = 'transform 900ms cubic-bezier(.16,.84,.44,1) ' + (i * 90) + 'ms';
        l.style.transform = 'translate3d(0,0,0)';
      });
      bits.forEach(function (b, i) {
        b.style.transition = 'opacity 620ms ease ' + (320 + i * 90) + 'ms, transform 760ms cubic-bezier(.16,.84,.44,1) ' + (320 + i * 90) + 'ms';
        b.style.opacity = '1';
        b.style.transform = 'translate3d(0,0,0)';
      });
      if (layer) {
        layer.style.transition = 'opacity 420ms ease';
        layer.style.opacity = '0';
        setTimeout(function () { layer.innerHTML = ''; }, 520);
      }
    };

    // Scatter a short burst of fragments over the headline, then clear them.
    if (layer) {
      var words = ['SIGNAL', 'NOISE', '////', 'CLARITY', '——', '01', 'TG', '###'];
      var f = document.createDocumentFragment();
      for (var i = 0; i < words.length; i++) {
        var s = document.createElement('span');
        s.textContent = words[i];
        s.style.left = (Math.random() * 82) + '%';
        s.style.top = (Math.random() * 74) + '%';
        s.style.transform = 'rotate(' + (Math.random() * 16 - 8).toFixed(1) + 'deg)';
        s.style.opacity = String(0.18 + Math.random() * 0.3);
        s.style.transition = 'opacity 260ms linear';
        f.appendChild(s);
      }
      layer.appendChild(f);
      // Flicker the fragments briefly — the "noise" before it resolves.
      var flicks = 0;
      var flick = setInterval(function () {
        slice(layer.children).forEach(function (c) {
          c.style.opacity = String(0.12 + Math.random() * 0.34);
        });
        if (++flicks > 6) clearInterval(flick);
      }, 90);
    }

    // Whole sequence lands inside ~1.2s.
    requestAnimationFrame(function () { setTimeout(settle, 260); });
    // Belt and braces: if anything above throws or is delayed, force the
    // resting state so the headline can never stay off screen.
    setTimeout(function () {
      lines.forEach(function (l) { l.style.transform = 'translate3d(0,0,0)'; });
      bits.forEach(function (b) { b.style.opacity = '1'; b.style.transform = 'none'; });
      if (layer) layer.innerHTML = '';
    }, 2400);
  }

  /* --------------------------------------------------- hero: noise/clarity rail */
  function noiseRail() {
    slice(document.querySelectorAll('[data-noise-rail]')).forEach(function (rail) {
      var range = rail.querySelector('[data-noise-range]');
      var demo = rail.querySelector('[data-noise-demo]');
      if (!range || !demo) return;
      var marks = slice(demo.querySelectorAll('.noise-demo__mark'));
      var jitter = marks.map(function () { return { y: Math.random() * 16 - 8, r: Math.random() * 26 - 13 }; });
      var update = function () {
        var t = clamp(parseFloat(range.value) / 100, 0, 1);
        marks.forEach(function (m, i) {
          var j = jitter[i];
          m.style.transform = 'translate3d(0,' + lerp(j.y, 0, t).toFixed(1) + 'px,0) rotate(' + lerp(j.r, 0, t).toFixed(1) + 'deg)';
          m.style.opacity = String(lerp(0.4, 1, t));
          m.style.background = t > 0.7 ? 'var(--cobalt)' : 'var(--stone)';
        });
        range.setAttribute('aria-valuetext', t < 0.34 ? 'Noise' : t < 0.7 ? 'Resolving' : 'Clarity');
      };
      range.addEventListener('input', update);
      update();
    });
  }

  /* ------------------------------------------------------ transformation rows */
  function transformReveal() {
    var list = document.querySelector('[data-transform-list]');
    if (!list) return;
    var rows = slice(list.querySelectorAll('[data-transform-row]'));
    if (!rows.length) return;
    if (reduced() || !('IntersectionObserver' in window)) {
      rows.forEach(function (r) { r.classList.add('is-resolved'); });
      return;
    }
    list.classList.add('transform--enhanced');

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = rows.indexOf(e.target);
        e.target.style.transitionDelay = (i % 4) * 90 + 'ms';
        e.target.classList.add('is-resolved');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.25 });
    rows.forEach(function (r) { io.observe(r); });

    var sweep = function () {
      var pending = 0;
      rows.forEach(function (r) {
        if (r.classList.contains('is-resolved')) return;
        if (r.getBoundingClientRect().top > window.innerHeight * 0.96) { pending++; return; }
        r.classList.add('is-resolved');
      });
      if (!pending) window.removeEventListener('scroll', sweep);
    };
    setTimeout(sweep, 1600);
    window.addEventListener('scroll', sweep, { passive: true });
  }

  /* ------------------------------------------------- services scroll takeover */
  /* Each discipline holds the whole viewport in turn. Static markup is a plain
     stack of coloured panels; this upgrades it to a pinned sequence, and tears
     back down cleanly if the viewport becomes too small for it. */
  function servicesTakeover() {
    var svc = document.querySelector('[data-svc]');
    if (!svc) return;
    var stage = svc.querySelector('[data-svc-stage]');
    var viewport = svc.querySelector('[data-svc-viewport]');
    var panels = slice(svc.querySelectorAll('[data-svc-panel]'));
    var rail = svc.querySelector('[data-svc-rail]');
    if (!stage || !viewport || panels.length < 2) return;

    var enhanced = false;
    var active = -1;
    var buttons = [];
    var loopItem = null;

    var fits = function () {
      return !reduced() && window.innerWidth >= 760 && window.innerHeight >= 560;
    };

    function setActive(i, focusPanel) {
      i = clamp(i, 0, panels.length - 1);
      if (i === active) return;
      active = i;
      panels.forEach(function (p, n) { p.classList.toggle('is-active', n === i); });
      buttons.forEach(function (b, n) { b.setAttribute('aria-current', n === i ? 'true' : 'false'); });
      if (focusPanel) {
        var h = panels[i].querySelector('.svc__title');
        if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      }
    }

    function scrollToPanel(i) {
      // Document offset, not offsetTop — the stage sits inside a positioned
      // parent, so offsetTop is relative to that and would land far short.
      var docTop = stage.getBoundingClientRect().top + window.pageYOffset;
      var top = docTop + (stage.offsetHeight - window.innerHeight) * (i / (panels.length - 1));
      window.scrollTo({ top: top, behavior: reduced() ? 'auto' : 'smooth' });
    }

    function buildRail() {
      if (!rail || buttons.length) return;
      panels.forEach(function (p, i) {
        var b = document.createElement('button');
        b.type = 'button';
        var label = p.getAttribute('data-svc-label') || ('Section ' + (i + 1));
        b.setAttribute('aria-label', label);
        b.setAttribute('aria-current', i === 0 ? 'true' : 'false');
        b.addEventListener('click', function () { scrollToPanel(i); setActive(i, true); });
        rail.appendChild(b);
        buttons.push(b);
      });
    }

    function measure() {
      stage.style.height = (panels.length * window.innerHeight) + 'px';
    }

    function enable() {
      if (enhanced) return;
      enhanced = true;
      svc.classList.add('svc--enhanced');
      buildRail();
      measure();
      loopItem = {
        el: stage,
        run: function (r) {
          var travel = stage.offsetHeight - window.innerHeight;
          var p = clamp(-r.top / (travel || 1), 0, 1);
          setActive(Math.round(p * (panels.length - 1)));
        }
      };
      items.push(loopItem);
      setActive(0);
      schedule();
    }

    function disable() {
      if (!enhanced) return;
      enhanced = false;
      svc.classList.remove('svc--enhanced');
      stage.style.height = '';
      panels.forEach(function (p) { p.classList.remove('is-active'); });
      active = -1;
      var idx = items.indexOf(loopItem);
      if (idx > -1) items.splice(idx, 1);
      loopItem = null;
    }

    function evaluate() { if (fits()) { enable(); measure(); } else { disable(); } }

    evaluate();

    // Keyboard: arrow keys move between disciplines while the rail has focus.
    if (rail) {
      rail.addEventListener('keydown', function (e) {
        if (!enhanced) return;
        var d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
              : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var next = clamp(active + d, 0, panels.length - 1);
        scrollToPanel(next);
        setActive(next);
        if (buttons[next]) buttons[next].focus();
      });
    }

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(evaluate, 150);
    }, { passive: true });
  }

  /* --------------------------------------------------------------- marquee */
  function marquee() {
    var m = document.querySelector('[data-marquee]');
    if (!m || reduced()) return;
    var groups = slice(m.children);
    if (!groups.length) return;

    var x = 0, w = 0, running = false, raf = 0, last = 0;

    var measure = function () { w = groups[0].getBoundingClientRect().width; };
    measure();

    var tick = function (t) {
      if (!running) return;
      if (!last) last = t;
      var dt = Math.min(t - last, 64);
      last = t;
      x -= dt * 0.035;
      if (w && x <= -w) x += w;
      m.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      raf = requestAnimationFrame(tick);
    };

    // Only animate while the strip is actually on screen.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !running) { running = true; last = 0; raf = requestAnimationFrame(tick); }
        else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
      });
    }, { threshold: 0 });
    io.observe(m);

    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(measure, 200); }, { passive: true });
  }

  /* ---------------------------------------------------------- process line */
  /* One cobalt line that physically travels between the four stages, tangled at
     the top of the section and resolved by the bottom. */
  function processLine() {
    var track = document.querySelector('[data-process-track]');
    if (!track) return;
    var svg = track.querySelector('[data-process-svg]');
    var path = track.querySelector('[data-process-path]');
    var steps = slice(track.querySelectorAll('[data-process-step]'));
    if (!svg || !path || steps.length < 2) return;

    track.classList.add('process--enhanced');

    var pts = [];
    var noise = [];
    var W = 0, H = 0, len = 0;

    function measure() {
      var tr = track.getBoundingClientRect();
      W = Math.round(tr.width); H = Math.round(track.offsetHeight);
      svg.setAttribute('width', W);
      svg.setAttribute('height', H);
      svg.style.width = W + 'px';
      svg.style.height = H + 'px';

      pts = steps.map(function (s) {
        var r = s.getBoundingClientRect();
        var idx = s.querySelector('.process__step-index');
        var ir = idx ? idx.getBoundingClientRect() : r;
        return {
          x: clamp(ir.left - tr.left + 4, 6, W - 6),
          y: ir.top - tr.top + ir.height / 2
        };
      });
      // A fixed wobble per segment, scaled down as the line resolves.
      if (noise.length !== pts.length) {
        noise = pts.map(function () {
          return { a: (Math.random() * 2 - 1), b: (Math.random() * 2 - 1) };
        });
      }
    }

    function build(p) {
      if (!pts.length) return '';
      var amp = (1 - p) * Math.min(W * 0.42, 300);
      var d = 'M ' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i];
        var dy = (b.y - a.y) * 0.42;
        var c1x = a.x + noise[i - 1].a * amp, c1y = a.y + dy;
        var c2x = b.x + noise[i].b * amp, c2y = b.y - dy;
        d += ' C ' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ', ' +
                     c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ', ' +
                     b.x.toFixed(1) + ' ' + b.y.toFixed(1);
      }
      return d;
    }

    function draw(p) {
      path.setAttribute('d', build(p));
      if (!len) { try { len = path.getTotalLength(); } catch (e) { len = 0; } }
      if (len) {
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = (len * (1 - clamp(p * 1.15, 0, 1))).toFixed(1);
      }
      steps.forEach(function (s, i) {
        s.classList.toggle('is-active', p >= (i / steps.length) * 0.92);
      });
    }

    measure();

    if (reduced()) { draw(1); return; }

    draw(0);
    items.push({
      el: track,
      run: function (r, vh) {
        // 0 as the section arrives, 1 once it has travelled a screen past.
        var p = clamp((vh * 0.85 - r.top) / (r.height * 0.85 + vh * 0.2), 0, 1);
        draw(ease(p));
      }
    });

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { len = 0; measure(); schedule(); }, 160);
    }, { passive: true });

    schedule();
  }

  /* ------------------------------------------------------- work hover preview */
  /* Desktop pointer affordance only. Touch and keyboard get the plain index,
     which already carries every link and label. */
  function workPreview() {
    var rows = slice(document.querySelectorAll('[data-preview]'));
    if (!rows.length || reduced() || !fine() || window.innerWidth < 1000) return;

    var box = document.createElement('div');
    box.className = 'work-preview';
    box.setAttribute('aria-hidden', 'true');
    var img = document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    box.appendChild(img);
    document.body.appendChild(box);

    var tx = 0, ty = 0, cx = 0, cy = 0, running = false, current = null;

    function loop() {
      cx = lerp(cx, tx, 0.16);
      cy = lerp(cy, ty, 0.16);
      box.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) scale(' + (current ? 1 : 0.94) + ')';
      if (Math.abs(cx - tx) > 0.4 || Math.abs(cy - ty) > 0.4) requestAnimationFrame(loop);
      else running = false;
    }

    rows.forEach(function (row) {
      var src = row.getAttribute('data-preview');
      if (!src) return;
      row.addEventListener('pointerenter', function (e) {
        current = row;
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
        tx = e.clientX; ty = e.clientY;
        if (!cx && !cy) { cx = tx; cy = ty; }
        box.classList.add('is-visible');
        if (!running) { running = true; requestAnimationFrame(loop); }
      });
      row.addEventListener('pointermove', function (e) {
        tx = e.clientX; ty = e.clientY;
        if (!running) { running = true; requestAnimationFrame(loop); }
      });
      row.addEventListener('pointerleave', function () {
        current = null;
        box.classList.remove('is-visible');
      });
    });
  }

  /* --------------------------------------------------------------- mobile nav */
  function mobileNav() {
    var det = document.querySelector('.mobile-nav');
    if (!det) return;
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && det.hasAttribute('open')) {
        det.removeAttribute('open');
        var toggle = det.querySelector('summary');
        if (toggle) toggle.focus();
      }
    });
  }

  /* ----------------------------------------------------------- route wipe */
  function isInternalPage(href) {
    if (!href || href.charAt(0) === '#') return false;
    if (/^https?:\/\//i.test(href) || href.indexOf('//') === 0) return false;
    if (/^mailto:|^tel:/i.test(href)) return false;
    return /\.html(\?|#|$)/i.test(href);
  }

  function routeWipe() {
    if (reduced()) return;
    var veil = document.createElement('div');
    veil.className = 'route-veil';
    veil.setAttribute('aria-hidden', 'true');
    document.body.appendChild(veil);

    var lifted = false;
    var lift = function () {
      if (lifted) return;
      lifted = true;
      veil.style.transition = 'transform 340ms cubic-bezier(.5,0,.2,1)';
      veil.style.transform = 'scaleY(0)';
    };

    requestAnimationFrame(function () {
      veil.style.transform = 'scaleY(1)';
      requestAnimationFrame(lift);
    });
    // The veil must never survive a dropped frame or a backgrounded tab.
    setTimeout(lift, 520);

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      var href = a.getAttribute('href');
      if (!isInternalPage(href)) return;
      e.preventDefault();
      // Alternate the wipe colour so navigation has a bit of life to it.
      veil.classList.toggle('route-veil--signal', Math.random() > 0.5);
      veil.style.transformOrigin = 'top';
      veil.style.transition = 'transform 260ms cubic-bezier(.5,0,.2,1)';
      veil.style.transform = 'scaleY(1)';
      var go = function () { window.location.href = href; };
      setTimeout(go, 240);
    });

    window.addEventListener('pageshow', function (ev) {
      if (!ev.persisted) return;
      veil.style.transition = 'none';
      veil.style.transform = 'scaleY(0)';
    });
  }

  /* ----------------------------------------------------------------- boot */
  var booted = false;
  function init() {
    if (booted) return;
    booted = true;

    // Only now may the CSS hide anything for animation.
    root.classList.add('js-motion');

    ident();
    heroIntro();
    noiseRail();
    rise();
    cropReveal();
    transformReveal();
    servicesTakeover();
    marquee();
    processLine();
    workPreview();
    mobileNav();
    routeWipe();

    window.addEventListener('scroll', schedule, { passive: true });
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(schedule, 120);
      schedule();
    }, { passive: true });
    schedule();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ============================================================
     ENQUIRY FORM — Start a project. Works as a normal POST with JS
     off; enhanced here with inline validation, fetch submission and
     a success / failure state.
     ============================================================ */
  function enquiryForm() {
    var root = document.querySelector('[data-enquiry]');
    if (!root) return;
    var form = root.querySelector('form');
    var panelForm = root.querySelector('[data-enquiry-form]');
    var panelSent = root.querySelector('[data-enquiry-sent]');
    var alertBox = root.querySelector('[data-enquiry-alert]');
    if (!form || !panelForm || !panelSent) return;
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLabel = submitBtn ? submitBtn.innerHTML : 'Send';

    var fields = {
      name: form.elements['name'],
      email: form.elements['email'],
      message: form.elements['message'],
      consent: form.elements['consent']
    };

    function clearErrors() {
      slice(form.querySelectorAll('[data-error-for]')).forEach(function (el) {
        el.textContent = '';
        el.hidden = true;
      });
      if (alertBox) { alertBox.hidden = true; alertBox.textContent = ''; }
    }

    function showError(name, message) {
      var el = form.querySelector('[data-error-for="' + name + '"]');
      if (el) { el.textContent = message; el.hidden = false; }
    }

    function validate() {
      var errors = {};
      var name = (fields.name.value || '').trim();
      var email = (fields.email.value || '').trim();
      var message = (fields.message.value || '').trim();
      if (!name) errors.name = 'Please add your name so I know who I am replying to.';
      if (!email) errors.email = 'An email address is needed for a reply.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'That email address does not look complete.';
      if (message.length < 10) errors.message = 'A sentence or two about the project, whatever you have.';
      if (!fields.consent.checked) errors.consent = 'Please tick the box so I can reply to you.';
      return errors;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();
      var errors = validate();
      var keys = Object.keys(errors);
      if (keys.length) {
        keys.forEach(function (k) { showError(k, errors[k]); });
        var first = form.elements[keys[0]];
        if (first && first.focus) first.focus();
        return;
      }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      }).then(function (r) {
        if (!r.ok) throw new Error('Request rejected');
        panelForm.hidden = true;
        panelSent.hidden = false;
        panelSent.setAttribute('tabindex', '-1');
        panelSent.focus();
      }).catch(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = submitLabel; }
        if (alertBox) {
          alertBox.hidden = false;
          alertBox.textContent = 'Something went wrong sending that — most likely at my end, not yours. Email tom@tgmedia.uk and I will pick it up straight away.';
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enquiryForm);
  } else {
    enquiryForm();
  }

  /* ---------------------------------------------------------------- year */
  slice(document.querySelectorAll('[data-year]')).forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
