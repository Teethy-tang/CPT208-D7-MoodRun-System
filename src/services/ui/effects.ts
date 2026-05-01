let fireworksInterval: number | null = null;
let breathInterval: number | null = null;

export function initCursorGlow(cursorGlow: HTMLElement | null) {
  if (!cursorGlow) return;
  const glow = cursorGlow;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;

  document.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
  });

  document.addEventListener(
    'touchmove',
    (event) => {
      if (event.touches.length > 0) {
        mouseX = event.touches[0].clientX;
        mouseY = event.touches[0].clientY;
      }
    },
    { passive: true },
  );

  function animateCursor() {
    const ease = 0.08;
    currentX += (mouseX - currentX) * ease;
    currentY += (mouseY - currentY) * ease;
    glow.style.left = `${currentX}px`;
    glow.style.top = `${currentY}px`;
    requestAnimationFrame(animateCursor);
  }

  animateCursor();
}

export function initGravityGrid(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const gridCanvas = canvas;
  const context = ctx;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = {
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    lastX: window.innerWidth / 2,
    lastY: window.innerHeight / 2,
    velocityX: 0,
    velocityY: 0,
    lastMoveTime: 0,
  };
  const size = { width: 0, height: 0, dpr: 1 };
  let homePresence = 1;
  let interactionPresence = 0;
  let animationFrame: number | null = null;

  function resizeCanvas() {
    const rect = gridCanvas.getBoundingClientRect();
    size.width = rect.width || window.innerWidth;
    size.height = rect.height || window.innerHeight;
    size.dpr = Math.min(window.devicePixelRatio || 1, 2);

    gridCanvas.width = Math.round(size.width * size.dpr);
    gridCanvas.height = Math.round(size.height * size.dpr);
    context.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
  }

  function setPointerPosition(clientX: number, clientY: number) {
    pointer.targetX = clientX;
    pointer.targetY = clientY;
    pointer.velocityX = clientX - pointer.lastX;
    pointer.velocityY = clientY - pointer.lastY;
    pointer.lastX = clientX;
    pointer.lastY = clientY;
    pointer.lastMoveTime = performance.now();
  }

  function isHomeVisible() {
    return document.getElementById('homePage')?.classList.contains('active');
  }

  function getDistortion(pointX: number, pointY: number, strength: number) {
    if (strength <= 0.01) return { x: pointX, y: pointY, falloff: 0 };

    const dx = pointX - pointer.x;
    const dy = pointY - pointer.y;
    const distance = Math.hypot(dx, dy) || 1;
    const radius = Math.max(140, Math.min(size.width, size.height) * 0.26);
    const falloff = Math.exp(-(distance * distance) / (radius * radius));
    const pull = 42 * strength * falloff;
    const ripple = Math.sin((distance / radius) * Math.PI) * 10 * strength * falloff;
    const speed = Math.min(Math.hypot(pointer.velocityX, pointer.velocityY), 42) / 42;
    const wakeX = pointer.velocityX * 0.32 * speed * falloff * strength;
    const wakeY = pointer.velocityY * 0.32 * speed * falloff * strength;

    return {
      x: pointX - (dx / distance) * (pull + ripple) + wakeX,
      y: pointY - (dy / distance) * (pull + ripple) + wakeY,
      falloff,
    };
  }

  function drawGridLine(points: Array<{ x: number; y: number }>, strokeStyle: string, lineWidth = 1) {
    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });
    context.strokeStyle = strokeStyle;
    context.lineWidth = lineWidth;
    context.stroke();
  }

  function buildLine(isVertical: boolean, axis: number, step: number, strength: number) {
    const points: Array<{ x: number; y: number; falloff?: number }> = [];
    const limit = isVertical ? size.height : size.width;

    for (let offset = -step; offset <= limit + step; offset += 8) {
      const point = isVertical ? getDistortion(axis, offset, strength) : getDistortion(offset, axis, strength);
      points.push(point);
    }

    return points;
  }

  function drawAccentSegments(points: Array<{ x: number; y: number; falloff?: number }>, color: (amount: number) => string, strength: number) {
    for (let index = 1; index < points.length; index += 1) {
      const falloff = ((points[index - 1].falloff || 0) + (points[index].falloff || 0)) / 2;
      if (falloff < 0.12) continue;

      context.beginPath();
      context.moveTo(points[index - 1].x, points[index - 1].y);
      context.lineTo(points[index].x, points[index].y);
      context.strokeStyle = color(falloff * strength);
      context.lineWidth = 1.35;
      context.stroke();
    }
  }

  function drawStaticGrid() {
    context.clearRect(0, 0, size.width, size.height);
    const step = 50;
    context.strokeStyle = 'rgba(27, 35, 64, 0.055)';
    context.lineWidth = 1;

    for (let x = 0; x <= size.width + step; x += step) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, size.height);
      context.stroke();
    }

    for (let y = 0; y <= size.height + step; y += step) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(size.width, y);
      context.stroke();
    }
  }

  function draw() {
    const now = performance.now();
    const homeTarget = isHomeVisible() ? 1 : 0;
    const recentPointer = now - pointer.lastMoveTime < 1350 ? 1 : 0;

    homePresence += (homeTarget - homePresence) * 0.08;
    interactionPresence += (recentPointer - interactionPresence) * 0.07;
    pointer.x += (pointer.targetX - pointer.x) * 0.12;
    pointer.y += (pointer.targetY - pointer.y) * 0.12;
    pointer.velocityX *= 0.9;
    pointer.velocityY *= 0.9;

    const strength = reducedMotion.matches ? 0 : interactionPresence * homePresence;
    context.clearRect(0, 0, size.width, size.height);

    const step = 50;
    const baseStroke = 'rgba(27, 35, 64, 0.055)';
    const cyanGlow = (amount: number) => `rgba(121, 225, 214, ${Math.min(0.18, amount * 0.16)})`;
    const pinkGlow = (amount: number) => `rgba(249, 147, 190, ${Math.min(0.14, amount * 0.12)})`;

    for (let x = 0; x <= size.width + step; x += step) {
      const points = buildLine(true, x, step, strength);
      drawGridLine(points, baseStroke);
      drawAccentSegments(points, x % (step * 2) === 0 ? cyanGlow : pinkGlow, strength);
    }

    for (let y = 0; y <= size.height + step; y += step) {
      const points = buildLine(false, y, step, strength);
      drawGridLine(points, baseStroke);
      drawAccentSegments(points, y % (step * 2) === 0 ? pinkGlow : cyanGlow, strength);
    }

    if (reducedMotion.matches) {
      animationFrame = null;
      return;
    }

    animationFrame = requestAnimationFrame(draw);
  }

  function startDrawing() {
    if (!animationFrame) {
      animationFrame = requestAnimationFrame(draw);
    }
  }

  resizeCanvas();
  canvas.classList.add('gravity-ready');
  drawStaticGrid();
  startDrawing();

  window.addEventListener('resize', () => {
    resizeCanvas();
    drawStaticGrid();
  });

  document.addEventListener('pointermove', (event) => {
    setPointerPosition(event.clientX, event.clientY);
    startDrawing();
  });

  document.addEventListener(
    'touchmove',
    (event) => {
      if (event.touches.length > 0) {
        setPointerPosition(event.touches[0].clientX, event.touches[0].clientY);
        startDrawing();
      }
    },
    { passive: true },
  );

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      drawStaticGrid();
      return;
    }

    startDrawing();
  });
}

