"use client";

import { useEffect, useRef } from "react";

interface SkylineEngineProps {
  sceneNames: string[];
}

export default function SkylineEngine({ sceneNames }: SkylineEngineProps) {
  const namesRef = useRef(sceneNames);
  namesRef.current = sceneNames;

  useEffect(() => {
    const canvas = document.getElementById(
      "webgl-canvas"
    ) as HTMLCanvasElement;
    const gl = canvas.getContext("webgl", { alpha: false });

    if (!gl) {
      canvas.style.background = "#0a0a0a";
      return;
    }

    /* ── shaders ── */

    const vs = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;

    const fs = `
precision highp float;
uniform vec2 uR;
uniform float uT, uS, uSc, uBl, uOff;
uniform vec3 uBg;

#define TAU 6.2831853

mat2 r2(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

float sphere(vec3 p, float r) { return length(p) - r; }

float torus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

float box(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.);
}

float octa(vec3 p, float s) {
  p = abs(p);
  return (p.x + p.y + p.z - s) * .5773;
}

float sdf(vec3 p) {
  float t = uT * .25, sc = uSc, bl = uBl;

  float d0 = sphere(p, .65 + .05 * sin(t * 1.3));

  vec3 p1 = p; p1.xz = r2(t * .6) * p1.xz;
  float d1 = torus(p1, vec2(.55, .22));

  vec3 p2 = p; p2.xy = r2(t * .4) * p2.xy; p2.yz = r2(t * .3) * p2.yz;
  float d2 = box(p2, vec3(.42 + .04 * sin(t * 2.)));

  vec3 p3 = p; p3.xy = r2(t * .5) * p3.xy;
  float d3 = octa(p3, .72 + .04 * sin(t * 1.7));

  vec3 p4 = p; p4.xz = r2(t * .7) * p4.xz;
  float d4a = torus(p4, vec2(.45, .15));
  vec3 p5 = p; p5.xy = r2(t * .5 + 1.2) * p5.xy;
  float d4b = torus(p5, vec2(.35, .12));
  float d4 = min(d4a, d4b);

  if (sc < 1.) return mix(d0, d1, bl);
  if (sc < 2.) return mix(d1, d2, bl);
  if (sc < 3.) return mix(d2, d3, bl);
  return mix(d3, d4, bl);
}

vec3 norm(vec3 p) {
  float e = .001;
  return normalize(vec3(
    sdf(p + vec3(e,0,0)) - sdf(p - vec3(e,0,0)),
    sdf(p + vec3(0,e,0)) - sdf(p - vec3(0,e,0)),
    sdf(p + vec3(0,0,e)) - sdf(p - vec3(0,0,e))
  ));
}

float hash3(vec3 p) {
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(
    mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x),
        mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
        mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y),
    f.z);
}

vec3 pal(float t) {
  float v = .55 + .4 * cos(TAU * .9 * t);
  return vec3(v);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - uR * .5) / min(uR.x, uR.y);
  vec2 suv = uv;
  suv.x -= uOff;
  vec3 ro = vec3(0, 0, 2.4);
  vec3 rd = normalize(vec3(suv, -1.2));

  float t = 0., hit = 0.;
  for (int i = 0; i < 96; i++) {
    float d = sdf(ro + rd * t);
    if (d < .001) { hit = 1.; break; }
    if (t > 6.) break;
    t += d;
  }

  vec3 bg = uBg, col = bg;

  if (hit > .5) {
    vec3 p = ro + rd * t;
    vec3 n = norm(p);
    vec3 l = normalize(vec3(.7, 1., .5));
    float NdV = clamp(dot(-rd, n), 0., 1.);

    vec3 bc = pal(uS);
    float dif = clamp(dot(n, l), 0., 1.);
    float spe = pow(clamp(dot(reflect(-l, n), -rd), 0., 1.), 32.);
    float fr  = pow(1. - NdV, 3.5);

    float bands = noise3(vec3(p.x * 3., p.y * 8. - uT * .08, p.z * 3.));
    float bandMask = smoothstep(.35, .65, bands) * .12;

    float pulse = sin(p.y * 6. - uT * .6) * .5 + .5;
    pulse = pow(pulse, 12.) * fr * 1.2;

    float micro = noise3(p * 28. + uT * .1);
    float brushedSpe = spe * (.7 + .6 * micro);

    col = bc * (dif * .65 + .3);
    col += brushedSpe * .5;
    col += fr * vec3(1.) * .5;
    col += bandMask;
    col += pulse * vec3(1.);

    col = mix(bg, col, exp(-t * .15));
  }

  col = mix(uBg, col, clamp(1. - dot(uv * .9, uv * .9), 0., 1.));
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(127.1, 311.7))) * 43758.5) - .5) * .025;

  gl_FragColor = vec4(col, 1.);
}`;

    const mkShader = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, vs)!);
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, fs)!);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      console.error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    gl.uniform3f(
      gl.getUniformLocation(prog, "uBg"),
      0.039,
      0.039,
      0.039
    );

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const ap = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(ap);
    gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);

    const uR = gl.getUniformLocation(prog, "uR");
    const uTi = gl.getUniformLocation(prog, "uT");
    const uScroll = gl.getUniformLocation(prog, "uS");
    const uScene = gl.getUniformLocation(prog, "uSc");
    const uBlend = gl.getUniformLocation(prog, "uBl");
    const uOffLoc = gl.getUniformLocation(prog, "uOff");
    const uBg = gl.getUniformLocation(prog, "uBg");

    let maxScroll = 1;

    const resize = () => {
      const dpr = Math.min(devicePixelRatio ?? 1, 2);
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uR, canvas.width, canvas.height);
      maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - innerHeight
      );
    };
    resize();
    window.addEventListener("resize", resize);

    /* ── scroll state ── */

    const N = 5;
    const ease = 0.1;

    let tgt = 0;
    let smooth = 0;
    let velocity = 0;

    const onScroll = () => {
      tgt = maxScroll > 0 ? scrollY / maxScroll : 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const linePx = 16;
      const pagePx = innerHeight * 0.9;
      const delta =
        e.deltaMode === 1
          ? e.deltaY * linePx
          : e.deltaMode === 2
          ? e.deltaY * pagePx
          : e.deltaY;
      velocity += delta;
      velocity = Math.max(-600, Math.min(600, velocity));
      closePage();
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    /* ── pagination state ── */

    const panDir = [0, -1, 1, -1, 1];
    let activePage = 0;
    let targetOff = 0;
    let smoothOff = 0;

    const pages = document.querySelectorAll<HTMLElement>(".page");
    const dots = document.querySelectorAll<HTMLElement>(".scene-dot");
    const scrollCardsEl = document.getElementById("scroll-cards")!;
    const scrollCards = document.querySelectorAll<HTMLElement>(".scroll-card");
    const floatingCta = document.getElementById("floating-build-cta");

    const openPage = (index: number) => {
      if (activePage === index) {
        closePage();
        return;
      }
      activePage = index;
      const halfW =
        canvas.width / (4 * Math.min(canvas.width, canvas.height));
      targetOff = panDir[index] * halfW;
      pages.forEach((p, i) => p.classList.toggle("active", i === index));
      scrollCardsEl.classList.add("hidden");
      floatingCta?.classList.add("hidden");
    };

    const closePage = () => {
      activePage = -1;
      targetOff = 0;
      pages.forEach((p) => p.classList.remove("active"));
      scrollCardsEl.classList.remove("hidden");
      floatingCta?.classList.remove("hidden");
    };

    const dotClickHandlers: Array<() => void> = [];
    dots.forEach((d, i) => {
      d.style.cursor = "pointer";
      const handler = () => openPage(i);
      dotClickHandlers.push(handler);
      d.addEventListener("click", handler);
    });

    const linkClickHandlers: Array<{
      el: HTMLAnchorElement;
      handler: (e: Event) => void;
    }> = [];
    document
      .querySelectorAll<HTMLAnchorElement>('a[href^="#p"]')
      .forEach((a) => {
        const handler = (e: Event) => {
          e.preventDefault();
          const idx = parseInt(
            a.getAttribute("href")!.replace("#p", ""),
            10
          );
          openPage(idx);
        };
        linkClickHandlers.push({ el: a, handler });
        a.addEventListener("click", handler);
      });

    const wordmark = document.querySelector<HTMLElement>(".nav-wordmark");
    const wordmarkHandler = () => openPage(0);
    wordmark?.addEventListener("click", wordmarkHandler);

    const onTouchStart = () => closePage();
    window.addEventListener("touchstart", onTouchStart, { passive: true });

    /* ── HUD ── */

    const progFill = document.getElementById("prog-fill")!;
    const hudPct = document.getElementById("hud-pct")!;
    const sceneName = document.getElementById("scene-name")!;

    let currentScene = 0;

    const updateHUD = (s: number) => {
      const p = Math.round(s * 100);
      hudPct.textContent = String(p).padStart(3, "0") + "%";
      progFill.style.width = `${p}%`;
      const si = Math.min(N - 1, Math.floor(s * N));
      sceneName.textContent = namesRef.current[si];
      dots.forEach((d, i) => d.classList.toggle("active", i === si));
      if (si !== currentScene) {
        currentScene = si;
        scrollCards.forEach((c, i) =>
          c.classList.toggle("active", i === si)
        );
      }
    };

    /* ── theme ── */

    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const hexToVec3 = (hex: string): [number, number, number] => {
      const n = parseInt(hex.replace("#", ""), 16);
      return [
        ((n >> 16) & 255) / 255,
        ((n >> 8) & 255) / 255,
        (n & 255) / 255,
      ];
    };

    const bgColors: Record<string, string> = {
      dark: "#0a0a0a",
      light: "#f0f0f0",
    };

    const updateBgColor = (theme: string) => {
      const [r, g, b] = hexToVec3(bgColors[theme] ?? bgColors.dark);
      gl.uniform3f(uBg, r, g, b);
    };

    const getSystemTheme = () => (mq.matches ? "dark" : "light");

    const applyTheme = (theme: string) => {
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.style.colorScheme = theme;
      updateBgColor(theme);
    };

    applyTheme(getSystemTheme());

    const onMediaChange = (e: MediaQueryListEvent) => {
      applyTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onMediaChange);

    const themeBtn = document.getElementById("theme-toggle");
    const onThemeClick = () => {
      const current =
        document.documentElement.getAttribute("data-theme") ||
        getSystemTheme();
      applyTheme(current === "dark" ? "light" : "dark");
    };
    themeBtn?.addEventListener("click", onThemeClick);

    /* ── render loop ── */

    const t0 = performance.now();
    let lastNow = t0;
    let rafId: number;

    const frame = (now: number) => {
      rafId = requestAnimationFrame(frame);

      const dt = Math.min((now - lastNow) / 1000, 0.05);
      lastNow = now;

      velocity *= Math.pow(0.85, dt * 60);
      if (Math.abs(velocity) > 0.2)
        window.scrollBy({ top: velocity * ease, behavior: "auto" });

      smooth += (tgt - smooth) * (1 - Math.exp(-dt * 8));

      const raw = smooth * (N - 1);
      const flr = Math.floor(raw);
      const si = Math.min(flr, N - 2);
      const bl = flr >= N - 1 ? 1.0 : raw - flr;

      updateHUD(smooth);

      smoothOff += (targetOff - smoothOff) * (1 - Math.exp(-dt * 5));

      gl.uniform1f(uTi, (now - t0) / 1000);
      gl.uniform1f(uScroll, smooth);
      gl.uniform1f(uScene, si);
      gl.uniform1f(uBlend, bl);
      gl.uniform1f(uOffLoc, smoothOff);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    rafId = requestAnimationFrame(frame);

    /* ── cleanup ── */

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      mq.removeEventListener("change", onMediaChange);
      themeBtn?.removeEventListener("click", onThemeClick);
      wordmark?.removeEventListener("click", wordmarkHandler);
      dots.forEach((d, i) =>
        d.removeEventListener("click", dotClickHandlers[i])
      );
      linkClickHandlers.forEach(({ el, handler }) =>
        el.removeEventListener("click", handler)
      );
    };
  }, []);

  return null;
}
