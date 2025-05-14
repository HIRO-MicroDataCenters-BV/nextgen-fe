<script setup lang="ts">
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'

const { t } = useI18n();
const { title, description = "", showAvailableBiobanks = true } = defineProps<{
  title: string;
  description?: string;
  showAvailableBiobanks?: boolean;
}>();
</script>

<template>
  <div class="px-14 py-6 border-t border-b flex flex-row gap-2 items-end">
    <AppHeader :title="title" :description="description" :show-available-biobanks="showAvailableBiobanks" />
  </div>
  <div class="content-slot">
    <slot/>
  </div>
</template>
