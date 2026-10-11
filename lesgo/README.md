# LESGO — Landing Page

A recreation of the [LESGO reference design](https://lesgowebsite.framer.website/) in plain HTML, CSS and vanilla JavaScript. It has no build step and no dependencies.

## Run

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Structure

```
lesgo/
├── index.html        # Semantic markup, one <section> per design block
├── css/style.css     # Design tokens, components, sections, responsive rules
├── js/main.js        # Intro, cursor, reveals, ticker, stacking, WebGL, cart
├── js/*-texture.js   # Images embedded as data URIs for WebGL under file://
└── assets/           # Provided images and video (renamed to kebab-case)
```

## Sections

1. **Header:** fixed. The background blurs on scroll, the header hides on scroll down, and mobile gets a circular-reveal menu.
2. **Hero:** full-screen video revealed from a dot (`clip-path` circle), with a word-by-word headline animation and a delayed CTA.
3. **Choose your flavor:** an infinite auto-scrolling ticker. The card layers (blurred colour glow, tub placement, type) are measured from the reference.
4. **Energy. Focus. Hydration. Performance.:** a WebGL tub (scroll-speed wave and RGB split) rises in tilted under the title, pins while it grows and straightens, then settles between the benefit cards. The texture is embedded in `js/tub-texture.js`.
5. **Feature banners (Lemon Heat / Electric Lime):** sticky stacking. The next banner slides over while the pinned one shrinks and dims. Mobile gets the portrait art via `<picture>`.
6. **Best sellers:** on hover, a wishlist button fades in at the top right and Add to Cart at the bottom centre. The header cart shows a count badge.
7. **For every part of your day:** the collage zooms out from the centre as you scroll (60% to 100%), smoothed by a spring so it overshoots slightly. Hovering a photo shows a label.
8. **Loved by all:** social tiles and a testimonial card.
9. **Stock up, save more:** the bundle image is drawn with WebGL, using a liquid ripple and RGB-split distortion that follows the cursor. The texture is embedded as a data URI (`js/bundle-texture.js`) so it also works from `file://`.
10. **Footer:** newsletter form, link columns, social links, large logo watermark.

## Notes

- Cursor follower: a dot with a fading tail springs after the native pointer. It becomes a ring over links and buttons, is hidden over the WebGL offer image, and is disabled on touch devices.
- Responsive breakpoints are at 1100px and 767px. Touch devices get always-visible product actions.
- Respects `prefers-reduced-motion`.
- All scroll effects run in a single `requestAnimationFrame` loop, and reveals use `IntersectionObserver`.
