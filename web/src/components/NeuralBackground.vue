<script setup lang="ts">
/**
 * Decorative background: drifting soft colour blobs, a faint dot grid, and a
 * feed-forward neural network whose signals travel along a few highlighted
 * edges over a speech waveform. Purely visual, aria-hidden.
 */
const WIDTH = 1200;
const HEIGHT = 800;
const LAYERS = [4, 7, 9, 9, 7, 4];

interface Node {
  x: number;
  y: number;
}

const layers: Node[][] = LAYERS.map((count, li) => {
  const x = 120 + (li * (WIDTH - 240)) / (LAYERS.length - 1);
  const gap = (HEIGHT - 260) / (count - 1);
  return Array.from({ length: count }, (_, ni) => ({ x, y: 110 + ni * gap }));
});

const edges = layers.slice(1).flatMap((layer, li) => layers[li].flatMap((a) => layer.map((b) => ({ a, b }))));

// a few edges carry an animated "signal"; picked deterministically so SSR/HMR stay stable
const signals = edges.filter((_, i) => (i * 37) % 23 === 0).map((e, i) => ({ ...e, delay: `${(i * 0.7) % 6}s` }));

// a speech-like waveform along the bottom: sum of a few sines under an envelope
function wave(phase: number, amp: number): string {
  return Array.from({ length: 241 }, (_, i) => {
    const t = i / 240;
    const env = Math.sin(Math.PI * t) ** 2;
    const y = HEIGHT - 80 + env * amp * (Math.sin(t * 61 + phase) * 0.6 + Math.sin(t * 23 + 1 + phase) * 0.3 + Math.sin(t * 137) * 0.25);
    return `${(t * WIDTH).toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}
const waves = [wave(0, 42), wave(1.3, 30)];
</script>

<template>
  <div class="bg" aria-hidden="true">
    <div class="blob b1"></div>
    <div class="blob b2"></div>
    <div class="blob b3"></div>
    <div class="dots"></div>
    <svg class="net" :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <linearGradient id="wc-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#6d5cff" />
          <stop offset="0.55" stop-color="#4f7bff" />
          <stop offset="1" stop-color="#14b8c4" />
        </linearGradient>
        <radialGradient id="wc-fade" cx="0.5" cy="0.45" r="0.65">
          <stop offset="0.35" stop-color="#fff" stop-opacity="0.25" />
          <stop offset="1" stop-color="#fff" stop-opacity="1" />
        </radialGradient>
        <mask id="wc-mask">
          <rect width="100%" height="100%" fill="url(#wc-fade)" />
        </mask>
      </defs>
      <g mask="url(#wc-mask)">
        <g class="edges">
          <line v-for="(e, i) in edges" :key="i" :x1="e.a.x" :y1="e.a.y" :x2="e.b.x" :y2="e.b.y" />
        </g>
        <g class="signals">
          <line v-for="(e, i) in signals" :key="i" :x1="e.a.x" :y1="e.a.y" :x2="e.b.x" :y2="e.b.y" :style="{ animationDelay: e.delay }" pathLength="100" />
        </g>
        <g class="nodes">
          <template v-for="(layer, li) in layers" :key="li">
            <circle v-for="(n, ni) in layer" :key="ni" :cx="n.x" :cy="n.y" r="7" :style="{ animationDelay: `${(li + ni) * 0.35}s` }" />
          </template>
        </g>
        <polyline class="wave w1" :points="waves[0]" />
        <polyline class="wave w2" :points="waves[1]" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  opacity: var(--bg-art-opacity);
  background: radial-gradient(1200px 600px at 50% -10%, #ebe8ff 0%, transparent 60%), var(--bg);
}
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.55;
  will-change: transform;
}
.b1 { width: 520px; height: 520px; left: -120px; top: -80px; background: #b9b0ff; animation: drift1 26s ease-in-out infinite alternate; }
.b2 { width: 460px; height: 460px; right: -100px; top: 20%; background: #a5d8ff; animation: drift2 30s ease-in-out infinite alternate; }
.b3 { width: 420px; height: 420px; left: 30%; bottom: -160px; background: #99e9f2; opacity: 0.45; animation: drift3 34s ease-in-out infinite alternate; }
@keyframes drift1 { to { transform: translate(140px, 90px) scale(1.1); } }
@keyframes drift2 { to { transform: translate(-160px, 120px) scale(0.95); } }
@keyframes drift3 { to { transform: translate(120px, -100px) scale(1.08); } }

.dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(20, 23, 38, 0.09) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: radial-gradient(ellipse at 50% 40%, transparent 30%, #000 85%);
  -webkit-mask-image: radial-gradient(ellipse at 50% 40%, transparent 30%, #000 85%);
}

.net { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.5; }
.edges line { stroke: #6d5cff; stroke-width: 0.7; stroke-opacity: 0.16; }
.signals line {
  stroke: url(#wc-g);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-dasharray: 14 86;
  stroke-dashoffset: 100;
  animation: travel 6s linear infinite;
}
@keyframes travel { to { stroke-dashoffset: 0; } }
.nodes circle { fill: #fff; stroke: url(#wc-g); stroke-width: 2; animation: glow 4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes glow { 50% { transform: scale(1.25); fill: #e9e6ff; } }
.wave { fill: none; stroke: url(#wc-g); stroke-linejoin: round; stroke-linecap: round; }
.w1 { stroke-width: 2.5; stroke-opacity: 0.7; }
.w2 { stroke-width: 1.5; stroke-opacity: 0.35; }

@media (prefers-reduced-motion: reduce) {
  .blob, .signals line, .nodes circle { animation: none; }
}
</style>
