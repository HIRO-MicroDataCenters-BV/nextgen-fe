<template>
  <div class="mmio-upload-root">

    <!-- ══ READ-ONLY / VIEW MODE ══════════════════════════════════ -->
    <template v-if="readonly">
      <template v-if="mmioFile">
        <div class="mmio-readonly-list">
          <div class="mmio-readonly-item">
            <Icon
              :name="mmioFile.endsWith('.tar') ? 'lucide:package' : 'lucide:file-json'"
              class="size-4 flex-shrink-0"
              :class="mmioFile.endsWith('.tar') ? 'text-purple-500' : 'text-blue-500'"
            />
            <span class="mmio-readonly-item__name">{{ mmioFile }}</span>
            <span class="mmio-readonly-item__type">
              {{ mmioFile.endsWith('.tar') ? 'MMIO (.tar)' : 'MMIO (.json)' }}
            </span>
          </div>
        </div>
      </template>
      <span v-else class="mmio-readonly-empty">—</span>
    </template>

    <!-- ══ EDITABLE MODE ══════════════════════════════════════════ -->
    <template v-else>
      <div class="mmio-upload-section">
        <p class="mmio-upload-section__label">
          <Icon name="lucide:folder-input" class="size-4 text-muted-foreground" />
          <span>{{ t('label.mmio_data_file', 'MMIO file') }}</span>
          <span class="mmio-upload-section__ext">.json</span>
          <span class="mmio-upload-section__slash">/</span>
          <span class="mmio-upload-section__ext">.tar</span>
          <span class="mmio-upload-section__required">*</span>
        </p>

        <div v-if="mmioFile" class="mmio-file-badge">
          <div class="mmio-file-badge__info">
            <Icon
              :name="mmioFile.endsWith('.tar') ? 'lucide:package' : 'lucide:file-json'"
              class="size-4 flex-shrink-0"
              :class="mmioFile.endsWith('.tar') ? 'text-purple-500' : 'text-blue-500'"
            />
            <span class="mmio-file-badge__name">{{ mmioFile }}</span>
            <Icon name="lucide:circle-check" class="size-4 text-green-600 flex-shrink-0" />
          </div>
          <button
            type="button"
            class="mmio-file-badge__remove"
            :disabled="disabled"
            @click="emit('remove-mmio')"
          >
            <Icon name="lucide:x" class="size-3.5" />
          </button>
        </div>

        <div
          v-else
          class="mmio-drop-zone"
          :class="{
            'mmio-drop-zone--drag': draggingMmio,
            'mmio-drop-zone--uploading': uploading,
            'mmio-drop-zone--disabled': disabled,
          }"
          @dragover.prevent="draggingMmio = true"
          @dragleave.prevent="draggingMmio = false"
          @drop.prevent="handleDropMmio"
          @click="!disabled && !uploading && inputMmioRef?.click()"
        >
          <input
            :key="inputKey"
            ref="inputMmioRef"
            type="file"
            accept="application/json,.json,application/x-tar,.tar"
            class="sr-only"
            :disabled="disabled || uploading"
            @change="handleInputMmio"
          >
          <template v-if="uploading">
            <div class="mmio-drop-zone__spinner" />
            <span class="mmio-drop-zone__hint">{{ t('hint.uploading') }}</span>
          </template>
          <template v-else>
            <Icon
              :name="draggingMmio ? 'lucide:download' : 'lucide:upload'"
              class="size-5"
              :class="draggingMmio ? 'text-primary' : 'text-muted-foreground'"
            />
            <span class="mmio-drop-zone__hint">
              <span class="mmio-drop-zone__link">{{ t('action.click_to_browse', 'Browse') }}</span>
              {{ ' ' }}{{ t('label.or_drag_drop', 'or drop') }}
            </span>
            <span class="mmio-drop-zone__formats">.json · .tar</span>
          </template>
        </div>
      </div>

      <div v-if="mmioFile?.endsWith('.tar')" class="mmio-tar-note">
        <Icon name="lucide:info" class="size-3.5 text-muted-foreground flex-shrink-0" />
        <span>{{ t('hint.tar_mmio_archive', '.tar should contain mmio.json and OCA bundle files') }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

withDefaults(defineProps<{
  mmioFile?: string | null;
  uploading?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  inputKey?: number;
}>(), {
  mmioFile: null,
  uploading: false,
  disabled: false,
  readonly: false,
  inputKey: 0,
});

const emit = defineEmits<{
  'change-mmio': [file: File];
  'remove-mmio': [];
}>();

const { t } = useI18n();
const inputMmioRef = ref<HTMLInputElement | null>(null);
const draggingMmio = ref(false);

const handleInputMmio = (e: Event) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (f) emit('change-mmio', f);
};
const handleDropMmio = (e: DragEvent) => {
  draggingMmio.value = false;
  const f = e.dataTransfer?.files?.[0];
  if (f) emit('change-mmio', f);
};
</script>

<style scoped src="./assets/MmioUploadZone.css"></style>
