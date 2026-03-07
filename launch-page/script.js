// Set the launch date here (Format: "Month Day, Year HH:MM:SS")
const now_date = new Date();
const LAUNCH_DATE = new Date(now_date.getTime() + (5 * 24 * 60 * 60 * 1000)).getTime();

// ── DOM ELEMENTS ───────────────────
const timer = {
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds')
};

const modal = document.getElementById('waitlist-modal');
const openModalBtns = document.querySelectorAll('.open-modal');
const closeModalBtn = document.querySelector('.close-modal');
const waitlistForm = document.getElementById('waitlist-form');
const navbar = document.querySelector('.navbar');

// ── COUNTDOWN LOGIC ───────────────────
function updateCountdown() {
    const now = new Date().getTime();
    const distance = LAUNCH_DATE - now;

    if (distance < 0) {
        clearInterval(countdownInterval);
        document.getElementById('timer').innerHTML = "Lançamento Iniciado!";
        return;
    }

    const d = Math.floor(distance / (1000 * 60 * 60 * 24));
    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);

    timer.days.innerText = d.toString().padStart(2, '0');
    timer.hours.innerText = h.toString().padStart(2, '0');
    timer.minutes.innerText = m.toString().padStart(2, '0');
    timer.seconds.innerText = s.toString().padStart(2, '0');
}

const countdownInterval = setInterval(updateCountdown, 1000);
updateCountdown();

// ── MODAL LOGIC ───────────────────
openModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scroll
    });
});

closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
});

// Close modal on outside click
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ── FORM SUBMISSION ───────────────────
waitlistForm.addEventListener('submit', async (e) => {
    // Prevent default to handle via AJAX so we can redirect via native JS
    e.preventDefault();

    const btn = waitlistForm.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader" class="spin"></i> Processando...';
    lucide.createIcons();
    btn.disabled = true;

    try {
        const formData = new FormData(waitlistForm);
        const actionUrl = waitlistForm.getAttribute('action');

        // Note to owner: If 'actionUrl' is just an email, Formspree will block it or fail to route.
        // Needs a valid endpoint like https://formspree.io/f/xyz
        const response = await fetch(actionUrl, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            window.location.href = 'obrigado.html';
        } else {
            const data = await response.json();
            console.error("Erro do Formspree:", data);
            alert("Ocorreu um erro ao enviar. Verifique se o e-mail está configurado corretamente no código (Formspree ID).");
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error("Erro na requisição AJAX:", error);
        alert("Erro de conexão. Por favor, tente novamente.");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// ── SCROLL & PARALLAX EFFECTS ───────────────────
const mobileStickyCta = document.getElementById('mobile-sticky-cta');
const flares = document.querySelectorAll('.flare');

window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;

    if (scrolled > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Sticky CTA on mobile
    if (mobileStickyCta) {
        if (scrolled > window.innerHeight * 0.6) {
            mobileStickyCta.classList.add('visible');
        } else {
            mobileStickyCta.classList.remove('visible');
        }
    }

    // Parallax background flares
    flares.forEach((flare, index) => {
        const speed = (index + 1) * -0.15; // Move up as we scroll down
        flare.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

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

// ── REVEAL ON SCROLL ───────────────────
const revealOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            // We can unobserve if we only want it once
            // revealObserver.unobserve(entry.target);
        }
    });
}, revealOptions);

document.querySelectorAll('.reveal, .stagger-reveal').forEach(el => {
    revealObserver.observe(el);
});

// ── PREMIUM CARD INTERACTIONS ───────────────────
// 3D Tilt & Cursor Glow
const cards = document.querySelectorAll('.glass-card');

cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Update CSS variables for glow
        card.style.setProperty('--x', `${x}px`);
        card.style.setProperty('--y', `${y}px`);

        // 3D Tilt logic
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

// ── FOMO SIMULATOR ───────────────────
// ... rest of the code ...
function showFomoNotification() {
    const cities = ["São Paulo", "Rio de Janeiro", "Curitiba", "Belo Horizonte", "Salvador", "Fortaleza", "Brasília", "Porto Alegre"];
    const names = ["Ana", "Bruno", "Carlos", "Débora", "Eduardo", "Fernanda", "Gabriel", "Helena"];

    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];

    const notification = document.createElement('div');
    notification.className = 'fomo-notification';
    notification.innerHTML = `
        <div class="fomo-content">
            <div class="fomo-avatar">${randomName[0]}</div>
            <div class="fomo-text">
                <strong>${randomName}</strong> de ${randomCity}<br>
                <span>acabou de entrar na lista VIP!</span>
            </div>
        </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('active'), 100);

    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('active');
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

// Initial delay then periodic
setTimeout(() => {
    showFomoNotification();
    setInterval(showFomoNotification, 15000 + Math.random() * 10000);
}, 3000);
