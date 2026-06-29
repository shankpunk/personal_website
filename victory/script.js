(() => {
  const AUTOPLAY_MS = 5000;
  const SWIPE_THRESHOLD = 48;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const slides = Array.from(document.querySelectorAll(".slide"));
  const indicators = Array.from(document.querySelectorAll(".indicator"));
  const galleryShell = document.getElementById("galleryShell");
  const photoCard = document.getElementById("photoCard");
  const particles = document.getElementById("particles");
  const spotlight = document.getElementById("cursorSpotlight");
  const confettiCanvas = document.getElementById("confettiCanvas");

  let currentSlide = 0;
  let autoplayId;
  let touchStartX = 0;
  let touchStartY = 0;

  function setSlide(index) {
    currentSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("active", slideIndex === currentSlide);
    });

    indicators.forEach((indicator, indicatorIndex) => {
      const active = indicatorIndex === currentSlide;
      indicator.classList.toggle("active", active);
      indicator.setAttribute("aria-current", active ? "true" : "false");
    });
  }

  function goToNextSlide() {
    setSlide(currentSlide + 1);
  }

  function goToPreviousSlide() {
    setSlide(currentSlide - 1);
  }

  function restartAutoplay() {
    window.clearInterval(autoplayId);

    if (!reducedMotion) {
      autoplayId = window.setInterval(goToNextSlide, AUTOPLAY_MS);
    }
  }

  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", () => {
      setSlide(index);
      restartAutoplay();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      goToNextSlide();
      restartAutoplay();
    }

    if (event.key === "ArrowLeft") {
      goToPreviousSlide();
      restartAutoplay();
    }
  });

  galleryShell.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  galleryShell.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0) {
      goToNextSlide();
    } else {
      goToPreviousSlide();
    }

    restartAutoplay();
  }, { passive: true });

  function createParticles() {
    if (reducedMotion) {
      return;
    }

    const particleCount = window.innerWidth < 680 ? 42 : 76;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < particleCount; i += 1) {
      const particle = document.createElement("span");
      const size = Math.random() * 3 + 1;
      const duration = Math.random() * 9 + 9;
      const delay = Math.random() * -duration;
      const drift = (Math.random() * 160 - 80).toFixed(1);

      particle.className = "particle";
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 105}%`;
      particle.style.setProperty("--size", `${size}px`);
      particle.style.setProperty("--duration", `${duration}s`);
      particle.style.setProperty("--delay", `${delay}s`);
      particle.style.setProperty("--drift", `${drift}px`);
      fragment.appendChild(particle);
    }

    particles.appendChild(fragment);
  }

  function bindMouseAtmosphere() {
    if (reducedMotion || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    window.addEventListener("pointermove", (event) => {
      spotlight.style.opacity = "1";
      spotlight.style.left = `${event.clientX}px`;
      spotlight.style.top = `${event.clientY}px`;
    });

    window.addEventListener("pointerleave", () => {
      spotlight.style.opacity = "0";
    });

    photoCard.addEventListener("pointermove", (event) => {
      const rect = photoCard.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      photoCard.style.setProperty("--ry", `${x * 7}deg`);
      photoCard.style.setProperty("--rx", `${y * -6}deg`);
      photoCard.style.setProperty("--float", "-7px");
    });

    photoCard.addEventListener("pointerleave", () => {
      photoCard.style.setProperty("--ry", "0deg");
      photoCard.style.setProperty("--rx", "0deg");
      photoCard.style.setProperty("--float", "0");
    });
  }

  function runFirstVisitConfetti() {
    if (reducedMotion || sessionStorage.getItem("victoryConfettiShown") === "true") {
      return;
    }

    sessionStorage.setItem("victoryConfettiShown", "true");

    const context = confettiCanvas.getContext("2d");
    const colors = ["#ffffff", "#f5c35b", "#ff7a48", "#9fd8ff"];
    const pieces = [];
    let width = 0;
    let height = 0;
    const startTime = performance.now();

    function resizeCanvas() {
      width = confettiCanvas.width = window.innerWidth * window.devicePixelRatio;
      height = confettiCanvas.height = window.innerHeight * window.devicePixelRatio;
      confettiCanvas.style.width = `${window.innerWidth}px`;
      confettiCanvas.style.height = `${window.innerHeight}px`;
      context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }

    function createPiece() {
      return {
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 140,
        y: window.innerHeight * 0.28 + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * -7 - 4,
        gravity: Math.random() * 0.11 + 0.12,
        size: Math.random() * 7 + 4,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.22,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1
      };
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas, { once: true });

    for (let i = 0; i < 110; i += 1) {
      pieces.push(createPiece());
    }

    function draw(now) {
      const elapsed = now - startTime;
      context.clearRect(0, 0, width, height);

      pieces.forEach((piece) => {
        piece.vy += piece.gravity;
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rotation += piece.spin;
        piece.alpha = Math.max(0, 1 - elapsed / 2300);

        context.save();
        context.globalAlpha = piece.alpha;
        context.translate(piece.x, piece.y);
        context.rotate(piece.rotation);
        context.fillStyle = piece.color;
        context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.58);
        context.restore();
      });

      if (elapsed < 2400) {
        requestAnimationFrame(draw);
      } else {
        context.clearRect(0, 0, width, height);
      }
    }

    requestAnimationFrame(draw);
  }

  createParticles();
  bindMouseAtmosphere();
  runFirstVisitConfetti();
  restartAutoplay();
})();
