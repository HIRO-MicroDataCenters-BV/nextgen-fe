<template>
  <!-- Tooltip, icon and label all describe the TARGET mode (what clicking switches
       to): in dark mode → sun + "Light mode"; in light mode → moon + "Dark mode". -->
  <SidebarMenuButton
    class="cursor-pointer"
    :tooltip="isDark ? t('menu.light_mode') : t('menu.dark_mode')"
    @click="toggleTheme"
  >
    <span class="text-lg">
      <Icon :name="isDark ? 'lucide:sun' : 'lucide:moon'" />
    </span>
    <span>{{ isDark ? t("menu.light_mode") : t("menu.dark_mode") }}</span>
  </SidebarMenuButton>
</template>

<script lang="ts" setup>
const { t } = useI18n();

// @nuxtjs/color-mode: read the resolved theme via `.value`, set the user's
// choice via `.preference` (writing `.value` directly does not persist).
const colorMode = useColorMode();

// The resolved theme depends on localStorage, which the server can't read, so
// SSR always renders the default (light). Gate the theme-dependent markup
// behind a mounted flag so server and first client render agree (no hydration
// mismatch); it reconciles to the stored theme immediately after mount. The
// page background never flashes — the module's no-flash script sets the `.dark`
// class on <html> before paint.
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});
const isDark = computed(() => mounted.value && colorMode.value === "dark");

const toggleTheme = () => {
  colorMode.preference = isDark.value ? "light" : "dark";
};
</script>
