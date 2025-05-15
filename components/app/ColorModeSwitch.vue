<template>
  <div>
    <Switch :model-value="isDark" @update:model-value="toggleTheme">
      <template #thumb>
        <div class="flex content-center justify-center items-center">
          <Icon v-if="isDark" name="lucide:moon" />
          <Icon v-else name="lucide:sun" />
        </div>
      </template>
    </Switch>
  </div>
</template>

<script lang="ts" setup>
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === 'dark');

const toggleTheme = () => {
  const value = isDark.value ? 'light' : 'dark';
  colorMode.value = value;
  colorMode.preference = value;
};
</script>

<style></style>
