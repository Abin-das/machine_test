/* =========================================================
   LESGO — interactions
   ========================================================= */
(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Intro: dot → video reveal, staggered headline ---------- */
  document.querySelectorAll('.hero__title .word').forEach((word, i) => {
    word.style.transitionDelay = `${0.7 + i * 0.09}s`;
  });

  const heroVideo = document.querySelector('.hero__video');
  const start = () => requestAnimationFrame(() => body.classList.add('is-loaded'));
  // Wait for the first video frame (or a timeout) so the reveal never shows an empty box
  if (heroVideo && heroVideo.readyState < 2) {
    let started = false;
    const once = () => { if (!started) { started = true; start(); } };
    heroVideo.addEventListener('loadeddata', once, { once: true });
    setTimeout(once, 1200);
  } else {
    start();
  }

  /* ---------- Header: background on scroll, hide on scroll down ---------- */
  const header = document.getElementById('header');
  let lastY = window.scrollY;
  const onHeaderScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    header.classList.toggle('is-hidden', y > lastY && y > 400 && !body.classList.contains('menu-open'));
    lastY = y;
  };

  /* ---------- Mobile menu ---------- */
  const toggle = document.getElementById('menuToggle');
  const setMenu = (open) => {
    body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  document.querySelectorAll('#nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Scroll reveal (staggered within each parent) ---------- */
  const reveals = document.querySelectorAll('.reveal');
  const groups = new Map();
  reveals.forEach((el) => {
    const siblings = groups.get(el.parentElement) || [];
    el.style.setProperty('--d', `${siblings.length * 0.08}s`);
    siblings.push(el);
    groups.set(el.parentElement, siblings);
  });

  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Flavor ticker: duplicate the cards for a seamless loop ---------- */
  const track = document.getElementById('flavorTrack');
  if (track) {
    [...track.children].forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  }

  /* ---------- Scroll-linked effects (one rAF loop) ---------- */
  const features = [...document.querySelectorAll('.feature')];
  const daySection = document.getElementById('day');
  const dayImgs = daySection ? [...daySection.querySelectorAll('.day__img')] : [];
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  // Banners: the first one scales 0.9 → 1 and fades 0.2 → 1 as it enters (reference timing), then pins.
  // Each following banner slides over the pinned one, which shrinks and dims as it gets covered.
  const updateFeatures = () => {
    const vh = window.innerHeight;
    const wrap = features[0] && features[0].parentElement;
    if (!wrap) return;
    const top = wrap.getBoundingClientRect().top + parseFloat(getComputedStyle(wrap).paddingTop);
    const enter = clamp01((vh * 1.198 - top) / (vh * 0.978));
    features.forEach((feature, i) => {
      const next = features[i + 1];
      const covered = next ? clamp01(1 - next.getBoundingClientRect().top / feature.offsetHeight) : 0;
      const entryScale = i === 0 ? 0.9 + 0.1 * enter : 1;
      feature.style.setProperty('--scale', (entryScale * (1 - covered * 0.1)).toFixed(4));
      feature.style.setProperty('--fo', (i === 0 ? 0.2 + 0.8 * enter : 1).toFixed(4));
      feature.style.setProperty('--bright', (1 - covered * 0.7).toFixed(4));
    });
  };

  // Day collage: the whole collage zooms out from the section centre as it scrolls up.
  // Matches the reference: 60% size when the section enters, full size once its top passes ~100px above the viewport.
  // The scale follows the scroll through a spring, so the photos lag, overshoot slightly and settle (the "bounce").
  const daySpring = { s: 0.6, v: 0, target: 0.6, running: false };
  const applyDay = () => {
    const cx = daySection.offsetWidth / 2, cy = daySection.offsetHeight / 2;
    const s = daySpring.s;
    dayImgs.forEach((fig) => {
      const dx = fig.offsetLeft + fig.offsetWidth / 2 - cx;
      const dy = fig.offsetTop + fig.offsetHeight / 2 - cy;
      fig.style.setProperty('--fx', `${dx * (s - 1)}px`);
      fig.style.setProperty('--fy', `${dy * (s - 1)}px`);
      fig.style.setProperty('--fs', s.toFixed(4));
    });
  };
  const stepDay = () => {
    daySpring.v = (daySpring.v + (daySpring.target - daySpring.s) * 0.06) * 0.82;
    daySpring.s += daySpring.v;
    applyDay();
    if (Math.abs(daySpring.v) > 0.0002 || Math.abs(daySpring.target - daySpring.s) > 0.0005) {
      requestAnimationFrame(stepDay);
    } else {
      daySpring.running = false;
    }
  };
  const updateDay = () => {
    const rect = daySection.getBoundingClientRect();
    const vh = window.innerHeight;
    daySpring.target = 0.6 + 0.4 * clamp01((vh - rect.top) / (vh + 100));
    if (!daySpring.running) { daySpring.running = true; requestAnimationFrame(stepDay); }
  };

  // Intro tub, measured from the reference: it rises in just under the title (small, tilted), then stays pinned
  // about two-thirds down the viewport while it grows and straightens, and finally scrolls away with the cards.
  const intro = document.getElementById('intro');
  const introTitle = intro && intro.querySelector('.intro__title');
  const canSlot = document.getElementById('canSlot');
  const floatCan = document.getElementById('floatCan');
  const PIN = 0.68;                                   // pinned tub centre, as a fraction of the viewport height

  const updateTub = () => {
    const vh = window.innerHeight;
    const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;
    const slot = canSlot.getBoundingClientRect();
    const size = window.innerWidth >= 1100 ? Math.min(window.innerWidth * 0.36, 540) : slot.width;

    const end = { x: slot.left + slot.width / 2, y: docTop(canSlot) + slot.height / 2 };
    const startY = introTitle.getBoundingClientRect().bottom + window.scrollY + size * 0.42;
    const y = Math.min(Math.max(window.scrollY + vh * PIN, startY), end.y);
    const q = end.y > startY ? (y - startY) / (end.y - startY) : 1;

    const scale = 0.62 + 0.38 * q;
    const rotate = 10 * (1 - q);
    floatCan.style.width = `${size}px`;
    floatCan.style.transform =
      `translate3d(${end.x - size / 2}px, ${y - docTop(intro) - size / 2}px, 0) rotate(${rotate}deg) scale(${scale})`;
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onHeaderScroll();
      if (floatCan) updateTub();
      if (!reduceMotion) {
        updateFeatures();
        if (daySection) updateDay();
      }
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  const canHover = window.matchMedia('(hover: hover)').matches;

  /* ---------- Cursor follower: dot springs after the real pointer, leaving a fading tail ---------- */
  const cursorCanvas = document.getElementById('cursor');
  if (cursorCanvas && canHover && !reduceMotion) {
    const ctx = cursorCanvas.getContext('2d');
    const TRAIL_LIFE = 320;               // ms a tail point stays alive
    const STIFFNESS = 0.09, DAMPING = 0.72;
    const points = [];
    const mouse = { x: -100, y: -100 };
    const dot = { x: -100, y: -100, vx: 0, vy: 0, r: 5, hollow: 0 };
    let visible = false, overTarget = false, hidden = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cursorCanvas.width = innerWidth * dpr;
      cursorCanvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!visible) { dot.x = mouse.x; dot.y = mouse.y; visible = true; }
      overTarget = !!e.target.closest('a, button, input, label, .flavor-card, .social');
      hidden = !!e.target.closest('.offer__media');   // only the WebGL effect shows over the bundle image
    });
    document.addEventListener('mouseleave', () => { visible = false; points.length = 0; });

    const draw = (now) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);

      if (hidden) {                      // park the dot on the pointer so it reappears cleanly
        dot.x = mouse.x; dot.y = mouse.y; dot.vx = dot.vy = 0;
        points.length = 0;
      } else if (visible) {
        // Spring towards the pointer so the dot lags behind and overshoots slightly
        dot.vx = (dot.vx + (mouse.x - dot.x) * STIFFNESS) * DAMPING;
        dot.vy = (dot.vy + (mouse.y - dot.y) * STIFFNESS) * DAMPING;
        dot.x += dot.vx;
        dot.y += dot.vy;
        dot.r += ((overTarget ? 12 : 5) - dot.r) * 0.2;
        dot.hollow += ((overTarget ? 1 : 0) - dot.hollow) * 0.2;

        // Tail follows the dot's own path, thinning and fading with age
        const last = points[points.length - 1];
        if (!last || Math.hypot(dot.x - last.x, dot.y - last.y) > 1) points.push({ x: dot.x, y: dot.y, t: now });
        while (points.length && now - points[0].t > TRAIL_LIFE) points.shift();

        ctx.lineCap = 'round';
        for (let i = 1; i < points.length; i++) {
          const p0 = points[i - 1], p1 = points[i];
          const life = 1 - (now - p1.t) / TRAIL_LIFE;
          ctx.strokeStyle = `rgba(255,255,255,${life * 0.85})`;
          ctx.lineWidth = Math.max(0.4, life * 2.5);
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
        }

        // Head: solid dot, becomes a ring over interactive elements
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${1 - dot.hollow})`;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  /* ---------- WebGL image helper: draws one textured quad with a custom fragment shader ---------- */
  const createGLImage = (canvas, src, fragSource, { alpha = false } = {}) => {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha });
    if (!gl) return null;
    const vert = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        v_uv = a_pos * 0.5 + 0.5;
        v_uv.y = 1.0 - v_uv.y;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }`;
    const compile = (type, source) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSource));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const api = {
      ready: false,
      onReady: null,
      uniform: (name) => gl.getUniformLocation(prog, name),
      gl,
      resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(canvas.clientWidth * dpr);
        canvas.height = Math.round(canvas.clientHeight * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
      },
      draw() {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
    };

    const img = new Image();
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      api.resize();
      api.ready = true;
      if (api.onReady) api.onReady();
    };
    img.src = src;
    window.addEventListener('resize', () => api.resize());
    return api;
  };

  /* ---------- Offer image: WebGL liquid distortion that follows the cursor ---------- */
  const offerMedia = document.getElementById('offerMedia');
  const offerGl = offerMedia && window.BUNDLE_TEXTURE && !reduceMotion && createGLImage(
    document.getElementById('offerGl'),
    window.BUNDLE_TEXTURE,
    `precision mediump float;
      uniform sampler2D u_tex;
      uniform vec2 u_mouse;
      uniform vec2 u_vel;
      uniform float u_strength;
      uniform float u_time;
      varying vec2 v_uv;
      void main() {
        vec2 d = v_uv - u_mouse;
        float dist = length(d);
        float falloff = smoothstep(0.32, 0.0, dist) * u_strength;
        float ripple = sin(dist * 38.0 - u_time * 7.0) * 0.012 * falloff;
        vec2 uv = v_uv - d * falloff * 0.45 - u_vel * falloff * 0.6 + ripple;
        float split = 0.008 * falloff;            // subtle RGB split inside the bulge
        float r = texture2D(u_tex, uv + vec2(split, 0.0)).r;
        float g = texture2D(u_tex, uv).g;
        float b = texture2D(u_tex, uv - vec2(split, 0.0)).b;
        gl_FragColor = vec4(r, g, b, 1.0);
      }`
  );
  if (offerGl) {
    const uMouse = offerGl.uniform('u_mouse'), uVel = offerGl.uniform('u_vel');
    const uStrength = offerGl.uniform('u_strength'), uTime = offerGl.uniform('u_time');
    const target = { x: 0.5, y: 0.5 }, mouse = { x: 0.5, y: 0.5 }, vel = { x: 0, y: 0 };
    let strength = 0, hovering = false, inView = false, running = false;
    const g = offerGl.gl;

    const render = (t) => {
      if (!inView) { running = false; return; }   // pause when off-screen
      const px = mouse.x, py = mouse.y;
      mouse.x += (target.x - mouse.x) * 0.12;
      mouse.y += (target.y - mouse.y) * 0.12;
      vel.x += ((mouse.x - px) * 4 - vel.x) * 0.2;
      vel.y += ((mouse.y - py) * 4 - vel.y) * 0.2;
      strength += ((hovering ? 1 : 0) - strength) * 0.06;
      g.uniform2f(uMouse, mouse.x, mouse.y);
      g.uniform2f(uVel, vel.x, vel.y);
      g.uniform1f(uStrength, strength);
      g.uniform1f(uTime, t / 1000);
      offerGl.draw();
      requestAnimationFrame(render);
    };
    const start = () => {
      if (offerGl.ready && inView && !running) { running = true; requestAnimationFrame(render); }
    };
    offerGl.onReady = () => { offerMedia.classList.add('is-gl'); start(); };

    offerMedia.addEventListener('pointermove', (e) => {
      const r = offerMedia.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width;
      target.y = (e.clientY - r.top) / r.height;
      hovering = true;
    });
    offerMedia.addEventListener('pointerleave', () => { hovering = false; });
    new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; start(); }).observe(offerMedia);
  }

  /* ---------- Intro tub: WebGL wave that reacts to scroll speed ---------- */
  const tubGl = floatCan && window.TUB_TEXTURE && !reduceMotion && createGLImage(
    document.getElementById('tubGl'),
    window.TUB_TEXTURE,
    `precision mediump float;
      uniform sampler2D u_tex;
      uniform float u_vel;
      uniform float u_time;
      varying vec2 v_uv;
      void main() {
        float wave = sin(v_uv.y * 10.0 + u_time * 5.0) * 0.018 * u_vel;
        float bend = (v_uv.y - 0.5) * (v_uv.y - 0.5) * 0.12 * u_vel;   // tub flexes with scroll direction
        vec2 uv = vec2(v_uv.x + wave + bend, v_uv.y);
        float split = 0.006 * abs(u_vel);
        vec4 c = texture2D(u_tex, uv);
        c.r = texture2D(u_tex, uv + vec2(0.0, split)).r;
        c.b = texture2D(u_tex, uv - vec2(0.0, split)).b;
        gl_FragColor = c;
      }`,
    { alpha: true }
  );
  if (tubGl) {
    const uVel = tubGl.uniform('u_vel'), uTime = tubGl.uniform('u_time');
    let lastY = window.scrollY, vel = 0, running = false;
    const render = (t) => {
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      vel += (Math.max(-1, Math.min(1, dy / 40)) - vel) * 0.12;
      tubGl.gl.uniform1f(uVel, vel);
      tubGl.gl.uniform1f(uTime, t / 1000);
      tubGl.draw();
      if (Math.abs(vel) > 0.002 || Math.abs(dy) > 0) {
        requestAnimationFrame(render);
      } else {
        running = false;              // idle until the next scroll
      }
    };
    const kick = () => {
      if (tubGl.ready && !running) { running = true; requestAnimationFrame(render); }
    };
    tubGl.onReady = () => { floatCan.classList.add('is-gl'); kick(); };
    window.addEventListener('scroll', kick, { passive: true });
  }

  /* ---------- Product actions ---------- */
  document.querySelectorAll('.icon-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const on = btn.classList.toggle('is-active');
      btn.setAttribute('aria-pressed', String(on));
    });
  });

  const cart = document.querySelector('.header__cart');
  let count = 0;
  document.querySelectorAll('.product__cart').forEach((btn) => {
    btn.addEventListener('click', () => {
      count++;
      cart.dataset.count = count;
      cart.classList.remove('bump');
      void cart.offsetWidth;            // restart animation
      cart.classList.add('bump');
      const label = btn.querySelector('span');
      label.textContent = 'Added ✓';
      setTimeout(() => { label.textContent = 'Add to Cart'; }, 1400);
    });
  });

  /* ---------- Newsletter ---------- */
  const form = document.getElementById('newsletter');
  const msg = document.getElementById('newsMsg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    msg.textContent = "You're in the loop. Welcome to LESGO!";
    form.reset();
  });
})();
