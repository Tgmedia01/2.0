// TG MEDIA — SHARED JS
// Preloader (session-once), cursor, menu, animations

lucide.createIcons();
gsap.registerPlugin(ScrollTrigger);

// ============================================================
// PRELOADER — shows once per browser session only
// ============================================================
(function () {
    const preloader = document.getElementById('preloader');
    if (!preloader) {
        // No preloader element — just run page animations immediately
        document.body.style.overflow = 'auto';
        requestAnimationFrame(runPageAnimations);
        return;
    }

    const hasLoaded = sessionStorage.getItem('tgmedia_loaded');

    if (hasLoaded) {
        // Already shown this session — skip immediately
        preloader.style.display = 'none';
        document.body.style.overflow = 'auto';
        requestAnimationFrame(runPageAnimations);
        return;
    }

    // First visit this session — show the preloader
    document.body.style.overflow = 'hidden';
    sessionStorage.setItem('tgmedia_loaded', '1');

    const progress = document.getElementById('loader-progress');
    const percent  = document.getElementById('loader-percent');

    // Safety net — never gets stuck beyond 3.5s
    const safetyTimeout = setTimeout(dismiss, 3500);

    let load = 0;
    const interval = setInterval(() => {
        load += Math.floor(Math.random() * 7) + 4;
        if (load > 100) load = 100;
        if (progress) progress.style.width = load + '%';
        if (percent)  percent.innerText = load + '%';
        if (load >= 100) {
            clearInterval(interval);
            clearTimeout(safetyTimeout);
            setTimeout(dismiss, 150);
        }
    }, 16);

    function dismiss() {
        // Wipe up — full screen clip reveal
        gsap.to(preloader, {
            yPercent: -100,
            duration: 1.2,
            ease: 'expo.inOut',
            onComplete: () => {
                preloader.style.display = 'none';
                document.body.style.overflow = 'auto';
                runPageAnimations();
            }
        });
    }
})();

// ============================================================
// PAGE TRANSITION — fade out on link click
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (
            !href ||
            href.startsWith('#') ||
            href.startsWith('http') ||
            href.startsWith('mailto') ||
            href.startsWith('tel')
        ) return;

        link.addEventListener('click', e => {
            e.preventDefault();
            const target = href;
            gsap.to('#main-content, footer', {
                opacity: 0,
                y: -16,
                duration: 0.35,
                ease: 'power2.in',
                onComplete: () => { window.location.href = target; }
            });
        });
    });
});

// ============================================================
// PAGE ANIMATIONS — runs after preloader every page
// ============================================================
function runPageAnimations() {

    // --- HEADER SLIDE IN ---
    gsap.fromTo('header',
        { yPercent: -100, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.1 }
    );

    // --- HERO WORD REVEAL (clip) ---
    gsap.utils.toArray('.hero-word').forEach((word, i) => {
        gsap.fromTo(word,
            { yPercent: 115 },
            { yPercent: 0, duration: 1.2, delay: 0.3 + i * 0.13, ease: 'power4.out' }
        );
    });

    // --- CASE TITLE (project pages) ---
    gsap.utils.toArray('.case-title').forEach(el => {
        gsap.fromTo(el,
            { yPercent: 60, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 1.3, delay: 0.4, ease: 'power4.out' }
        );
    });

    // --- LEGAL PAGE TITLE ---
    gsap.utils.toArray('.legal-title').forEach(el => {
        gsap.fromTo(el,
            { yPercent: 40, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 1, delay: 0.3, ease: 'power3.out' }
        );
    });

    // --- SCROLL REVEALS: .reveal ---
    gsap.utils.toArray('.reveal').forEach((el, i) => {
        gsap.fromTo(el,
            { y: 50, opacity: 0 },
            {
                scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' },
                y: 0, opacity: 1, duration: 0.9, delay: (i % 4) * 0.07, ease: 'power3.out'
            }
        );
    });

    // --- STAGGER GRID CHILDREN: .stagger-grid ---
    gsap.utils.toArray('.stagger-grid').forEach(grid => {
        gsap.fromTo(Array.from(grid.children),
            { y: 50, opacity: 0 },
            {
                scrollTrigger: { trigger: grid, start: 'top 85%', toggleActions: 'play none none none' },
                y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out'
            }
        );
    });

    // --- HORIZONTAL LINE REVEALS: .line-reveal ---
    gsap.utils.toArray('.line-reveal').forEach(el => {
        gsap.fromTo(el,
            { scaleX: 0, transformOrigin: 'left center' },
            {
                scrollTrigger: { trigger: el, start: 'top 92%' },
                scaleX: 1, duration: 1.2, ease: 'power4.inOut'
            }
        );
    });

    // --- PARALLAX IMAGES: .parallax-img ---
    gsap.utils.toArray('.parallax-img').forEach(img => {
        gsap.to(img, {
            scrollTrigger: {
                trigger: img.closest('section') || img.parentElement,
                start: 'top bottom', end: 'bottom top', scrub: 1.5
            },
            yPercent: -12, ease: 'none'
        });
    });

    // --- NUMBER COUNTERS: .counter data-target="XX" ---
    gsap.utils.toArray('.counter').forEach(el => {
        const target = parseInt(el.getAttribute('data-target') || el.innerText, 10);
        if (isNaN(target)) return;
        const obj = { val: 0 };
        gsap.to(obj, {
            scrollTrigger: { trigger: el, start: 'top 85%' },
            val: target, duration: 2, ease: 'power2.out',
            onUpdate() { el.innerText = Math.round(obj.val); }
        });
    });

    // --- CHAR SPLIT REVEALS: .split-text ---
    // Each character animates in individually
    gsap.utils.toArray('.split-text').forEach(el => {
        const text = el.innerText;
        el.innerHTML = text.split('').map(c =>
            c === ' ' ? ' ' : `<span class="split-char" style="display:inline-block;overflow:hidden"><span style="display:inline-block">${c}</span></span>`
        ).join('');
        const chars = el.querySelectorAll('.split-char span');
        gsap.fromTo(chars,
            { yPercent: 110 },
            {
                scrollTrigger: { trigger: el, start: 'top 88%' },
                yPercent: 0, duration: 0.8, stagger: 0.025, ease: 'power3.out'
            }
        );
    });

    // Skew removed — too aggressive for this aesthetic

    // --- MAGNETIC BUTTONS ---
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(btn, { x: x * 0.35, y: y * 0.35, duration: 0.4, ease: 'power2.out' });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)' });
        });
    });

    // --- PAGE-SPECIFIC ---
    if (typeof initScrollAnimations === 'function') {
        try { initScrollAnimations(); } catch(e) { console.warn(e); }
    }
}

// ============================================================
// CURSOR (desktop only)
// ============================================================
(function () {
    const cursor = document.getElementById('cursor');
    if (!cursor || !window.matchMedia('(pointer: fine)').matches) return;

    let mouseX = 0, mouseY = 0, curX = 0, curY = 0;

    window.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

    (function tick() {
        curX += (mouseX - curX) * 0.1;
        curY += (mouseY - curY) * 0.1;
        cursor.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%)`;
        requestAnimationFrame(tick);
    })();

    document.querySelectorAll('a, button, [role="button"]').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('active'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
    });
})();

// ============================================================
// MOBILE MENU
// ============================================================
window.toggleMenu = function () {
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;
    menu.classList.toggle('open');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : 'auto';
};
