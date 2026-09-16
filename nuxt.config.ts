// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
  compatibilityDate: "2025-12-01",
  future: {
    compatibilityVersion: 4,
  },
  sourcemap: {
    client: false,
    server: false,
  },
  experimental: {
    typedPages: false,
  },
  typescript: {
    tsConfig: {
      vueCompilerOptions: {
        plugins: [],
      },
    },
  },
  devtools: {
    enabled: process.env.NODE_ENV !== "production",
  },

  app: {
    head: {
      link: [
        { rel: "preconnect", href: "https://ui-avatars.com" },
        { rel: "dns-prefetch", href: "https://ui-avatars.com" },
      ],
    },
  },

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
    "@vueuse/nuxt",
    // Registered after @vueuse/nuxt so its `useColorMode` auto-import wins
    // (Nuxt resolves duplicate auto-imports "last wins").
    "@nuxtjs/color-mode",
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
  colorMode: {
    preference: "light", // default theme on first visit
    fallback: "light",
    classPrefix: "",
    // Keep empty so the module toggles the `.dark` class our CSS targets
    // (the module default is "-mode", which would apply `.dark-mode`).
    classSuffix: "",
    storage: "localStorage",
    storageKey: "nuxt-color-mode",
  },
  i18n: {
    defaultLocale: "en",
    locales: [{ code: "en", language: "en-US", name: "English" }],
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
      apiSearchServiceUrl: process.env.NUXT_PUBLIC_API_SEARCH_SERVICE_URL || "",
      apiCatalogServiceUrl:
        process.env.NUXT_PUBLIC_API_CATALOG_SERVICE_URL || "",
      apiConnectorServiceURL:
        process.env.NUXT_PUBLIC_API_CONNECTOR_SERVICE_URL || "",
      catalogName: process.env.NUXT_PUBLIC_CATALOG_NAME || "hus_catalog",
      cogURL: process.env.NUXT_PUBLIC_COG_URL || "",
      apiCogURL: process.env.NUXT_PUBLIC_API_COG_URL || "",
      trainingBuilderServiceURL:
        process.env.NUXT_PUBLIC_TRAINING_BUILDER_SERVICE_URL || "",
      apiCheckoutServiceUrl:
        process.env.NUXT_PUBLIC_API_CHECKOUT_SERVICE_URL ||
        "https://ds-checkout.marketplace.nextgen.hiro-develop.nl",
    },
  },
  vite: {
    logLevel: "error",
    build: {
      sourcemap: false,
    },
    css: {
      devSourcemap: false,
    },
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL(".", import.meta.url)),
      },
    },
  },
});
