/* ==========================================================================
   letter.js — wax seal -> envelope opens -> letter unfolds line by line
   ========================================================================== */
(function () {
  "use strict";

  var envelope, paper, hint, nextBtn, rereadBtn, timeline = null, isOpen = false;

  var prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(id) { return document.getElementById(id); }

  function revealLines() {
    var lines = paper.querySelectorAll(".reveal-line");
    lines.forEach(function (l) {
      l.style.opacity = "";
      l.style.transform = "";
      l.classList.remove("is-shown");
    });

    if (prefersReduced || !window.gsap) {
      lines.forEach(function (l) { l.classList.add("is-shown"); });
      return;
    }

    gsap.killTweensOf(lines);
    gsap.set(lines, { opacity: 0, y: 18, filter: "blur(5px)" });
    timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    timeline.to(lines, {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 1.05,
      stagger: 0.95,
      onStart: function () { lines.forEach(function (l) { l.classList.add("is-shown"); }); },
    });
  }

  function openLetter() {
    if (isOpen) return;
    isOpen = true;

    // stop the idle caption pulse before we change its text
    if (hint && window.gsap) gsap.killTweensOf(hint);

    envelope.classList.add("is-open");
    if (hint) {
      hint.textContent = "It's yours now.";
      hint.style.opacity = "0";
      setTimeout(function () { hint.style.display = "none"; }, 500);
    }

    // let the flap swing + letter slide out, then swap to the flat paper.
    // Wrapped defensively: if anything in the reveal throws, the letter must
    // still be visible rather than trapping the reader on a blank envelope.
    setTimeout(function () {
      try {
        envelope.style.display = "none";
        paper.hidden = false;
        if (paper.scrollIntoView) paper.scrollIntoView({ behavior: "smooth", block: "center" });

        if (window.gsap && !prefersReduced) {
          gsap.fromTo(
            paper,
            { opacity: 0, y: 40, rotateX: -9, scale: 0.97 },
            { opacity: 1, y: 0, rotateX: 0, scale: 1, duration: 1.25, ease: "power3.out" }
          );
        }
        revealLines();
        if (window.NB && window.NB.sprinkle) window.NB.sprinkle(30, 40, 220);
      } catch (err) {
        // last-resort fallback so the letter is always readable
        envelope.style.display = "none";
        paper.hidden = false;
        paper.querySelectorAll(".reveal-line").forEach(function (l) {
          l.classList.add("is-shown");
        });
      }
    }, prefersReduced ? 60 : 820);
  }

  function reread() {
    if (paper.hidden) return;
    if (timeline) timeline.kill();
    revealLines();
    paper.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function bind() {
    envelope = el("envelope");
    paper = el("letter-paper");
    hint = el("seal-hint");
    nextBtn = el("letter-next");
    rereadBtn = el("letter-reread");
    if (!envelope || !paper) return;

    envelope.addEventListener("click", openLetter);
    envelope.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLetter();
      }
    });

    if (rereadBtn) rereadBtn.addEventListener("click", reread);

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        var target = document.getElementById("cake-section");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    /* A visual nudge that does NOT move the clickable hit-box: only the
       caption's opacity breathes, so #envelope's box stays perfectly still
       (a perpetually moving target is hostile to taps and to tests). */
    if (window.gsap && !prefersReduced && hint) {
      gsap.to(hint, {
        opacity: 1,
        duration: 1.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
