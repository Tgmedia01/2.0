/* TG Media — motion system, navigation and enquiry form.
   One rAF loop, one pointer loop, no libraries. Every behaviour here is an
   enhancement: with JS off or motion reduced, content is already in its
   resting, readable state (see styles.css for the static fallbacks). */

(function () {
  'use strict';

  var reduced = function () { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var coarse = function () { return window.matchMedia && window.matchMedia('(pointer: coarse)').matches; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var ease = function (t) { return t * t * (3 - 2 * t); };

  /* ------------------------------------------------------------ scrub loop */
  var items = [];
  var ticking = false;
  var settleTimer = 0;

  function schedule() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
    clearTimeout(settleTimer);
    settleTimer = setTimeout(function () { if (ticking) frame(); }, 220);
  }

  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var host = it.host || it.el;
      var r = host.getBoundingClientRect();
      if (it.kind === 'process') {
        if (r.bottom < -300 || r.top > vh + 300) continue;
        var pr = clamp((vh - r.top) / (r.height + vh), 0, 1);
        it.draw(ease(pr));
      } else if (it.kind === 'modes') {
        var mid = vh * 0.5, best = null, bestD = Infinity;
        for (var j = 0; j < it.panels.length; j++) {
          var pr = it.panels[j].getBoundingClientRect();
          var d = Math.abs(pr.top + pr.height / 2 - mid);
          if (d < bestD) { bestD = d; best = it.panels[j]; }
        }
        if (best) it.set(best.getAttribute('data-mode'));
      } else if (it.kind === 'parallax') {
        if (r.bottom < -200 || r.top > vh + 200) continue;
        var pp = (vh - r.top) / (vh + r.height);
        it.el.style.transform = 'translate3d(0,' + ((pp - 0.5) * it.amt).toFixed(2) + 'px,0)';
      } else if (it.kind === 'grow') {
        if (r.bottom < -200 || r.top > vh + 200) continue;
        var pg = ease(clamp((vh - r.top) / (vh * 0.9), 0, 1));
        var inset = (1 - pg) * it.amt;
        it.el.style.clipPath = 'inset(0 ' + inset.toFixed(2) + '% 0 ' + inset.toFixed(2) + '%)';
        it.el.style.transform = 'scale(' + (1 + (1 - pg) * 0.06).toFixed(4) + ')';
      }
    }
  }

  /* ------------------------------------------------------------------ hero: noise → clarity */
  function heroNoise() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) return;
    if (reduced()) { hero.classList.add('is-settled'); return; }
    hero.classList.add('hero--enhanced');
    var layer = hero.querySelector('[data-noise-layer]');
    if (layer) {
      var glyphs = ['SIGNAL', '////', 'NOISE', '—//—', 'CLARITY', '??', 'SIGNAL', '###'];
      var frag = document.createDocumentFragment();
      for (var i = 0; i < glyphs.length; i++) {
        var s = document.createElement('span');
        s.textContent = glyphs[i];
        s.setAttribute('data-noise-active', '');
        s.style.setProperty('--nx', (Math.random() * 34 - 17).toFixed(1) + 'px');
        s.style.setProperty('--ny', (Math.random() * 22 - 11).toFixed(1) + 'px');
        s.style.setProperty('--nsk', (Math.random() * 8 - 4).toFixed(1) + 'deg');
        frag.appendChild(s);
      }
      layer.appendChild(frag);
    }
    setTimeout(function () { hero.classList.add('is-settled'); }, 640);
  }

  /* ---------------------------------------------------- hero: noise/clarity rail */
  function noiseRail() {
    Array.prototype.slice.call(document.querySelectorAll('[data-noise-rail]')).forEach(function (rail) {
      var range = rail.querySelector('[data-noise-range]');
      var demo = rail.querySelector('[data-noise-demo]');
      if (!range || !demo) return;
      var marks = Array.prototype.slice.call(demo.querySelectorAll('.noise-demo__mark'));
      var jitter = marks.map(function () { return { y: Math.random() * 16 - 8, r: Math.random() * 24 - 12 }; });
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

  /* ------------------------------------------------------ transformation reveal */
  function transformReveal() {
    var rows = Array.prototype.slice.call(document.querySelectorAll('[data-transform-row]'));
    if (!rows.length) return;
    if (reduced() || !('IntersectionObserver' in window)) {
      rows.forEach(function (r) { r.classList.add('is-resolved'); });
      return;
    }
    var list = document.querySelector('.transform__list');
    if (list) list.classList.add('transform--enhanced');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-resolved'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0.2 });
    rows.forEach(function (r) { io.observe(r); });
  }

  /* ------------------------------------------------------------- services (cobalt) */
  function servicesCobalt() {
    var root = document.querySelector('[data-svc]');
    if (!root) return;
    var rows = Array.prototype.slice.call(root.querySelectorAll('[data-svc-row]'));
    if (!rows.length) return;
    var list = root.querySelector('.svc-list');
    if (list) list.classList.add('svc--enhanced');
    var pinned = null;

    var apply = function (openRow) {
      rows.forEach(function (row) {
        var open = row === openRow;
        var btn = row.querySelector('.svc-row__head');
        var body = row.querySelector('.svc-row__body');
        if (open) row.setAttribute('data-open', ''); else row.removeAttribute('data-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        body.setAttribute('aria-hidden', open ? 'false' : 'true');
      });
    };

    rows.forEach(function (row) {
      var btn = row.querySelector('.svc-row__head');
      btn.addEventListener('click', function () {
        pinned = pinned === row ? null : row;
        apply(pinned);
      });
      if (!coarse()) {
        row.addEventListener('pointerenter', function () { if (!pinned) apply(row); });
        btn.addEventListener('focus', function () { apply(pinned || row); });
      }
    });
    root.addEventListener('pointerleave', function () { if (!pinned) apply(null); });
    apply(pinned);

    if (!reduced() && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !pinned) { apply(rows[0]); io.disconnect(); }
        });
      }, { threshold: 0.4 });
      io.observe(root);
    }
  }

  /* --------------------------------------------------------------- process line */
  function processLine() {
    var track = document.querySelector('[data-process-track]');
    if (!track) return;
    var svg = track.querySelector('[data-process-svg]');
    var path = track.querySelector('[data-process-path]');
    var steps = Array.prototype.slice.call(track.querySelectorAll('[data-process-step]'));
    if (!svg || !path || !steps.length) return;
    track.classList.add('process--enhanced');

    var n = 22;
    var pts = [];
    for (var i = 0; i < n; i++) pts.push(20 + (Math.random() * 32 - 16));
    var lastH = 0;

    function draw(p) {
      var h = track.clientHeight || 1;
      if (h !== lastH) { lastH = h; svg.setAttribute('viewBox', '0 0 40 ' + h); }
      var d = '';
      for (var j = 0; j < n; j++) {
        var y = (h * j) / (n - 1);
        var x = lerp(pts[j], 20, p);
        d += (j === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
      }
      path.setAttribute('d', d);
      steps.forEach(function (stEl, si) {
        stEl.classList.toggle('is-active', p >= si / steps.length);
      });
    }

    if (reduced()) { draw(1); return; }
    draw(0);
    items.push({ kind: 'process', el: track, host: track, draw: draw });
    schedule();
  }

  /* --------------------------------------------------------------- mobile nav
     The <details>/<summary> toggle already works with no JS at all; this
     only adds the Escape-to-close convenience. */
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

  /* --------------------------------------------------------- pointer drift */
  function pointerDrift() {
    if (reduced() || coarse()) return;
    var targets = Array.prototype.slice.call(document.querySelectorAll('[data-drift]'));
    if (!targets.length) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, running = false;

    window.addEventListener('pointermove', function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });

    function loop() {
      cx = lerp(cx, tx, 0.07);
      cy = lerp(cy, ty, 0.07);
      for (var i = 0; i < targets.length; i++) {
        var amt = parseFloat(targets[i].getAttribute('data-drift')) || 6;
        targets[i].style.transform = 'translate3d(' + (cx * amt).toFixed(2) + 'px,' + (cy * amt).toFixed(2) + 'px,0)';
      }
      if (Math.abs(cx - tx) > 0.001 || Math.abs(cy - ty) > 0.001) requestAnimationFrame(loop);
      else running = false;
    }
  }

  /* ------------------------------------------------------------- magnetic */
  function magnetic() {
    if (reduced() || coarse()) return;
    Array.prototype.slice.call(document.querySelectorAll('[data-magnetic]')).forEach(function (el) {
      var strength = parseFloat(el.getAttribute('data-magnetic')) || 0.25;
      el.style.transition = 'transform 260ms cubic-bezier(.2,.7,.3,1)';
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) * strength;
        var y = (e.clientY - (r.top + r.height / 2)) * strength;
        el.style.transition = 'transform 80ms linear';
        el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform 420ms cubic-bezier(.2,.9,.25,1)';
        el.style.transform = 'translate3d(0,0,0)';
      });
    });
  }

  /* --------------------------------------------------------- crop reveals */
  function cropReveal() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    Array.prototype.slice.call(document.querySelectorAll('[data-parallax]')).forEach(function (el) {
      if (reduced()) return;
      items.push({ kind: 'parallax', el: el, amt: parseFloat(el.getAttribute('data-parallax')) || 40 });
    });
    Array.prototype.slice.call(document.querySelectorAll('[data-grow]')).forEach(function (el) {
      if (reduced()) return;
      el.style.willChange = 'clip-path,transform';
      items.push({ kind: 'grow', el: el, amt: parseFloat(el.getAttribute('data-grow')) || 8 });
    });
    if (!nodes.length) return;
    if (reduced() || !('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.style.clipPath = 'none'; });
      return;
    }

    nodes.forEach(function (n) {
      var dir = n.getAttribute('data-reveal') || 'up';
      n.style.clipPath = dir === 'side' ? 'inset(0 100% 0 0)' : 'inset(0 0 100% 0)';
      n.style.transition = 'clip-path 720ms cubic-bezier(.16,.84,.44,1)';
      var cap = n.nextElementSibling;
      if (cap && cap.hasAttribute && cap.hasAttribute('data-reveal-caption')) {
        cap.style.opacity = '0';
        cap.style.transform = 'translateY(10px)';
        cap.style.transition = 'opacity 380ms ease 240ms, transform 380ms cubic-bezier(.2,.7,.3,1) 240ms';
      }
    });

    var open = function (n) {
      if (n.dataset.revealed) return;
      n.dataset.revealed = '1';
      n.style.clipPath = 'inset(0 0 0 0)';
      var cap = n.nextElementSibling;
      if (cap && cap.hasAttribute && cap.hasAttribute('data-reveal-caption')) {
        cap.style.opacity = '1';
        cap.style.transform = 'none';
      }
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
    setTimeout(sweep, 1200);
    window.addEventListener('scroll', sweep, { passive: true });
  }

  /* ------------------------------------------------------- services modes */
  function modes() {
    var root = document.querySelector('[data-modes]');
    if (!root) return;
    var panels = Array.prototype.slice.call(root.querySelectorAll('[data-mode]'));
    var words = Array.prototype.slice.call(root.querySelectorAll('[data-mode-word]'));
    var bar = root.querySelector('[data-mode-bar]');
    if (!panels.length) return;

    var stack = words.length ? words[0].parentNode : null;

    var setActive = function (name) {
      if (root.dataset.active === name) return;
      root.dataset.active = name;
      words.forEach(function (w) {
        var on = w.getAttribute('data-mode-word') === name;
        w.style.opacity = on ? '1' : '0';
        w.style.transform = on ? 'translate3d(0,0,0)' : 'translate3d(0,' + (w.dataset.passed ? '-' : '') + '18%,0)';
        if (on) words.forEach(function (o) { if (o !== w) o.dataset.passed = '1'; });
      });
      panels.forEach(function (p) {
        var on = p.getAttribute('data-mode') === name;
        var head = p.querySelector('h2, [data-mode-head]');
        if (head) head.style.color = on ? '#070707' : '#A2A2A9';
        var idx = p.querySelector('[data-mode-index]');
        if (idx) idx.style.color = on ? '#2445FF' : '#A2A2A9';
      });
      if (bar) {
        var i = panels.findIndex(function (p) { return p.getAttribute('data-mode') === name; });
        bar.style.transform = 'translate3d(0,' + (i * 100) + '%,0)';
      }
    };

    words.forEach(function (w, i) {
      w.style.transition = reduced() ? 'none' : 'opacity 320ms ease, transform 460ms cubic-bezier(.2,.8,.25,1)';
      w.style.opacity = i === 0 ? '1' : '0';
    });
    panels.forEach(function (p) { p.style.transition = reduced() ? 'none' : 'color 320ms ease'; });
    if (bar) bar.style.transition = reduced() ? 'none' : 'transform 460ms cubic-bezier(.2,.8,.25,1)';

    panels.forEach(function (p) {
      var name = p.getAttribute('data-mode');
      p.addEventListener('pointerenter', function () { setActive(name); });
      p.addEventListener('focusin', function () { setActive(name); });
    });

    if (reduced()) {
      if (stack) { stack.style.height = 'auto'; stack.style.display = 'flex'; stack.style.flexDirection = 'column'; }
      words.forEach(function (w) { w.style.opacity = '1'; w.style.position = 'static'; w.style.transform = 'none'; });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.getAttribute('data-mode')); });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    panels.forEach(function (p) { io.observe(p); });
    setActive(panels[0].getAttribute('data-mode'));
    items.push({ kind: 'modes', el: root, host: root, panels: panels, set: setActive });
    schedule();
  }

  /* ---------------------------------------------------------------- ident */
  function ident() {
    var el = document.querySelector('[data-ident]');
    if (!el) return;
    var done = function () { el.parentNode && el.parentNode.removeChild(el); };
    var seen = false;
    try { seen = sessionStorage.getItem('tg-ident') === '1'; } catch (err) { seen = false; }
    if (seen || reduced()) { done(); return; }
    try { sessionStorage.setItem('tg-ident', '1'); } catch (err) {}

    var words = Array.prototype.slice.call(el.querySelectorAll('[data-ident-word]'));
    el.style.display = 'flex';
    words.forEach(function (w, i) {
      setTimeout(function () {
        words.forEach(function (o) { o.style.opacity = '0'; o.style.transform = 'translate3d(0,-14%,0)'; });
        w.style.transition = 'opacity 120ms linear, transform 320ms cubic-bezier(.2,.9,.2,1)';
        w.style.opacity = '1';
        w.style.transform = 'translate3d(0,0,0)';
      }, i * 300);
    });
    setTimeout(function () {
      el.style.transition = 'clip-path 420ms cubic-bezier(.6,0,.2,1)';
      el.style.clipPath = 'inset(0 0 100% 0)';
      setTimeout(done, 460);
    }, words.length * 300 + 120);
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
      veil.style.transition = 'transform 300ms cubic-bezier(.5,0,.2,1)';
      veil.style.transform = 'scaleY(0)';
    };

    requestAnimationFrame(function () {
      veil.style.transform = 'scaleY(1)';
      requestAnimationFrame(lift);
    });
    // Content must never stay hidden behind the veil if a frame never fires
    // (backgrounded tab, throttled rAF) — the same guarantee cropReveal makes.
    setTimeout(lift, 500);

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      var href = a.getAttribute('href');
      if (!isInternalPage(href)) return;
      e.preventDefault();
      veil.style.transformOrigin = 'top';
      veil.style.transition = 'transform 230ms cubic-bezier(.5,0,.2,1)';
      veil.style.transform = 'scaleY(1)';
      setTimeout(function () { window.location.href = href; }, 210);
    });

    window.addEventListener('pageshow', function (ev) {
      if (!ev.persisted) return;
      veil.style.transition = 'none';
      veil.style.transform = 'scaleY(0)';
    });
  }

  /* ----------------------------------------------------------------- boot */
  var booted = false;
  function initMotion() {
    if (booted) return;
    booted = true;
    ident();
    heroNoise();
    noiseRail();
    transformReveal();
    servicesCobalt();
    processLine();
    mobileNav();
    cropReveal();
    modes();
    pointerDrift();
    magnetic();
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
    document.addEventListener('DOMContentLoaded', initMotion);
  } else {
    initMotion();
  }

  /* ============================================================
     ENQUIRY FORM — Start a project. Endpoint and budget bands are
     the only two things a future CMS or provider change needs to
     touch. Works as a normal POST with JS off; enhanced with
     inline validation, fetch submission and a success/fail state.
     ============================================================ */
  function enquiryForm() {
    var root = document.querySelector('[data-enquiry]');
    if (!root) return;
    var form = root.querySelector('form');
    var panelForm = root.querySelector('[data-enquiry-form]');
    var panelSent = root.querySelector('[data-enquiry-sent]');
    var alertBox = root.querySelector('[data-enquiry-alert]');
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLabel = submitBtn.textContent;

    var fields = {
      name: form.elements['name'],
      email: form.elements['email'],
      message: form.elements['message'],
      consent: form.elements['consent']
    };

    function clearErrors() {
      Array.prototype.slice.call(form.querySelectorAll('[data-error-for]')).forEach(function (el) {
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

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      var data = new FormData(form);
      fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      }).then(function (r) {
        if (!r.ok) throw new Error('Request rejected');
        panelForm.hidden = true;
        panelSent.hidden = false;
        panelSent.focus && panelSent.setAttribute('tabindex', '-1');
        panelSent.focus();
      }).catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
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
  Array.prototype.slice.call(document.querySelectorAll('[data-year]')).forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
