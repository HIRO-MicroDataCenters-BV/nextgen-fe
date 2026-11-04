<template>
  <!-- Deterministic, SSR-safe placeholder shown until the client knows the auth state.
       No localStorage access, so server and first client render match (no hydration
       mismatch); the real shell renders one tick later once mounted.

       Pure CSS animation: the logo (public/images/logo.svg, strokes only, inlined so
       it follows the theme colour) stays faintly drawn while light traces the heart
       and both strands, the rungs light up in turn, and a bar slides under the title.
       The logo is visible from the first frame, so a splash shown for an instant
       still looks complete. Reduced motion gets the plain, still logo. -->
  <div
    class="splash flex min-h-svh flex-col items-center justify-center gap-3 bg-background text-foreground"
  >
    <svg
      class="size-10"
      viewBox="8 6 16 20"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <g class="splash-base">
        <path :d="LEFT_STRAND" />
        <path :d="RIGHT_STRAND" />
        <path :d="HEART" />
        <path :d="RUNG_TOP" />
        <path :d="RUNG_BOTTOM" />
      </g>
      <g class="splash-trace">
        <path pathLength="100" :d="LEFT_STRAND" />
        <path pathLength="100" :d="RIGHT_STRAND" />
        <path pathLength="100" :d="HEART" />
        <path class="splash-rung" :d="RUNG_TOP" />
        <path class="splash-rung splash-rung-late" :d="RUNG_BOTTOM" />
      </g>
    </svg>
    <span class="splash-title text-lg font-semibold tracking-tight">
      {{ t("app.title") }}
    </span>
    <div class="relative mt-1.5 h-0.5 w-24 overflow-hidden rounded-full bg-border">
      <span class="splash-bar absolute inset-y-0 left-0 w-[36%] rounded-full bg-foreground" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

// The logo's strokes, split so each part traces on its own. The strands start at
// the centre, so the light runs outwards from the heart.
const LEFT_STRAND =
  "M16 16.6888C13.0844 18.2261 10.2017 19.6926 10.2017 22.3673C10.2017 22.9248 10.3219 23.4747 10.5277 24";
const RIGHT_STRAND =
  "M16 16.6888C18.9156 18.2261 21.7983 19.6926 21.7983 22.3673C21.7983 22.9248 21.6781 23.4747 21.4723 24";
const HEART =
  "M16 16.6888C13.0172 15.116 10 13.1312 10 10.379C10 9.72595 10.1513 8 12.1681 8C13.7815 8 15.395 9.11953 16 9.6793C16.605 9.11953 18.2185 8 19.8319 8C21.8487 8 22 9.72595 22 10.379C22 13.1312 18.9828 15.116 16 16.6888Z";
const RUNG_TOP = "M14.5 20.543H17.5";
const RUNG_BOTTOM = "M13.5 23.379H18.5";
</script>

<style scoped>
.splash {
  animation: splash-in 0.4s ease-out both;
}
.splash-base {
  opacity: 0.22;
}
.splash-trace path {
  stroke-dasharray: 28 72;
  animation: splash-trace 2.2s linear infinite;
}
.splash-trace .splash-rung {
  stroke-dasharray: none;
  opacity: 0;
  animation: splash-rung 2.2s ease-in-out infinite;
}
.splash-trace .splash-rung-late {
  animation-delay: 0.25s;
}
.splash-title {
  animation: splash-up 0.5s 0.1s ease-out both;
}
.splash-bar {
  animation: splash-slide 1.4s ease-in-out infinite alternate;
}

@keyframes splash-in {
  from { opacity: 0; }
}
@keyframes splash-up {
  from { opacity: 0; transform: translateY(4px); }
}
@keyframes splash-trace {
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
}
@keyframes splash-rung {
  0%, 30%, 100% { opacity: 0; }
  55%, 70% { opacity: 1; }
}
@keyframes splash-slide {
  to { transform: translateX(178%); }
}

@media (prefers-reduced-motion: reduce) {
  .splash,
  .splash * {
    animation: none !important;
  }
  .splash-trace {
    display: none;
  }
  .splash-base {
    opacity: 1;
  }
}
</style>
