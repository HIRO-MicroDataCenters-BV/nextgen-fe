<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md" @open-auto-focus.prevent>
      <DialogHeader class="items-center gap-3 text-center sm:text-center">
        <span
          class="flex size-11 items-center justify-center rounded-xl bg-muted"
        >
          <img src="/images/logo.svg" alt="" class="size-6">
        </span>
        <div class="space-y-1.5">
          <DialogTitle class="text-xl">{{ t("login.title") }}</DialogTitle>
          <DialogDescription>{{ t("login.subtitle") }}</DialogDescription>
        </div>
      </DialogHeader>

      <AppLoginForm class="mt-2" @success="emit('success')" />
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

defineProps<{ open: boolean }>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "success"): void;
}>();

const { t } = useI18n();
</script>
