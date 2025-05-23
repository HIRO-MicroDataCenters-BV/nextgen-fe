<template>
  <div class="flex items-center gap-2">
    <template v-for="button in props.buttons" :key="button.id">
      <Button
        :variant="button.variant || 'default'"
        @click="handleButtonClick(button)"
      >
        {{ button.label }}
      </Button>
    </template>
    <input
      ref="uploadRef"
      type="file"
      class="hidden"
      @change="handleFileUpload"
      accept=".json,.csv"
    />
  </div>
</template>

<script setup lang="ts">
import type { ToolbarProps, ToolbarButton } from "~/types/toolbar.types";
const uploadRef = ref();

const props = defineProps<ToolbarProps>();

const { setAppForm } = useAppForm();

//const emit = defineEmits(["upload-file"]);

const handleFileUpload = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    console.log(file);
    setAppForm({ files: [file] });
    if (e.target instanceof HTMLInputElement) {
      e.target.value = "";
    }
  }
};

const handleButtonClick = (button: ToolbarButton) => {
  if (button.action.type === "fileUpload") {
    uploadRef.value.click();
  } else if (button.action.onConfirm) {
    button.action.onConfirm();
  }
};
</script>
