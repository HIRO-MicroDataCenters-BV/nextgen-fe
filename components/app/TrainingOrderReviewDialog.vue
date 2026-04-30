<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Review order before training</DialogTitle>
      </DialogHeader>

      <div class="space-y-4">
        <div class="rounded-md border p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Dataset (required)
          </p>
          <p class="mt-1 text-sm">
            {{ datasetName }}
          </p>
        </div>

        <div class="rounded-md border p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Application
          </p>
          <div class="mt-2 space-y-2">
            <label class="flex items-center gap-2 text-sm">
              <input
                v-model="applicationMode"
                type="radio"
                value="none"
              >
              Continue without application
            </label>
            <label class="flex items-center gap-2 text-sm" :class="{ 'opacity-50': !application }">
              <input
                v-model="applicationMode"
                type="radio"
                value="selected"
                :disabled="!application"
              >
              Use selected application: {{ applicationName }}
            </label>
          </div>
        </div>
      </div>

      <DialogFooter class="sm:justify-end">
        <Button type="button" variant="secondary" @click="emit('update:open', false)">
          Cancel
        </Button>
        <Button type="button" :disabled="!dataset" @click="emitConfirm">
          Pass to training
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  dataset: Record<string, unknown> | null;
  application: Record<string, unknown> | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "confirm", value: { includeApplication: boolean }): void;
}>();

const applicationMode = ref<"none" | "selected">("none");

const datasetName = computed(() => {
  if (!props.dataset) return "No dataset selected";
  return String(props.dataset.title || props.dataset.name || props.dataset.id || "Unnamed dataset");
});

const applicationName = computed(() => {
  if (!props.application) return "No application selected";
  return String(
    props.application.title ||
      props.application.name ||
      props.application.id ||
      "Unnamed application",
  );
});

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    applicationMode.value = props.application ? "selected" : "none";
  },
);

const emitConfirm = () => {
  emit("confirm", { includeApplication: applicationMode.value === "selected" });
};
</script>
