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

<style scoped>
.mmio-upload-root {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mmio-upload-section {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.mmio-upload-section__label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}
.mmio-upload-section__ext {
  font-family: monospace;
  background: hsl(var(--muted));
  border-radius: 0.25rem;
  padding: 0 0.25rem;
  font-size: 0.75rem;
}
.mmio-upload-section__slash {
  font-size: 0.7rem;
  color: hsl(var(--muted-foreground));
}
.mmio-upload-section__required {
  color: hsl(var(--destructive));
  font-size: 0.8rem;
}

.mmio-drop-zone {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  border: 1.5px dashed hsl(var(--border));
  border-radius: 0.625rem;
  cursor: pointer;
  background: hsl(var(--muted) / 0.3);
  transition: border-color 0.15s, background 0.15s;
  min-height: 2.75rem;
}
.mmio-drop-zone:hover:not(.mmio-drop-zone--disabled):not(.mmio-drop-zone--uploading) {
  border-color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.04);
}
.mmio-drop-zone--drag {
  border-color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.07);
}
.mmio-drop-zone--disabled,
.mmio-drop-zone--locked {
  cursor: not-allowed;
  opacity: 0.5;
}
.mmio-drop-zone__hint {
  font-size: 0.8rem;
  color: hsl(var(--muted-foreground));
  flex: 1;
}
.mmio-drop-zone__link {
  color: hsl(var(--primary));
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.mmio-drop-zone__formats {
  font-size: 0.7rem;
  font-family: monospace;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted));
  padding: 0.1rem 0.375rem;
  border-radius: 0.25rem;
  white-space: nowrap;
  flex-shrink: 0;
}
.mmio-drop-zone__spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid hsl(var(--border));
  border-top-color: hsl(var(--primary));
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

.mmio-file-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: hsl(var(--muted) / 0.5);
  border: 1px solid hsl(var(--border));
  border-radius: 0.625rem;
  min-height: 2.75rem;
}
.mmio-file-badge__info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;
}
.mmio-file-badge__name {
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: hsl(var(--foreground));
}
.mmio-file-badge__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 0.375rem;
  color: hsl(var(--muted-foreground));
  transition: color 0.1s, background 0.1s;
  flex-shrink: 0;
}
.mmio-file-badge__remove:hover:not(:disabled) {
  background: hsl(var(--destructive) / 0.1);
  color: hsl(var(--destructive));
}
.mmio-file-badge__remove:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.mmio-tar-note {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  padding: 0.25rem 0.125rem;
}

.mmio-readonly-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.mmio-readonly-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0;
}
.mmio-readonly-item__name {
  font-size: 0.85rem;
  font-weight: 500;
  color: hsl(var(--foreground));
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mmio-readonly-item__type {
  font-size: 0.7rem;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted));
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
  white-space: nowrap;
  flex-shrink: 0;
}
.mmio-readonly-empty {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
}
</style>
