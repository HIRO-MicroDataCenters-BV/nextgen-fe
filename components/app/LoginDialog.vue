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
          <DialogDescription>
            {{ mode === "key" ? t("login.key.subtitle") : t("login.subtitle") }}
          </DialogDescription>
        </div>
      </DialogHeader>

      <!-- Email + password login is hidden while `passwordLoginEnabled` is false.
           The form and its wiring are kept so it can be switched back on. -->
      <template v-if="passwordLoginEnabled && mode === 'password'">
        <AppLoginForm class="mt-2" @success="emit('success')" />

        <div class="flex items-center gap-3 text-xs text-muted-foreground">
          <Separator class="flex-1" />
          {{ t("label.or") }}
          <Separator class="flex-1" />
        </div>

        <Button
          type="button"
          variant="outline"
          class="h-11 w-full text-sm font-medium"
          @click="mode = 'key'"
        >
          <KeyRound aria-hidden="true" class="size-4" />
          {{ t("login.use_key") }}
        </Button>
      </template>

      <template v-else>
        <AppKeyLoginForm class="mt-2" @success="emit('success')" />

        <button
          v-if="passwordLoginEnabled"
          type="button"
          class="mx-auto cursor-pointer rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
          @click="mode = 'password'"
        >
          {{ t("login.use_password") }}
        </button>
      </template>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { KeyRound } from "lucide-vue-next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const props = defineProps<{ open: boolean }>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "success"): void;
}>();

const { t } = useI18n();

// Sign-in is identity-key only for now. Email + password login (`AppLoginForm`) is
// hidden, not removed: set this to `true` to offer it again, as the default mode
// with key sign-in as the alternative.
const passwordLoginEnabled = false;

type LoginMode = "password" | "key";
const defaultMode: LoginMode = passwordLoginEnabled ? "password" : "key";
const mode = ref<LoginMode>(defaultMode);

// Reopening the dialog always starts from the default mode.
watch(
  () => props.open,
  (open) => {
    if (!open) mode.value = defaultMode;
  },
);
</script>
