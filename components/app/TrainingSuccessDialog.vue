<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ $t("training.success_title") }}</DialogTitle>
      </DialogHeader>
      <div class="flex items-center space-x-2">
        <div class="grid flex-1 gap-2">
          <p class="text-sm text-muted-foreground">
            {{ $t("training.success_description") }}
          </p>
        </div>
      </div>
      <DialogFooter class="sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          @click="$emit('update:open', false)"
        >
          {{ $t("action.cancel") }}
        </Button>
        <Button type="button" as-child>
          <a
            :href="`${cogURL}${orderId ? '?order_id=' + orderId : ''}`"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ $t("action.processed") }}
            <Icon name="lucide:external-link" class="ml-2 h-4 w-4" />
          </a>
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

defineProps<{
  open: boolean;
  pipelineId?: string;
  pipelineName?: string;
  orderId?: string;
}>();

defineEmits<{
  (e: "update:open", value: boolean): void;
}>();

const config = useRuntimeConfig();
const cogURL = computed(() => {
  return config.public.cogURL as string;
});
</script>
