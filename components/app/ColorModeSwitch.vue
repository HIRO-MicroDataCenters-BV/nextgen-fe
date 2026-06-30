<template>
  <!-- The resolved theme is only known on the client (it depends on localStorage),
       so render a neutral placeholder until mounted. This way the first visible state
       is never a wrong/misleading theme state, there's no SSR hydration mismatch
       (server and first client render both show the placeholder), and the toggle is
       only interactive once colorMode.value is accurate (no no-op first click).
       Once mounted, tooltip/icon/label all describe the TARGET mode (what a click
       switches to): in dark mode → sun + "Light mode"; in light mode → moon + "Dark mode". -->
  <SidebarMenuButton
    v-if="mounted"
    class="cursor-pointer"
    :tooltip="isDark ? t('menu.light_mode') : t('menu.dark_mode')"
    @click="toggleTheme"
  >
    <span class="text-lg">
      <Icon :name="isDark ? 'lucide:sun' : 'lucide:moon'" />
    </span>
    <span>{{ isDark ? t("menu.light_mode") : t("menu.dark_mode") }}</span>
  </SidebarMenuButton>

  <!-- Neutral, non-interactive placeholder shown until mounted (reserves the row so
       there's no layout shift, and implies no particular theme). -->
  <SidebarMenuButton v-else disabled class="cursor-default" :tooltip="t('menu.theme')">
    <span class="text-lg">
      <Icon name="lucide:sun-moon" />
    </span>
    <span>{{ t("menu.theme") }}</span>
  </SidebarMenuButton>
</template>

<script lang="ts" setup>
const { t } = useI18n();

// @nuxtjs/color-mode: read the resolved theme via `.value`, set the user's
// choice via `.preference` (writing `.value` directly does not persist).
const colorMode = useColorMode();

const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});
const isDark = computed(() => colorMode.value === "dark");

const toggleTheme = () => {
  colorMode.preference = isDark.value ? "light" : "dark";
};
</script>
