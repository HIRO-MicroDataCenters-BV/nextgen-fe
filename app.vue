<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
const { t } = useI18n();
useHead({
  title: t("app.title"),
  meta: [
    { name: "description", content: t("app.description") },
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "format-detection", content: "telephone=no" },
    { name: "theme-color", content: "#ffffff" },
    { name: "msapplication-TileColor", content: "#ffffff" },
    { name: "msapplication-config", content: "/browserconfig.xml" },
  ],
  link: [
    { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
    { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    { rel: "apple-touch-icon", sizes: "57x57", href: "/favicon-57x57.png" },
    { rel: "apple-touch-icon", sizes: "60x60", href: "/favicon-60x60.png" },
    { rel: "apple-touch-icon", sizes: "72x72", href: "/favicon-72x72.png" },
    { rel: "apple-touch-icon", sizes: "76x76", href: "/favicon-76x76.png" },
    { rel: "apple-touch-icon", sizes: "114x114", href: "/favicon-114x114.png" },
    { rel: "apple-touch-icon", sizes: "120x120", href: "/favicon-120x120.png" },
    { rel: "apple-touch-icon", sizes: "144x144", href: "/favicon-144x144.png" },
    { rel: "apple-touch-icon", sizes: "152x152", href: "/favicon-152x152.png" },
    { rel: "apple-touch-icon", sizes: "180x180", href: "/favicon-180x180.png" },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      href: "/favicon-16x16.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      href: "/favicon-32x32.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "70x70",
      href: "/favicon-70x70.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "96x96",
      href: "/favicon-96x96.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "150x150",
      href: "/favicon-150x150.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "192x192",
      href: "/favicon-192x192.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "310x310",
      href: "/favicon-310x310.png",
    },
    { rel: "mask-icon", href: "/favicon.svg", color: "#ffffff" },
  ],
});
</script>
