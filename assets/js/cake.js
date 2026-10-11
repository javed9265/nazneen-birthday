/* ==========================================================================
   cake.js — tap each candle flame to blow it out; when the last one dies,
   fireworks + confetti + a full-screen "Happy Birthday" shout.
   ========================================================================== */
(function () {
  "use strict";

  var holder, wrap, status, resetBtn, candles = [], blown = 0, celebrated = false;

  function el(id) { return document.getElementById(id); }

  function total() {
    var c = window.NB && window.NB.config && window.NB.config.candleCount;
    return c || 5;
  }

  /* --- build the candles + scatter gold sprinkles on the tiers ----------- */
  function buildCake() {
    holder.innerHTML = "";
    candles = [];
    blown = 0;
    celebrated = false;
    wrap.classList.remove("all-out");

    for (var i = 0; i < total(); i++) {
      var c = document.createElement("div");
      c.className = "candle";
      c.setAttribute("role", "button");
      c.setAttribute("tabindex", "0");
      c.setAttribute("aria-label", "Candle " + (i + 1) + ", tap to blow out");
      c.dataset.index = String(i);
      c.innerHTML = '<span class="wick"></span><span class="flame"></span><span class="smoke"></span>';
      holder.appendChild(c);
      candles.push(c);
    }

    scatterSprinkles();
    setStatus();
  }

  function scatterSprinkles() {
    wrap.querySelectorAll(".sprinkle").forEach(function (s) { s.remove(); });
    var tiers = wrap.querySelectorAll(".tier");
    tiers.forEach(function (tier) {
      var n = tier.classList.contains("tier-base") ? 9 : tier.classList.contains("tier-mid") ? 7 : 5;
      for (var i = 0; i < n; i++) {
        var s = document.createElement("span");
        s.className = "sprinkle";
        s.style.left = 6 + Math.random() * 88 + "%";
        s.style.top = 32 + Math.random() * 60 + "%";
        s.style.transform = "rotate(" + Math.round(Math.random() * 180) + "deg)";
        s.style.opacity = (0.5 + Math.random() * 0.5).toFixed(2);
        if (Math.random() > 0.6) s.style.background = "#ff8fb3";
        tier.appendChild(s);
      }
    });
  }

  /* --- status copy ------------------------------------------------------- */
  var NUDGES = [
    "Close your eyes. <strong>Breathe.</strong>",
    "Tap a flame to blow it out.",
    "One down. Keep going…",
    "Halfway there.",
    "Almost — one more.",
  ];

  function setStatus() {
    if (celebrated) return;
    var left = candles.length - blown;
    if (left <= 0) return;
    var line = NUDGES[Math.min(blown, NUDGES.length - 1)];
    status.innerHTML =
      "<strong>" + left + (left === 1 ? " candle" : " candles") + "</strong> still burning. " +
      (blown === 0 ? "Tap them out." : line);
  }

  /* --- blow one out ------------------------------------------------------ */
  function blow(candle) {
    if (!candle || candle.classList.contains("is-out") || celebrated) return;

    candle.classList.add("is-out");
    candle.setAttribute("aria-label", "Candle blown out");
    blown++;

    // a soft puff of confetti at the flame's position
    if (window.confetti) {
      var r = candle.getBoundingClientRect();
      window.confetti({
        particleCount: 12,
        spread: 46,
        startVelocity: 22,
        scalar: 0.7,
        ticks: 90,
        origin: {
          x: (r.left + r.width / 2) / window.innerWidth,
          y: (r.top - 26) / window.innerHeight,
        },
        colors: ["#f4cf7a", "#fff3cf", "#ff8fb3", "#ffffff"],
      });
    }

    setStatus();

    if (blown >= candles.length) celebrate();
  }

  /* --- the big moment ---------------------------------------------------- */
  function celebrate() {
    celebrated = true;
    wrap.classList.add("all-out");
    status.innerHTML =
      "You got every one. Now <strong>make that wish</strong> — and know it is already coming true.";
    resetBtn.classList.add("is-shown");

    var shout = document.getElementById("wish-shout");
    if (shout) {
      shout.classList.remove("is-shown");
      void shout.offsetWidth; // restart the animation
      shout.classList.add("is-shown");
    }

    fireworks();
    if (window.NB && window.NB.rain) window.NB.rain(5200);
  }

  /* --- a short multi-burst firework show, rose + gold -------------------- */
  function fireworks() {
    if (!window.confetti) return;
    var palette = ["#f4cf7a", "#fff3cf", "#e8457b", "#ff8fb3", "#ffffff"];
    var bursts = [
      { x: 0.2, y: 0.3, d: 0 },
      { x: 0.8, y: 0.25, d: 260 },
      { x: 0.5, y: 0.2, d: 520 },
      { x: 0.12, y: 0.5, d: 820 },
      { x: 0.88, y: 0.48, d: 1060 },
      { x: 0.35, y: 0.36, d: 1320 },
      { x: 0.66, y: 0.34, d: 1560 },
    ];

    bursts.forEach(function (b) {
      setTimeout(function () {
        window.confetti({
          particleCount: 70,
          spread: 100,
          startVelocity: 42,
          scalar: 1.05,
          decay: 0.9,
          gravity: 0.85,
          ticks: 240,
          shapes: ["circle", "square"],
          colors: palette,
          origin: { x: b.x, y: b.y },
        });
      }, b.d);
    });
  }

  /* --- binding ----------------------------------------------------------- */
  function init() {
    wrap = el("cake-wrap");
    holder = el("candles");
    status = el("cake-status");
    resetBtn = el("cake-reset");
    if (!wrap || !holder) return;

    buildCake();

    holder.addEventListener("click", function (e) {
      var c = e.target.closest(".candle");
      if (c) blow(c);
    });

    holder.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var c = e.target.closest(".candle");
      if (c) { e.preventDefault(); blow(c); }
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        resetBtn.classList.remove("is-shown");
        buildCake();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
