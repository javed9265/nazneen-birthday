/* ==========================================================================
   main.js — the conductor
   · tap-to-begin gate (fades out, unlocks scroll, starts music)
   · background music toggle
   · confetti helpers used by letter.js / cake.js
   · GSAP scroll reveals, hero parallax, back-to-top
   ========================================================================== */
(function () {
  "use strict";

  var prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var bgm, musicBtn, musicStarted = false;

  function el(id) { return document.getElementById(id); }

  /* ------------------------------------------------ confetti helpers ---- */
  /* canvas-confetti spawns real DOM canvases; a long rain on a modest device
     can pin the main thread. Keep the bursts short and the particle counts
     low, and never run two rains at once. */
  var rainEnd = 0;
  var rainRaf = null;

  function rainFrame() {
    if (window.confetti) {
      var opts = {
        particleCount: 2,
        spread: 62,
        startVelocity: 40,
        gravity: 0.72,
        decay: 0.93,
        scalar: 0.9,
        ticks: 200,
        colors: ["#f4cf7a", "#fff3cf", "#e8457b", "#ff8fb3", "#ffffff", "#c99a3f"],
      };
      window.confetti(Object.assign({}, opts, { angle: 60, origin: { x: 0, y: 0.72 } }));
      window.confetti(Object.assign({}, opts, { angle: 120, origin: { x: 1, y: 0.72 } }));
    }
    if (Date.now() < rainEnd) rainRaf = requestAnimationFrame(rainFrame);
    else rainRaf = null;
  }

  function rain(ms) {
    if (!window.confetti || prefersReduced) return;
    ms = Math.min(ms || 4000, 6000); // hard cap so the page never stays pinned
    rainEnd = Date.now() + ms;
    if (!rainRaf) rainFrame();
  }

  function sprinkle(count, spread, ticks) {
    if (!window.confetti || prefersReduced) return;
    window.confetti({
      particleCount: count || 24,
      spread: spread || 70,
      startVelocity: 32,
      decay: 0.9,
      scalar: 0.85,
      ticks: ticks || 160,
      colors: ["#f4cf7a", "#fff3cf", "#e8457b", "#ff8fb3"],
    });
  }

  window.NB = window.NB || {};
  window.NB.rain = rain;
  window.NB.sprinkle = sprinkle;

  /* ------------------------------------------------------------ music ---- */
  function setMusicUi(playing) {
    if (!musicBtn) return;
    musicBtn.classList.toggle("is-playing", playing);
    musicBtn.setAttribute("aria-pressed", playing ? "true" : "false");
    musicBtn.setAttribute(
      "aria-label",
      playing ? "Pause the background music" : "Play the background music"
    );
  }

  function fadeTo(audio, target, ms) {
    var from = audio.volume;
    var steps = 24;
    var i = 0;
    clearInterval(audio._fade);
    audio._fade = setInterval(function () {
      i++;
      audio.volume = from + (target - from) * (i / steps);
      if (i >= steps) {
        clearInterval(audio._fade);
        audio.volume = target;
      }
    }, ms / steps);
  }

  function playMusic() {
    if (!bgm) return;
    bgm.volume = 0;
    var p = bgm.play();
    if (p && typeof p.then === "function") {
      p.then(function () {
        musicStarted = true;
        fadeTo(bgm, 0.5, 1500);
        setMusicUi(true);
      }).catch(function () { setMusicUi(false); });
    } else {
      musicStarted = true;
      setMusicUi(true);
    }
  }

  function toggleMusic() {
    if (!bgm) return;
    if (bgm.paused) playMusic();
    else {
      bgm.pause();
      setMusicUi(false);
    }
  }

  function initMusic() {
    bgm = el("bgm");
    musicBtn = el("music-btn");
    if (!bgm || !musicBtn) return;

    musicBtn.addEventListener("click", toggleMusic);

    // a suspended element can recover on the first real gesture
    document.addEventListener(
      "pointerdown",
      function () {
        if (musicStarted && bgm.paused && !bgm.ended) playMusic();
      },
      { once: true }
    );
  }

  /* ------------------------------------------------------------- gate ---- */
  function heroIntro() {
    var bits = document.querySelectorAll(
      ".hero-date, .hero-name, .hero-line, .hero-headline, .hero-copy, .scroll-cue"
    );
    if (hasGsap && !prefersReduced) {
      gsap.from(bits, {
        opacity: 0,
        y: 34,
        filter: "blur(8px)",
        duration: 1.15,
        stagger: 0.13,
        ease: "power3.out",
      });
    }
  }

  function openGate() {
    var gate = el("gate");
    var openBtn = el("open-btn");
    if (!gate) return;

    if (hasGsap && !prefersReduced) {
      gsap
        .timeline()
        .to(".heart-shape", { scale: 1.45, opacity: 0, duration: 0.55, ease: "power2.in" })
        .to(
          ".gate-inner > *:not(.heart-btn)",
          { opacity: 0, y: -22, duration: 0.6, stagger: 0.05, ease: "power2.in" },
          0.05
        )
        .add(function () {
          gate.classList.add("is-open");
          document.body.classList.remove("is-locked");
          if (bgm) playMusic();
          rain(2600);
          sprinkle(60, 120, 220);
          heroIntro();
        });
    } else {
      gate.classList.add("is-open");
      document.body.classList.remove("is-locked");
      if (bgm) playMusic();
      heroIntro();
    }

    setTimeout(function () {
      if (gate && gate.parentNode) gate.style.display = "none";
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }, 1250);

    if (openBtn) openBtn.setAttribute("aria-hidden", "true");
  }

  /* -------------------------------------------------- scroll reveals ----- */
  function initScrollFx() {
    if (!hasGsap || prefersReduced) return;
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray(".section-title, .lede, .eyebrow, .rule").forEach(function (node) {
      gsap.from(node, {
        opacity: 0,
        y: 30,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: node, start: "top 88%", once: true },
      });
    });

    // The cake fades/rises in but is NOT scaled or rotated: any transform left
    // on it would move the candle tap-targets out from under the user.
    gsap.from(".cake-float", {
      opacity: 0,
      y: 44,
      duration: 1,
      ease: "power3.out",
      clearProps: "all",
      scrollTrigger: { trigger: ".cake-stage", start: "top 80%", once: true },
    });

    gsap.to(".hero-name", {
      yPercent: 22,
      opacity: 0.35,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  }

  /* ------------------------------------------------------- back to top --- */
  function initToTop() {
    var btn = el("to-top");
    if (!btn) return;
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    var onScroll = function () {
      btn.classList.toggle("is-shown", window.scrollY > window.innerHeight * 0.9);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------- boot ---- */
  function boot() {
    document.body.classList.add("is-locked");
    initMusic();
    initScrollFx();
    initToTop();

    var openBtn = el("open-btn");
    if (openBtn) openBtn.addEventListener("click", openGate);

    var again = el("celebrate-again");
    if (again) {
      again.addEventListener("click", function () {
        rain(3400);
        sprinkle(80, 140, 260);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
