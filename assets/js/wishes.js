/* ==========================================================================
   wishes.js — scroll-reveal for the 4 wish cards and the "reasons" chips
   ========================================================================== */
(function () {
  "use strict";

  function el(id) { return document.getElementById(id); }

  function buildReasons() {
    var host = el("reasons");
    if (!host) return;
    var list = (window.NB && window.NB.config && window.NB.config.reasons) || [];
    host.innerHTML = list
      .map(function (r, i) {
        return (
          '<span class="reason-chip" style="transition-delay:' +
          (i * 70) +
          'ms">' +
          escapeHtml(r) +
          "</span>"
        );
      })
      .join("");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* Reveal on scroll. IntersectionObserver where available, otherwise show
     everything straight away so content is never trapped off-screen.
     The threshold is kept low (and rootMargin generous) because a chip is
     short and can otherwise straddle the trigger line forever. */
  function observe(node, threshold) {
    if (!window.IntersectionObserver) {
      node.classList.add("is-in");
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { threshold: 0, rootMargin: "120px 0px 120px 0px" });
    io.observe(node);
  }

  function init() {
    buildReasons();

    document.querySelectorAll("#wish-grid .wish-card").forEach(function (card, i) {
      card.style.transitionDelay = i * 110 + "ms";
      observe(card);
    });

    document.querySelectorAll("#reasons .reason-chip").forEach(function (chip) {
      observe(chip);
    });

    /* Safety net: anything still hidden after the page settles gets revealed,
       so a missed observer callback can never leave the content invisible. */
    window.setTimeout(function () {
      document
        .querySelectorAll("#wish-grid .wish-card, #reasons .reason-chip")
        .forEach(function (n) { n.classList.add("is-in"); });
    }, 6000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
