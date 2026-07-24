<template>
  <!-- Standalone theme toggle for contexts without a SidebarProvider (e.g. the guest
       top bar). Mirrors the hydration-safe pattern in ColorModeSwitch.vue: a neutral
       icon until mounted, since the resolved theme is only known on the client. -->
  <Button
    variant="ghost"
    size="icon"
    class="text-muted-foreground hover:text-foreground"
    :disabled="!mounted"
    :aria-label="isDark ? t('menu.light_mode') : t('menu.dark_mode')"
    @click="toggle"
  >
    <Icon
      :name="mounted ? (isDark ? 'lucide:sun' : 'lucide:moon') : 'lucide:sun-moon'"
      class="size-5"
    />
  </Button>
</template>

<script setup lang="ts">
const { t } = useI18n();
const colorMode = useColorMode();

const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});

const isDark = computed(() => colorMode.value === "dark");
const toggle = () => {
  colorMode.preference = isDark.value ? "light" : "dark";
};
</script>
