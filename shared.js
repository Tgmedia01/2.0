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
      if (it.kind === 'frag' || it.kind === 'heroline' || it.kind === 'heroend') {
        var travel = it.stage.offsetHeight - (it.pin ? it.pin.clientHeight : vh);
        var p = clamp((-it.stage.getBoundingClientRect().top) / (travel || 1), 0, 1);
        applyHero(it, p);
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

  function setupFrag(it) {
    var el = it.el, f = it.f;
    el.style.left = f[0] + '%';
    el.style.top = f[1] + '%';
    el.style.width = f[2] + '%';
    el.style.height = f[3] + '%';
    el.style.transformOrigin = '0 0';
    el.style.willChange = 'transform';
    var img = el.firstElementChild;
    if (img) { img.style.transformOrigin = '0 0'; img.style.willChange = 'transform'; }
    layoutFrag(it);
  }

  function layoutFrag(it) {
    var img = it.el.firstElementChild;
    if (!img || !it.pin) return;
    var pw = it.pin.clientWidth, ph = it.pin.clientHeight;
    img.style.width = pw + 'px';
    img.style.height = ph + 'px';
    img.style.left = '-' + (it.f[0] / 100 * pw).toFixed(1) + 'px';
    img.style.top = '-' + (it.f[1] / 100 * ph).toFixed(1) + 'px';
  }

  function applyHero(it, p) {
    if (it.kind === 'frag') {
      var e = ease(clamp((p - it.delay) / (1 - it.delay), 0, 1));
      var s = it.s, f = it.f;
      var cx = lerp(s[0], f[0], e), cy = lerp(s[1], f[1], e);
      var sx = lerp(s[2], f[2], e) / f[2], sy = lerp(s[3], f[3], e) / f[3];
      var tx = (cx - f[0]) / f[2] * 100, ty = (cy - f[1]) / f[3] * 100;
      it.el.style.transform = 'translate(' + tx.toFixed(3) + '%,' + ty.toFixed(3) + '%) scale(' + sx.toFixed(4) + ',' + sy.toFixed(4) + ')';
      var img = it.el.firstElementChild;
      if (img) img.style.transform = 'scale(' + (1 / sx).toFixed(4) + ',' + (1 / sy).toFixed(4) + ')';
      it.p = e;
    } else if (it.kind === 'heroline') {
      var out = ease(clamp((p - 0.18) / 0.42, 0, 1));
      it.el.style.transform = 'translate3d(' + (it.tx * out).toFixed(2) + 'vw,' + (it.ty * out).toFixed(2) + 'vh,0)';
      it.el.style.opacity = String(1 - clamp((p - 0.3) / 0.3, 0, 1));
    } else if (it.kind === 'heroend') {
      var inn = clamp((p - 0.72) / 0.24, 0, 1);
      it.el.style.opacity = String(inn);
      it.el.style.transform = 'translate3d(0,' + ((1 - inn) * 2.4).toFixed(2) + 'vh,0)';
      var live = inn > 0.6;
      it.el.style.pointerEvents = live ? 'auto' : 'none';
      if (it.live !== live) {
        it.live = live;
        it.el.setAttribute('aria-hidden', live ? 'false' : 'true');
        Array.prototype.slice.call(it.el.querySelectorAll('a')).forEach(function (a) { a.tabIndex = live ? 0 : -1; });
      }
    }
  }

  /* ------------------------------------------------------------------ hero */
  function hero() {
    var stage = document.querySelector('[data-hero-stage]');
    if (!stage) return;
    var pin = stage.querySelector('[data-hero-pin]');
    var frags = Array.prototype.slice.call(stage.querySelectorAll('[data-frag]'));
    var lines = Array.prototype.slice.call(stage.querySelectorAll('[data-heroline]'));
    var end = stage.querySelector('[data-heroend]');
    var mobile = window.innerWidth < 760;

    frags.forEach(function (el, i) {
      var spec = el.getAttribute('data-frag').split('|');
      var key = mobile && el.hasAttribute('data-frag-m') ? el.getAttribute('data-frag-m').split('|') : spec;
      var s = key[0].split(',').map(Number);
      var f = key[1].split(',').map(Number);
      if (mobile && el.hasAttribute('data-frag-hide')) { el.style.display = 'none'; return; }
      var it = { kind: 'frag', el: el, stage: stage, pin: pin, s: s, f: f, delay: i * 0.04 };
      setupFrag(it);
      items.push(it);
      applyHero(it, reduced() ? 1 : 0);
    });

    lines.forEach(function (el) {
      var t = el.getAttribute('data-heroline').split(',').map(Number);
      var it = { kind: 'heroline', el: el, stage: stage, pin: pin, tx: mobile ? t[0] * 0.4 : t[0], ty: t[1] };
      items.push(it);
      applyHero(it, 0);
    });

    if (end) {
      var it2 = { kind: 'heroend', el: end, stage: stage, pin: pin };
      items.push(it2);
      applyHero(it2, reduced() ? 1 : 0);
    }

    if (reduced()) {
      stage.style.height = 'auto';
      var pinEl = stage.querySelector('[data-hero-pin]');
      if (pinEl) pinEl.style.position = 'static';
      lines.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
      if (end) { end.style.opacity = '1'; end.style.transform = 'none'; end.style.pointerEvents = 'auto'; }
      return;
    }
    schedule();
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
    hero();
    cropReveal();
    modes();
    pointerDrift();
    magnetic();
    routeWipe();
    window.addEventListener('scroll', schedule, { passive: true });
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        items.forEach(function (it) { if (it.kind === 'frag') layoutFrag(it); });
        schedule();
      }, 120);
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
