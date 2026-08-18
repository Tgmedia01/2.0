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

  /* --------------------------------------------------- hero: title card */
  /* The headline tunes in from static: lines rise into place while the two
     display words resolve character by character out of glyph noise. Hidden
     and scrambled states are set here, in JS, so they can never persist
     without it; a sweep forces the resting state as a safety net. */
  function cineHero() {
    var hero = document.querySelector('[data-cine-hero]');
    if (!hero) return;
    if (reduced()) return;

    var lines = slice(hero.querySelectorAll('[data-cine-line]'));
    var bits = slice(hero.querySelectorAll('[data-cine-el]'));
    var carrier = hero.querySelector('[data-cine-carrier]');
    var scrambles = slice(hero.querySelectorAll('[data-scramble]'));
    var originals = scrambles.map(function (el) { return el.textContent; });
    var glyphs = '#/\\|<>+=*';

    lines.forEach(function (l) { l.style.transform = 'translate3d(0,110%,0)'; });
    bits.forEach(function (b) { b.style.opacity = '0'; b.style.transform = 'translate3d(0,16px,0)'; });
    if (carrier) { carrier.style.transform = 'scaleX(0)'; carrier.style.transformOrigin = 'left'; }

    var settle = function () {
      lines.forEach(function (l, i) {
        l.style.transition = 'transform 900ms cubic-bezier(.16,.84,.44,1) ' + (i * 110) + 'ms';
        l.style.transform = 'translate3d(0,0,0)';
      });
      bits.forEach(function (b, i) {
        b.style.transition = 'opacity 620ms ease ' + (420 + i * 90) + 'ms, transform 760ms cubic-bezier(.16,.84,.44,1) ' + (420 + i * 90) + 'ms';
        b.style.opacity = '1';
        b.style.transform = 'translate3d(0,0,0)';
      });
      if (carrier) {
        carrier.style.transition = 'transform 1100ms cubic-bezier(.16,.84,.44,1) 480ms';
        carrier.style.transform = 'scaleX(1)';
      }
    };

    scrambles.forEach(function (el, n) {
      var txt = originals[n];
      var dur = 780;
      var start = null;
      var step = function (t) {
        if (el.dataset.resolved) return;
        if (!start) start = t;
        var p = clamp((t - start) / dur, 0, 1);
        var keep = Math.floor(p * txt.length);
        var out = txt.slice(0, keep);
        for (var i = keep; i < txt.length; i++) {
          var c = txt.charAt(i);
          out += (c === ' ' || c === '.') ? c : glyphs.charAt((Math.random() * glyphs.length) | 0);
        }
        el.textContent = out;
        if (p < 1) requestAnimationFrame(step);
        else { el.textContent = txt; el.dataset.resolved = '1'; }
      };
      setTimeout(function () { requestAnimationFrame(step); }, 360 + n * 200);
    });

    requestAnimationFrame(function () { setTimeout(settle, 240); });

    // Belt and braces: whatever happens above, force the resting state.
    setTimeout(function () {
      lines.forEach(function (l) { l.style.transform = 'translate3d(0,0,0)'; });
      bits.forEach(function (b) { b.style.opacity = '1'; b.style.transform = 'none'; });
      if (carrier) carrier.style.transform = 'scaleX(1)';
      scrambles.forEach(function (el, n) { el.dataset.resolved = '1'; el.textContent = originals[n]; });
    }, 2600);
  }

  /* -------------------------------------------------- services channels */
  /* Four disciplines as channels: one open at a time, and the open one
     floods with its own colour. Static markup renders every channel open;
     collapse only exists once this has taken over. */
  function channels() {
    var sec = document.querySelector('[data-chan-sec]');
    if (!sec) return;
    var chans = slice(sec.querySelectorAll('[data-chan]'));
    if (!chans.length) return;
    sec.classList.add('chan-sec--enhanced');

    var sync = function () {
      chans.forEach(function (c) {
        var b = c.querySelector('[data-chan-toggle]');
        if (b) b.setAttribute('aria-expanded', c.classList.contains('is-open') ? 'true' : 'false');
      });
    };
    sync();

    chans.forEach(function (c) {
      var btn = c.querySelector('[data-chan-toggle]');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var willOpen = !c.classList.contains('is-open');
        chans.forEach(function (o) { o.classList.toggle('is-open', o === c && willOpen); });
        sync();
      });
    });
  }

  /* ------------------------------------------------------ signal progress */
  /* A cobalt line across the top of the viewport that charges with scroll —
     the signal strengthening as the page plays. Created entirely here. */
  function signalProgress() {
    if (!document.body.classList.contains('home-broadcast') || reduced()) return;
    var bar = document.createElement('div');
    bar.className = 'signal-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    items.push({
      el: document.documentElement,
      run: function () {
        var doc = document.documentElement;
        var max = doc.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? clamp(window.pageYOffset / max, 0, 1) : 0).toFixed(4) + ')';
      }
    });
    schedule();
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
    cineHero();
    rise();
    cropReveal();
    channels();
    marquee();
    signalProgress();
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
