/* ==========================================================================
   ambient.js — the living background:
   · floating rose petals (DOM + CSS keyframes, composited transforms)
   · ambient gold sparkle field (canvas, DPR aware, pauses when off-screen)
   ========================================================================== */
(function () {
  "use strict";

  var prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cfg = (window.NB && window.NB.config && window.NB.config.ambient) || {};

  /* ------------------------------------------------ rose petals ---------- */
  var PETAL_SHAPES = [
    // petal (rounded top, pointed bottom)
    "M12 0C7 4 0 8 0 14a7 7 0 0 0 14 0C14 8 7 4 12 0z",
    // heart-ish petal
    "M12 22S2 15 2 8.5C2 5 4.5 3 7 3c2 0 3.4 1.2 5 3 1.6-1.8 3-3 5-3 2.5 0 5 2 5 5.5C22 15 12 22 12 22z",
    // teardrop
    "M12 0C12 0 22 9 22 15a10 10 0 0 1-20 0C2 9 12 0 12 0z",
  ];

  function petalSvg(i) {
    var rot = Math.round(Math.random() * 360);
    return (
      '<svg viewBox="0 0 24 24" width="100%" height="100%" style="transform:rotate(' +
      rot + 'deg)"><defs><linearGradient id="pg' +
      i +
      '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#ff9ab8"/><stop offset="55%" stop-color="#e8457b"/>' +
      '<stop offset="100%" stop-color="#9c1338"/></linearGradient></defs>' +
      '<path d="' +
      PETAL_SHAPES[i % PETAL_SHAPES.length] +
      '" fill="url(#pg' +
      i +
      ')"/></svg>'
    );
  }

  function buildPetals() {
    var host = document.getElementById("petals");
    if (!host) return;
    var total = prefersReduced ? cfg.reducedPetals || 6 : cfg.petals || 22;
    var frag = document.createDocumentFragment();

    for (var i = 0; i < total; i++) {
      var el = document.createElement("div");
      var size = 12 + Math.random() * 22;
      var dur = 11 + Math.random() * 16;
      el.className = "petal";
      el.style.left = Math.random() * 100 + "vw";
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.style.setProperty("--drift", (Math.random() * 260 - 130).toFixed(0) + "px");
      el.style.setProperty("--spin", (Math.random() * 900 - 450).toFixed(0) + "deg");
      el.style.setProperty("--op", (0.45 + Math.random() * 0.5).toFixed(2));
      el.style.animationDuration = dur.toFixed(1) + "s";
      el.style.animationDelay = (-Math.random() * dur).toFixed(1) + "s";
      el.innerHTML = petalSvg(i);
      frag.appendChild(el);
    }
    host.appendChild(frag);
  }

  /* ---------------------------------------------- gold particles --------- */
  /* Performance: a radial gradient is created once and reused as a sprite,
     because building 90 gradients per frame is what kills the frame budget. */
  function buildParticles() {
    var canvas = document.getElementById("particles");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d", { alpha: true });
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0;
    var h = 0;
    var motes = [];
    var total = prefersReduced ? 0 : cfg.particles || 90;
    var raf = null;
    var running = false;

    // one pre-rendered glow sprite, tinted at draw time via globalAlpha
    var SPRITE = 32;
    var sprite = document.createElement("canvas");
    sprite.width = sprite.height = SPRITE;
    var sctx = sprite.getContext("2d");
    (function paintSprite() {
      var r = SPRITE / 2;
      var g = sctx.createRadialGradient(r, r, 0, r, r, r);
      g.addColorStop(0, "rgba(255,248,225,1)");
      g.addColorStop(0.22, "rgba(244,207,122,.55)");
      g.addColorStop(0.55, "rgba(244,207,122,.14)");
      g.addColorStop(1, "rgba(244,207,122,0)");
      sctx.fillStyle = g;
      sctx.fillRect(0, 0, SPRITE, SPRITE);
    })();

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.style.width = w + "px";   // clientWidth is read-only
      canvas.style.height = h + "px";
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      motes = [];
      for (var i = 0; i < total; i++) {
        motes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 2.4 + Math.random() * 4.6,   // sprite half-size in px
          vx: (Math.random() - 0.5) * 0.19,
          vy: -(0.09 + Math.random() * 0.3),
          a: 0.2 + Math.random() * 0.6,
          ph: Math.random() * Math.PI * 2,
          sp: 0.006 + Math.random() * 0.02,
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.x += m.vx + Math.sin(m.ph) * 0.22;
        m.y += m.vy;
        m.ph += m.sp;

        if (m.y < -14) { m.y = h + 10; m.x = Math.random() * w; }
        if (m.x < -14) m.x = w + 10;
        if (m.x > w + 14) m.x = -10;

        var twinkle = 0.55 + 0.45 * Math.sin(m.ph * 2.1);
        ctx.globalAlpha = m.a * twinkle;
        ctx.drawImage(sprite, m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }

    function start() { if (!running && motes.length) { running = true; frame(); } }
    function stop() { if (running) { running = false; if (raf) cancelAnimationFrame(raf); raf = null; } }

    resize();
    seed();
    start();

    var rt = null;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { resize(); seed(); }, 180);
    });

    // save battery when the tab is hidden
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });
  }

  function init() {
    buildPetals();
    buildParticles();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
