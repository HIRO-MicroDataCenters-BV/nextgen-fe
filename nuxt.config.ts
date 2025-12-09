// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  alias: {
    "@": fileURLToPath(new URL(".", import.meta.url)),
  },

  modules: [
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "shadcn-nuxt",
    "@nuxtjs/i18n",
    "nuxt-zod-i18n",
    "dayjs-nuxt",
    //"@nuxtjs/color-mode",
    "@vueuse/nuxt",
    "nuxt-proxy-request",
  ],
  icon: {
    serverBundle: {
      collections: ["lucide"],
    },
    customCollections: [
      {
        prefix: "cog",
        dir: "./assets/icons",
      },
    ],
  },
  dayjs: {
    locales: ["en"],
    defaultLocale: "en",
    plugins: ["utc", "timezone", "quarterOfYear"],
  },
  /*
  colorMode: {
    preference: "system",
    fallback: "light",
    classPrefix: "",
    classSuffix: "",
    storage: "localStorage",
    storageKey: "nuxt-color-mode",
  },
  */
  i18n: {
    bundle: {
      optimizeTranslationDirective: false,
    },
  },
  shadcn: {
    prefix: "",
    componentDir: "@/components/ui",
  },
  css: ["~/assets/css/tailwind.css"],
  runtimeConfig: {
    // Server-only variables (not exposed to client)
    dexHost: process.env.NUXT_DEX_HOST || "",
    dexUsername: process.env.NUXT_DEX_LOGIN || "",
    dexPassword: process.env.NUXT_DEX_PASSWORD || "",
    dexAuthType: process.env.NUXT_DEX_AUTH_TYPE || "local",
    skipTlsVerify: process.env.NUXT_DEX_SKIP_TLS_VERIFY !== "false", // Default to true
    public: {
      apiSearchServiceUrl: process.env.API_SEARCH_SERVICE_URL || "",
      apiCatalogServiceUrl: process.env.API_CATALOG_SERVICE_URL || "",
      apiConnectorServiceURL: process.env.API_CONNECTOR_SERVICE_URL || "",
      catalogName: process.env.CATALOG_NAME || "hus_catalog",
      cogURL: process.env.NUXT_PUBLIC_COG_URL || "",
      apiCogURL: process.env.NUXT_PUBLIC_API_COG_URL || "",
      trainingBuilderServiceURL: process.env.TRAINING_BUILDER_SERVICE_URL || "",
      apiCheckoutServiceUrl:
        process.env.API_CHECKOUT_SERVICE_URL ||
        "https://ds-checkout.marketplace.nextgen.hiro-develop.nl",
    },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL(".", import.meta.url)),
      },
    },
  },
});
