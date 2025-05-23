<template>
  <div class="flex items-center gap-2">
    <template v-for="button in buttons" :key="button.id">
      <Button
        :variant="button.variant || 'default'"
        @click="handleButtonClick(button)"
      >
        {{ button.label }}
      </Button>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ToolbarProps, ToolbarButton } from "~/types/toolbar.types";
import { Button } from "~/components/ui/button";

const props = defineProps<ToolbarProps>();

const handleButtonClick = (button: ToolbarButton) => {
  if (button.action.type === "fileUpload") {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = () => {
      if (button.action.onConfirm) {
        button.action.onConfirm();
      }
    };
    input.click();
  } else if (button.action.onConfirm) {
    button.action.onConfirm();
  }
};
</script>
