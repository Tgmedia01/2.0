// TG MEDIA — SHARED JS
// Handles: preloader, menu, cursor, magnetic buttons
// Each page defines its own initScrollAnimations() function

lucide.createIcons();
gsap.registerPlugin(ScrollTrigger);

// --- PRELOADER ---
const preloader = document.getElementById('preloader');
const progress  = document.getElementById('loader-progress');
const percent   = document.getElementById('loader-percent');

document.body.style.overflow = 'hidden';

let load = 0;
const interval = setInterval(() => {
    load += Math.floor(Math.random() * 5) + 2;
    if (load > 100) load = 100;
    if (progress) progress.style.width = load + '%';
    if (percent)  percent.innerText = load + '%';
    if (load === 100) {
        clearInterval(interval);
        gsap.to(preloader, {
            y: '-100%', duration: 1.2, ease: 'expo.inOut', delay: 0.2,
            onComplete: () => {
                document.body.style.overflow = 'auto';
                // Call the page-specific scroll animation function if it exists
                if (typeof initScrollAnimations === 'function') {
                    initScrollAnimations();
                }
            }
        });
    }
}, 20);

// --- MOBILE MENU ---
window.toggleMenu = function () {
    document.getElementById('mobile-menu').classList.toggle('open');
};

// --- CURSOR (desktop only) ---
const cursor = document.getElementById('cursor');
if (window.matchMedia("(pointer: fine)").matches && cursor) {
    window.addEventListener('mousemove', (e) => {
        gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1, ease: "power2.out" });
    });
    document.querySelectorAll('a, button, [role="button"]').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('active'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
    });

    // Magnetic buttons
    document.querySelectorAll('.magnetic-btn').forEach((btn) => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(btn,          { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: "power2.out" });
            gsap.to(btn.children, { x: x * 0.1, y: y * 0.1, duration: 0.3, ease: "power2.out" });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn,          { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.3)" });
            gsap.to(btn.children, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.3)" });
        });
    });
}
