"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";
import "./Plasma.css";

interface PlasmaProps {
  color?: string;
  speed?: number;
  direction?: "forward" | "reverse" | "pingpong";
  scale?: number;
  opacity?: number;
  mouseInteractive?: boolean;
  quality?: "low" | "medium" | "high" | "auto";
}

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 0.5, 0.2];
  return [
    Number.parseInt(result[1], 16) / 255,
    Number.parseInt(result[2], 16) / 255,
    Number.parseInt(result[3], 16) / 255,
  ];
};

const vertex = `#version 300 es
precision highp float;
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uCustomColor;
uniform float uUseCustomColor;
uniform float uSpeed;
uniform float uDirection;
uniform float uScale;
uniform float uOpacity;
uniform vec2 uMouse;
uniform float uMouseInteractive;
uniform float uQuality;
out vec4 fragColor;

void mainImage(out vec4 o, vec2 C) {
  vec2 center = iResolution.xy * 0.5;
  C = (C - center) / uScale + center;

  vec2 mouseOffset = (uMouse - center) * 0.0002;
  C += mouseOffset * length(C - center) * step(0.5, uMouseInteractive);

  float i, d, z, T = iTime * uSpeed * uDirection;
  vec3 O, p, S;

  // Adaptive iteration count based on quality setting
  int maxIterations = int(mix(30.0, 60.0, uQuality));
  for (vec2 r = iResolution.xy, Q; ++i < float(maxIterations); O += o.w/d*o.xyz) {
    p = z*normalize(vec3(C-.5*r,r.y));
    p.z -= 4.;
    S = p;
    d = p.y-T;

    p.x += .4*(1.+p.y)*sin(d + p.x*0.1)*cos(.34*d + p.x*0.05);
    Q = p.xz *= mat2(cos(p.y+vec4(0,11,33,0)-T));
    z+= d = abs(sqrt(length(Q*Q)) - .25*(5.+S.y))/3.+8e-4;
    o = 1.+sin(S.y+p.z*.5+S.z-length(S-p)+vec4(2,1,0,8));
  }

  o.xyz = tanh(O/1e4);
}

bool finite1(float x){ return !(isnan(x) || isinf(x)); }
vec3 sanitize(vec3 c){
  return vec3(
    finite1(c.r) ? c.r : 0.0,
    finite1(c.g) ? c.g : 0.0,
    finite1(c.b) ? c.b : 0.0
  );
}

void main() {
  vec4 o = vec4(0.0);
  mainImage(o, gl_FragCoord.xy);
  vec3 rgb = sanitize(o.rgb);
  
  float intensity = (rgb.r + rgb.g + rgb.b) / 3.0;
  vec3 customColor = intensity * uCustomColor;
  vec3 finalColor = mix(rgb, customColor, step(0.5, uUseCustomColor));
  
  float alpha = length(rgb) * uOpacity;
  fragColor = vec4(finalColor, alpha);
}`;

