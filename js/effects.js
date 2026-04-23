let fireworksInterval = null;
let breathInterval = null;

export function initCursorGlow(cursorGlow) {
    if (!cursorGlow) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;

    document.addEventListener('mousemove', event => {
        mouseX = event.clientX;
        mouseY = event.clientY;
    });

    document.addEventListener('touchmove', event => {
        if (event.touches.length > 0) {
            mouseX = event.touches[0].clientX;
            mouseY = event.touches[0].clientY;
        }
    }, { passive: true });

    function animateCursor() {
        const ease = 0.08;
        currentX += (mouseX - currentX) * ease;
        currentY += (mouseY - currentY) * ease;
        cursorGlow.style.left = `${currentX}px`;
        cursorGlow.style.top = `${currentY}px`;
        requestAnimationFrame(animateCursor);
    }

    cursorGlow.classList.add('home-visible');
    animateCursor();
}

export function initNavGlow(nav) {
    if (!nav) return;

    let targetX = nav.offsetWidth / 2;
    let targetY = nav.offsetHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let isInside = false;
    let animationFrame = null;

    function animateGlow() {
        currentX += (targetX - currentX) * 0.14;
        currentY += (targetY - currentY) * 0.14;
        nav.style.setProperty('--nav-glow-x', `${currentX}px`);
        nav.style.setProperty('--nav-glow-y', `${currentY}px`);

        if (isInside || Math.abs(targetX - currentX) > 0.4 || Math.abs(targetY - currentY) > 0.4) {
            animationFrame = requestAnimationFrame(animateGlow);
        } else {
            animationFrame = null;
        }
    }

    function startGlowAnimation() {
        if (!animationFrame) {
            animationFrame = requestAnimationFrame(animateGlow);
        }
    }

    function updateGlow(event) {
        const rect = nav.getBoundingClientRect();
        targetX = event.clientX - rect.left;
        targetY = event.clientY - rect.top;

        isInside = true;
        nav.classList.add('nav-glowing');
        startGlowAnimation();
    }

    function hideGlow() {
        isInside = false;
        nav.classList.remove('nav-glowing');
        startGlowAnimation();
    }

    nav.addEventListener('pointerenter', updateGlow);
    nav.addEventListener('pointermove', updateGlow);
    nav.addEventListener('pointerdown', updateGlow);
    nav.addEventListener('pointerleave', hideGlow);
    nav.addEventListener('pointercancel', hideGlow);
}

export function showCelebration(text) {
    const toast = document.getElementById('celebrationToast');
    if (!toast) return;

    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

export function startPixelFireworks() {
    const container = document.getElementById('fireworksContainer');
    if (!container) return;

    container.innerHTML = '';
    launchPixelFirework();
    fireworksInterval = setInterval(launchPixelFirework, 800);

    setTimeout(stopPixelFireworks, 8000);
}

export function stopPixelFireworks() {
    if (fireworksInterval) {
        clearInterval(fireworksInterval);
        fireworksInterval = null;
    }

    const container = document.getElementById('fireworksContainer');
    if (container) container.innerHTML = '';
}

function launchPixelFirework() {
    const container = document.getElementById('fireworksContainer');
    if (!container) return;

    const startX = 50 + Math.random() * (window.innerWidth - 100);
    const launchHeight = -(300 + Math.random() * 250);
    const duration = 1.0 + Math.random() * 0.8;
    const rocket = document.createElement('div');

    rocket.className = 'firework-rocket';
    rocket.style.left = `${startX}px`;
    rocket.style.setProperty('--launch-height', `${launchHeight}px`);
    rocket.style.setProperty('--launch-duration', `${duration}s`);
    container.appendChild(rocket);

    setTimeout(() => {
        rocket.remove();
        createPixelExplosion(startX, window.innerHeight + launchHeight);
    }, duration * 1000);
}

function createPixelExplosion(x, y) {
    const container = document.getElementById('fireworksContainer');
    if (!container) return;

    const particleCount = 20 + Math.floor(Math.random() * 16);
    const colors = ['#ff3f8f', '#ffd84d', '#00d4c0', '#ff4d5f', '#4f7eff', '#ffe36d', '#79e1d6', '#f993be'];
    const mainColor = colors[Math.floor(Math.random() * colors.length)];
    const secondaryColor = colors[Math.floor(Math.random() * colors.length)];

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
        const distance = 40 + Math.random() * 80;
        const pixelTx = Math.round((Math.cos(angle) * distance) / 4) * 4;
        const pixelTy = Math.round((Math.sin(angle) * distance) / 4) * 4;

        particle.className = 'explosion-particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.setProperty('--tx', `${pixelTx}px`);
        particle.style.setProperty('--ty', `${pixelTy}px`);
        particle.style.setProperty('--explode-duration', `${0.8 + Math.random() * 0.6}s`);
        particle.style.setProperty('--explode-delay', `${Math.random() * 0.1}s`);
        particle.style.color = Math.random() > 0.5 ? mainColor : secondaryColor;
        container.appendChild(particle);
        setTimeout(() => particle.remove(), 1500);
    }

    const flash = document.createElement('div');
    flash.style.cssText = `
        position: absolute;
        left: ${x - 8}px;
        top: ${y - 8}px;
        width: 16px;
        height: 16px;
        background: ${mainColor};
        box-shadow: 0 0 0 4px ${mainColor}, 0 0 0 8px rgba(255,255,255,0.5);
        animation: pixelExplode 0.4s ease-out forwards;
    `;
    flash.style.setProperty('--tx', '0px');
    flash.style.setProperty('--ty', '0px');
    container.appendChild(flash);
    setTimeout(() => flash.remove(), 400);
}

export function startBreathing() {
    stopBreathing();

    const breathTexts = ['INHALE', 'HOLD', 'EXHALE', 'HOLD'];
    const breathText = document.getElementById('breathText');
    let phase = 0;

    if (!breathText) return;

    breathText.textContent = breathTexts[0];
    breathInterval = setInterval(() => {
        phase = (phase + 1) % breathTexts.length;
        breathText.textContent = breathTexts[phase];
    }, 2000);
}

export function stopBreathing() {
    if (breathInterval) {
        clearInterval(breathInterval);
        breathInterval = null;
    }
}

export function selectSound(sound) {
    document.querySelectorAll('.sound-option').forEach(option => option.classList.remove('active'));
    document.querySelector(`[data-sound="${sound}"]`)?.classList.add('active');
}
