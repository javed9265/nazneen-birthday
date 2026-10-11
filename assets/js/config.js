/* ==========================================================================
   config.js — every bit of personalisable content lives here.
   Swap the text or photos and the whole site updates.
   ========================================================================== */
window.NB = window.NB || {};

NB.config = {
  name: "Nazneen",

  /* --- photo gallery: 5 slots. caption is the little handwritten line --- */
  photos: [
    { file: "photos/photo1.jpg", caption: "That smile? My whole world." },
    { file: "photos/photo2.jpg", caption: "Pure sunshine, in a red dupatta." },
    { file: "photos/photo3.jpg", caption: "The day we shared dessert and everything else." },
    { file: "photos/photo4.jpg", caption: "Stealing my heart, one mirror selfie at a time." },
    { file: "photos/photo5.jpg", caption: "My favourite chaos, my favourite calm." },
  ],

  /* --- cake --- */
  candleCount: 5,

  /* --- reasons chips (shown under the wish cards) --- */
  reasons: [
    "your laugh at your own jokes",
    "how you say my name",
    "the way you care loudly",
    "your terrible dancing",
    "how safe you feel",
    "your 2am thoughts",
    "how you always share your food",
    "your stubborn kindness",
    "the face you make when you're sleepy",
    "how you never give up on me",
    "your handwriting in notes",
    "how you make ordinary days good",
  ],

  /* --- ambient tuning --- */
  ambient: {
    petals: 22,        // number of falling rose petals
    particles: 90,     // ambient gold sparkles
    reducedPetals: 6,  // if the visitor prefers reduced motion
  },
};