export const Plasma: React.FC<PlasmaProps> = ({
  color = "#ffffff",
  speed = 1,
  direction = "forward",
  scale = 1,
  opacity = 1,
  mouseInteractive = true,
  quality = "auto",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Device detection ---
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMobile = window.innerWidth < 768;
    const isLowEnd =
      navigator.hardwareConcurrency <= 4 ||
      (navigator as any).deviceMemory <= 4;

    // --- Quality determination ---
    let qualityValue = 1.0; // high quality by default
    if (quality === "auto") {
      if (isIOS || isMobile || isLowEnd) {
        qualityValue = 0.5; // medium quality for mobile/low-end
      } else {
        qualityValue = 1.0; // high quality for desktop
      }
    } else {
      switch (quality) {
        case "low":
          qualityValue = 0.3;
          break;
        case "medium":
          qualityValue = 0.6;
          break;
        case "high":
          qualityValue = 1.0;
          break;
      }
    }

    const useCustomColor = color ? 1.0 : 0.0;
    const customColorRgb = color ? hexToRgb(color) : [1, 1, 1];
    const directionMultiplier = direction === "reverse" ? -1.0 : 1.0;

    // Optimized renderer configuration
    const renderer = new Renderer({
      webgl: 2,
      alpha: true,
      antialias: !isMobile && !isIOS, // Disable antialiasing on mobile for performance
      dpr: Math.min(
        window.devicePixelRatio || 1,
        isLowEnd ? 1 : isMobile || isIOS ? 1.5 : 2
      ),
      powerPreference: (isLowEnd ? "low-power" : "high-performance") as
        | "low-power"
        | "high-performance",
    });
    const gl = renderer.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    containerRef.current.appendChild(canvas);

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([1, 1]) },
        uCustomColor: { value: new Float32Array(customColorRgb) },
        uUseCustomColor: { value: useCustomColor },
        uSpeed: { value: speed * 0.4 },
        uDirection: { value: directionMultiplier },
        uScale: { value: scale },
        uOpacity: { value: opacity },
        uMouse: { value: new Float32Array([0, 0]) },
        uMouseInteractive: {
          value: isIOS ? 0.0 : mouseInteractive ? 1.0 : 0.0,
        },
        uQuality: { value: qualityValue },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    // Cache uniform references for performance
    const timeUniform = program.uniforms.iTime as any;
    const directionUniform = program.uniforms.uDirection as any;
    const mouseUniform = program.uniforms.uMouse.value as Float32Array;
    const resolutionUniform = program.uniforms.iResolution
      .value as Float32Array;
    const qualityUniform = program.uniforms.uQuality as any;

    // --- Mouse interaction (skip on iOS) ---
    const handleMouseMove = (e: MouseEvent) => {
      if (isIOS || !mouseInteractive) return;
      const rect = containerRef.current!.getBoundingClientRect();
      mousePos.current.x = e.clientX - rect.left;
      mousePos.current.y = e.clientY - rect.top;
      mouseUniform[0] = mousePos.current.x;
      mouseUniform[1] = mousePos.current.y;
    };
    if (!isIOS && mouseInteractive) {
      containerRef.current.addEventListener("mousemove", handleMouseMove);
    }

    // --- Resize handling ---
    let lastWidth = 0;
    let lastHeight = 0;
    const setSize = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));

      // Only update if size actually changed
      if (width !== lastWidth || height !== lastHeight) {
        renderer.setSize(width, height);
        resolutionUniform[0] = gl.drawingBufferWidth;
        resolutionUniform[1] = gl.drawingBufferHeight;
        lastWidth = width;
        lastHeight = height;
      }
    };
    const ro = new ResizeObserver(setSize);
    ro.observe(containerRef.current);
    setSize();

    // --- Visibility and performance optimization ---
    let isVisible = true;
    let isPaused = false;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (!isVisible && !isPaused) {
            isPaused = true;
            // Pause animation when not visible
            cancelAnimationFrame(raf);
            raf = 0;
          } else if (isVisible && isPaused) {
            isPaused = false;
            // Resume animation when visible
            raf = requestAnimationFrame(loop);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      io.observe(containerRef.current);
    }

    // --- Performance configuration ---
    const targetFPS = isIOS ? 30 : isMobile ? 45 : 60;
    const frameInterval = 1000 / targetFPS;
    let raf = 0;
    let lastTime = 0;
    let frameCount = 0;
    let lastFPSCheck = 0;
    let currentFPS = targetFPS;
    const t0 = performance.now();

    const loop = (t: number) => {
      const delta = t - lastTime;

      // Adaptive frame rate limiting (only render if visible and not paused)
      const shouldRender =
        isVisible && !isPaused && delta >= frameInterval * 0.8; // Allow some variance

      if (shouldRender) {
        const timeValue = (t - t0) * 0.001;

        // Update direction for pingpong mode
        if (direction === "pingpong") {
          const cycle = Math.sin(timeValue * 0.5) * directionMultiplier;
          directionUniform.value = cycle;
        }

        timeUniform.value = timeValue;
        renderer.render({ scene: mesh });
        lastTime = t;

        // FPS monitoring and adjustment
        frameCount++;
        if (t - lastFPSCheck >= 1000) {
          currentFPS = frameCount;
          frameCount = 0;
          lastFPSCheck = t;

          // Adjust quality based on actual FPS
          if (quality === "auto" && currentFPS < targetFPS * 0.8) {
            qualityValue = Math.max(0.3, qualityValue * 0.9);
            qualityUniform.value = qualityValue;
          }
        }
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      if (!isIOS && mouseInteractive && containerRef.current) {
        containerRef.current.removeEventListener("mousemove", handleMouseMove);
      }
      try {
        containerRef.current?.removeChild(canvas);
      } catch {}
    };
  }, [color, speed, direction, scale, opacity, mouseInteractive, quality]);

  return (
    <div
      ref={containerRef}
      className="plasma-container pointer-events-none will-change-transform"
    />
  );
};

export default Plasma;
