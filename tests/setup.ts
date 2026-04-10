/**
 * Vitest setup: mock Nuxt/Vue composables that don't exist in a bare Node env.
 * These globals are injected by Nuxt's auto-import at runtime but are unavailable
 * in vitest (environment: "node"). We provide minimal stubs so composables that
 * rely on them can be imported and unit-tested.
 */
import { vi } from "vitest";
import { ref, computed } from "vue";

/* eslint-disable @typescript-eslint/no-explicit-any */
const g = globalThis as any;

// ── useI18n ────────────────────────────────────────────────────
// @vue-i18n composable — return a t() that echoes the key
if (!g.useI18n) {
  g.useI18n = () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    locale: ref("en"),
  });
}

// ── useState ───────────────────────────────────────────────────
// Nuxt 3 useState — plain ref in test context
if (!g.useState) {
  g.useState = <T>(_key: string, init: () => T) => ref(init());
}

// ── useRuntimeConfig ───────────────────────────────────────────
if (!g.useRuntimeConfig) {
  g.useRuntimeConfig = () => ({ public: {} });
}

// ── useClientSelector ──────────────────────────────────────────
if (!g.useClientSelector) {
  g.useClientSelector = () => ({
    selectedClient: ref("s3"),
    clientStatus: ref("valid"),
    clientError: ref(null),
    availableClients: ref(["s3"]),
    isClientValid: computed(() => true),
    selectClient: vi.fn(),
    clearClient: vi.fn(),
  });
}

// ── useApi ─────────────────────────────────────────────────────
if (!g.useApi) {
  g.useApi = () => ({
    getConnectorMetadata: vi.fn().mockResolvedValue(null),
    getDataproducts: vi.fn().mockResolvedValue([]),
  });
}

// ── useRouter / useRoute ───────────────────────────────────────
if (!g.useRouter) {
  g.useRouter = () => ({ push: vi.fn(), back: vi.fn() });
}
if (!g.useRoute) {
  g.useRoute = () => ({ params: {}, query: {} });
}
