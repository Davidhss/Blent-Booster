// ── REVEAL ON SCROLL/LOAD ───────────────────
const revealOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, revealOptions);

document.querySelectorAll('.reveal, .stagger-reveal').forEach(el => {
    revealObserver.observe(el);
});

// Trigger reveals immediately for above-the-fold content
setTimeout(() => {
    document.querySelectorAll('.reveal:not(.active), .stagger-reveal:not(.active)').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
            el.classList.add('active');
        }
    });
}, 100);

// ── GLOBAL POINTER GLOW ───────────────────
const pointerGlow = document.getElementById('pointer-glow');
window.addEventListener('mousemove', (e) => {
    if (pointerGlow) {
        pointerGlow.style.left = e.clientX + 'px';
        pointerGlow.style.top = e.clientY + 'px';
        if (!pointerGlow.classList.contains('active')) {
            pointerGlow.classList.add('active');
        }
    }
});

// ── PARALLAX FLARES ───────────────────
const flares = document.querySelectorAll('.flare');
window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    flares.forEach((flare, index) => {
        const speed = (index + 1) * -0.15;
        flare.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// ── PREMIUM CARD INTERACTIONS ───────────────────
const cards = document.querySelectorAll('.glass-card');
cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty('--x', `${x}px`);
        card.style.setProperty('--y', `${y}px`);

        if (card.classList.contains('tilt-card')) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (centerY - y) / 10;
            const rotateY = (x - centerX) / 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        }
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});