export function initNavGlow(nav: HTMLElement | null) {
  if (!nav) return;
  const navElement = nav;

  let targetX = navElement.offsetWidth / 2;
  let targetY = navElement.offsetHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  let isInside = false;
  let animationFrame: number | null = null;

  function animateGlow() {
    currentX += (targetX - currentX) * 0.14;
    currentY += (targetY - currentY) * 0.14;
    navElement.style.setProperty('--nav-glow-x', `${currentX}px`);
    navElement.style.setProperty('--nav-glow-y', `${currentY}px`);

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

  function updateGlow(event: PointerEvent) {
    const rect = navElement.getBoundingClientRect();
    targetX = event.clientX - rect.left;
    targetY = event.clientY - rect.top;

    isInside = true;
    navElement.classList.add('nav-glowing');
    startGlowAnimation();
  }

  function hideGlow() {
    isInside = false;
    navElement.classList.remove('nav-glowing');
    startGlowAnimation();
  }

  navElement.addEventListener('pointerenter', updateGlow);
  navElement.addEventListener('pointermove', updateGlow);
  navElement.addEventListener('pointerdown', updateGlow);
  navElement.addEventListener('pointerleave', hideGlow);
  navElement.addEventListener('pointercancel', hideGlow);
}

export function showCelebration(text: string) {
  const toast = document.getElementById('celebrationToast');
  if (!toast) return;

  toast.textContent = text;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 3000);
}

export function startPixelFireworks() {
  const container = document.getElementById('fireworksContainer');
  if (!container) return;

  container.innerHTML = '';
  launchPixelFirework();
  fireworksInterval = window.setInterval(launchPixelFirework, 800);

  window.setTimeout(stopPixelFireworks, 8000);
}

export function stopPixelFireworks() {
  if (fireworksInterval) {
    window.clearInterval(fireworksInterval);
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

  window.setTimeout(() => {
    rocket.remove();
    createPixelExplosion(startX, window.innerHeight + launchHeight);
  }, duration * 1000);
}

function createPixelExplosion(x: number, y: number) {
  const container = document.getElementById('fireworksContainer');
  if (!container) return;

  const particleCount = 20 + Math.floor(Math.random() * 16);
  const colors = ['#ff3f8f', '#ffd84d', '#00d4c0', '#ff4d5f', '#4f7eff', '#ffe36d', '#79e1d6', '#f993be'];
  const mainColor = colors[Math.floor(Math.random() * colors.length)];
  const secondaryColor = colors[Math.floor(Math.random() * colors.length)];

  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement('div');
    const angle = (Math.PI * 2 * index) / particleCount + (Math.random() - 0.5) * 0.5;
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
    window.setTimeout(() => particle.remove(), 1500);
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
  window.setTimeout(() => flash.remove(), 400);
}

export function startBreathing() {
  stopBreathing();

  const breathTexts = ['INHALE', 'HOLD', 'EXHALE', 'HOLD'];
  const breathText = document.getElementById('breathText');
  let phase = 0;

  if (!breathText) return;

  breathText.textContent = breathTexts[0];
  breathInterval = window.setInterval(() => {
    phase = (phase + 1) % breathTexts.length;
    breathText.textContent = breathTexts[phase];
  }, 2000);
}

export function stopBreathing() {
  if (breathInterval) {
    window.clearInterval(breathInterval);
    breathInterval = null;
  }
}

export function selectSound(sound: string) {
  document.querySelectorAll('.sound-option').forEach((option) => option.classList.remove('active'));
  document.querySelector(`[data-sound="${sound}"]`)?.classList.add('active');
}
