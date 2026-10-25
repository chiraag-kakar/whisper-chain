<script setup lang="ts">
/**
 * Decorative low-opacity background: a feed-forward neural network
 * (layers of nodes, fully connected) over a speech waveform — the
 * "deep-learning oriented" backdrop. Purely visual, aria-hidden.
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
  const gap = (HEIGHT - 200) / (count - 1);
  return Array.from({ length: count }, (_, ni) => ({ x, y: 100 + ni * gap }));
});

const edges = layers.slice(1).flatMap((layer, li) => layers[li].flatMap((a) => layer.map((b) => ({ a, b }))));

// a speech-like waveform along the bottom: sum of a few sines under an envelope
const wave = Array.from({ length: 241 }, (_, i) => {
  const t = i / 240;
  const env = Math.sin(Math.PI * t) ** 2;
  const y = HEIGHT - 70 + env * 38 * (Math.sin(t * 61) * 0.6 + Math.sin(t * 23 + 1) * 0.3 + Math.sin(t * 137) * 0.25);
  return `${(t * WIDTH).toFixed(1)},${y.toFixed(1)}`;
}).join(' ');
</script>

<template>
  <svg class="neural-bg" :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <g class="edges">
      <line v-for="(e, i) in edges" :key="i" :x1="e.a.x" :y1="e.a.y" :x2="e.b.x" :y2="e.b.y" />
    </g>
    <g class="nodes">
      <template v-for="(layer, li) in layers" :key="li">
        <circle v-for="(n, ni) in layer" :key="ni" :cx="n.x" :cy="n.y" r="11" />
      </template>
    </g>
    <polyline class="wave" :points="wave" />
  </svg>
</template>

<style scoped>
.neural-bg {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
  opacity: var(--bg-art-opacity);
}
.edges line { stroke: var(--primary); stroke-width: 1; stroke-opacity: 0.55; }
.nodes circle { fill: var(--card); stroke: var(--primary); stroke-width: 2.5; }
.wave { fill: none; stroke: var(--primary); stroke-width: 2.5; stroke-linejoin: round; }
</style>
