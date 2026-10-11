/* ==========================================================================
   gallery.js — swipeable polaroid gallery (Swiper) + fullscreen lightbox
   Photos come from NB.config.photos. The tiny blurred LQIP loads first so a
   card never flashes white, then the full image cross-fades in.
   ========================================================================== */
(function () {
  "use strict";

  var track, swiper = null, lightbox, lbImg, lbCap, lbClose;
  var items = (window.NB && window.NB.config && window.NB.config.photos) || [];

  function el(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function buildSlides() {
    if (!track) return;
    track.innerHTML = items
      .map(function (p, i) {
        var tilt = (i % 2 === 0 ? -1 : 1) * (0.8 + (i % 3) * 0.5);
        return (
          '<div class="swiper-slide">' +
          '<figure class="polaroid" style="--tilt:' + tilt.toFixed(2) + 'deg" data-index="' + i + '" tabindex="0">' +
          '<span class="photo-tape" aria-hidden="true"></span>' +
          '<div class="photo-frame">' +
          '<img alt="' + esc(p.caption || "Nazneen") + '" loading="lazy" decoding="async" data-src="' + esc(p.file) + '">' +
          "</div>" +
          "<figcaption>" +
          '<span class="cap-no">No. ' + String(i + 1).padStart(2, "0") + "</span>" +
          '<span class="cap-text">' + esc(p.caption || "") + "</span>" +
          "</figcaption>" +
          "</figure>" +
          "</div>"
        );
      })
      .join("");
  }

  /* LQIP first, then the real image. */
  function hydrate(slide) {
    var img = slide && slide.querySelector("img");
    if (!img || img.dataset.done) return;
    img.dataset.done = "1";

    var frame = slide.querySelector(".photo-frame");
    var file = img.dataset.src || "";
    var tiny = file.replace(/\.(jpe?g|png|webp)$/i, ".tiny.$1");

    var pre = new Image();
    pre.onload = function () {
      if (frame) frame.style.backgroundImage = "url('" + tiny + "')";
    };
    pre.src = tiny;

    var full = new Image();
    full.onload = function () {
      img.src = full.src;
      requestAnimationFrame(function () { img.classList.add("is-loaded"); });
    };
    full.onerror = function () { img.classList.add("is-missing"); };
    full.src = file;
  }

  function initSwiper() {
    var host = el("gallery-swiper");
    if (!host) return;

    if (!window.Swiper) { // graceful fallback: plain horizontal scroller
      host.style.overflowX = "auto";
      var wrap = host.querySelector(".swiper-wrapper");
      if (wrap) { wrap.style.display = "flex"; wrap.style.gap = "20px"; }
      track.querySelectorAll(".swiper-slide").forEach(hydrate);
      return;
    }

    // Swiper 11 renders pagination where you tell it to. Create the holder in
    // .gallery-shell BEFORE constructing so it is part of the initial params.
    var holder = host.parentElement;
    var dots = holder && holder.querySelector(".swiper-pagination");
    if (holder && !dots) {
      dots = document.createElement("div");
      dots.className = "swiper-pagination";
      holder.appendChild(dots);
    }

    swiper = new Swiper(host, {
      slidesPerView: "auto",
      centeredSlides: true,
      spaceBetween: 26,
      grabCursor: true,
      speed: 720,
      watchSlidesProgress: true,
      slideToClickedSlide: true,
      keyboard: { enabled: true, onlyInViewport: true },
      a11y: { enabled: true },
      pagination: dots
        ? { el: dots, clickable: true, bulletClass: "swiper-pagination-bullet",
            bulletActiveClass: "swiper-pagination-bullet-active" }
        : false,
      navigation: { prevEl: el("gal-prev"), nextEl: el("gal-next") },
      on: {
        init: function () { hydrateNeighbors(this); },
        slideChange: function () { hydrateNeighbors(this); },
      },
    });
  }

  function hydrateNeighbors(inst) {
    if (!inst || !inst.slides) return;
    for (var i = -1; i <= 1; i++) {
      var s = inst.slides[inst.activeIndex + i];
      if (s) hydrate(s);
    }
  }

  function openLightbox(index) {
    var p = items[index];
    if (!p || !lightbox) return;
    lbImg.src = p.file;
    lbImg.alt = p.caption || "Nazneen";
    lbCap.textContent = p.caption || "";
    lightbox.classList.add("is-open");
    document.body.classList.add("is-locked");
    if (lbClose) lbClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    document.body.classList.remove("is-locked");
  }

  function init() {
    track = el("gallery-track");
    lightbox = el("lightbox");
    lbImg = el("lb-img");
    lbCap = el("lb-cap");
    lbClose = el("lb-close");
    if (!track) return;

    buildSlides();
    initSwiper();

    /* ---------- lightbox ---------- */
    track.addEventListener("click", function (e) {
      var card = e.target.closest(".polaroid");
      if (card) openLightbox(Number(card.dataset.index));
    });
    track.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var card = e.target.closest(".polaroid");
      if (card) { e.preventDefault(); openLightbox(Number(card.dataset.index)); }
    });
    if (lbClose) lbClose.addEventListener("click", closeLightbox);
    if (lightbox) {
      lightbox.addEventListener("click", function (e) {
        if (e.target === lightbox) closeLightbox();
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLightbox();
    });

    /* ---------- lazy hydrate whatever scrolls into view ---------- */
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.querySelectorAll("img[data-src]").forEach(function (i) {
            hydrate(i.closest(".swiper-slide"));
          });
          io.unobserve(en.target);
        });
      }, { rootMargin: "240px" });
      io.observe(track);
    } else {
      track.querySelectorAll(".swiper-slide").forEach(hydrate);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
