// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  modules: [
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "shadcn-nuxt",
    "@nuxtjs/i18n",
    "nuxt-zod-i18n",
    "dayjs-nuxt",
    "@nuxtjs/color-mode",
    "@vueuse/nuxt",
    "nuxt-api-party",
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
  colorMode: {
    preference: "system",
    fallback: "light",
    classPrefix: "",
    classSuffix: "",
    storage: "localStorage",
    storageKey: "nuxt-color-mode",
  },
  shadcn: {
    prefix: "",
    componentDir: "./components/ui",
  },
  css: ["~/assets/css/tailwind.css"],
  proxy: {
    options: [
      {
        target: "http://localhost:8080",
        pathFilter: ["/api/search/**"],
        pathRewrite: {
          "^/api/search": "",
        },
      },
      {
        target: "http://localhost:8081",
        pathFilter: ["/api/catalog/**"],
        pathRewrite: {
          "^/api/catalog": "",
        },
      },
    ],
  },
  runtimeConfig: {
    public: {
      apiSearchServiceUrl: process.env.API_SEARCH_SERVICE_URL,
      apiCatalogServiceUrl: process.env.API_CATALOG_SERVICE_URL,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
