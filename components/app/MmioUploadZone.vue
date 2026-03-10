<template>
  <div class="mmio-upload-root">

    <!-- ══ READ-ONLY / VIEW MODE ══════════════════════════════════ -->
    <template v-if="readonly">
      <template v-if="mmioFile || bundleFile">
        <div class="mmio-readonly-list">
          <div v-if="mmioFile" class="mmio-readonly-item">
            <Icon
              :name="mmioFile.endsWith('.tar') ? 'lucide:package' : 'lucide:file-json'"
              class="size-4 flex-shrink-0"
              :class="mmioFile.endsWith('.tar') ? 'text-purple-500' : 'text-blue-500'"
            />
            <span class="mmio-readonly-item__name">{{ mmioFile }}</span>
            <span class="mmio-readonly-item__type">
              {{ mmioFile.endsWith('.tar') ? 'MMIO + OCA Bundle' : 'MMIO' }}
            </span>
          </div>
          <div v-if="bundleFile" class="mmio-readonly-item">
            <Icon name="lucide:package" class="size-4 flex-shrink-0 text-purple-500" />
            <span class="mmio-readonly-item__name">{{ bundleFile }}</span>
            <span class="mmio-readonly-item__type">OCA Bundle</span>
          </div>
        </div>
      </template>
      <span v-else class="mmio-readonly-empty">—</span>
    </template>

    <!-- ══ EDITABLE MODE ══════════════════════════════════════════ -->
    <template v-else>

      <!-- ── MMIO JSON zone ─────────────────────────────────────── -->
      <div class="mmio-upload-section">
        <p class="mmio-upload-section__label">
          <Icon name="lucide:file-json" class="size-4 text-blue-500" />
          MMIO <span class="mmio-upload-section__ext">.json</span>
          <span class="mmio-upload-section__required">*</span>
        </p>

        <!-- Uploaded badge -->
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

        <!-- Drop zone -->
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
          />
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

      <!-- Divider with "+" — shown only when no TAR uploaded -->
      <div v-if="!isTarUploaded" class="mmio-upload-divider">
        <div class="mmio-upload-divider__line" />
        <span class="mmio-upload-divider__text">+</span>
        <div class="mmio-upload-divider__line" />
      </div>

      <!-- ── OCA Bundle zone (only when MMIO is .json, not .tar) ── -->
      <div v-if="!isTarUploaded" class="mmio-upload-section">
        <p class="mmio-upload-section__label">
          <Icon name="lucide:package" class="size-4 text-purple-500" />
          OCA Bundle <span class="mmio-upload-section__ext">.tar</span>
          <span class="mmio-upload-section__optional">{{ t('label.optional', 'optional') }}</span>
        </p>

        <!-- Uploaded badge -->
        <div v-if="bundleFile" class="mmio-file-badge">
          <div class="mmio-file-badge__info">
            <Icon name="lucide:package" class="size-4 flex-shrink-0 text-purple-500" />
            <span class="mmio-file-badge__name">{{ bundleFile }}</span>
            <Icon name="lucide:circle-check" class="size-4 text-green-600 flex-shrink-0" />
          </div>
          <button
            type="button"
            class="mmio-file-badge__remove"
            :disabled="disabled"
            @click="emit('remove-bundle')"
          >
            <Icon name="lucide:x" class="size-3.5" />
          </button>
        </div>

        <!-- Drop zone -->
        <div
          v-else
          class="mmio-drop-zone"
          :class="{
            'mmio-drop-zone--drag': draggingBundle,
            'mmio-drop-zone--disabled': disabled || !mmioFile,
            'mmio-drop-zone--locked': !mmioFile,
          }"
          @dragover.prevent="mmioFile && (draggingBundle = true)"
          @dragleave.prevent="draggingBundle = false"
          @drop.prevent="mmioFile && handleDropBundle($event)"
          @click="!disabled && mmioFile && inputBundleRef?.click()"
        >
          <input
            ref="inputBundleRef"
            type="file"
            accept="application/x-tar,.tar,.bundles,.bundle"
            class="sr-only"
            :disabled="disabled || !mmioFile"
            @change="handleInputBundle"
          />
          <Icon
            :name="draggingBundle ? 'lucide:download' : 'lucide:layers'"
            class="size-5"
            :class="draggingBundle ? 'text-primary' : 'text-muted-foreground'"
          />
          <span class="mmio-drop-zone__hint">
            <template v-if="!mmioFile">
              <span class="mmio-drop-zone__locked-text">{{ t('hint.upload_mmio_first', 'Upload MMIO file first') }}</span>
            </template>
            <template v-else>
              <span class="mmio-drop-zone__link">{{ t('action.click_to_browse', 'Browse') }}</span>
              {{ ' ' }}{{ t('label.or_drag_drop', 'or drop') }}
            </template>
          </span>
          <span class="mmio-drop-zone__formats">.tar · .bundles</span>
        </div>
      </div>

      <!-- TAR "all-in-one" indicator -->
      <div v-if="isTarUploaded" class="mmio-tar-note">
        <Icon name="lucide:info" class="size-3.5 text-muted-foreground flex-shrink-0" />
        <span>{{ t('hint.tar_contains_bundle', '.tar already contains both MMIO and OCA bundle') }}</span>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(defineProps<{
  mmioFile?: string | null;
  bundleFile?: string | null;
  uploading?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  inputKey?: number;
}>(), {
  mmioFile: null,
  bundleFile: null,
  uploading: false,
  disabled: false,
  readonly: false,
  inputKey: 0,
});

const emit = defineEmits<{
  'change-mmio': [file: File];
  'change-bundle': [file: File];
  'remove-mmio': [];
  'remove-bundle': [];
}>();

const { t } = useI18n();
const inputMmioRef = ref<HTMLInputElement | null>(null);
const inputBundleRef = ref<HTMLInputElement | null>(null);
const draggingMmio = ref(false);
const draggingBundle = ref(false);

const isTarUploaded = computed(() => props.mmioFile?.endsWith('.tar') ?? false);

const handleInputMmio = (e: Event) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (f) emit('change-mmio', f);
};
const handleDropMmio = (e: DragEvent) => {
  draggingMmio.value = false;
  const f = e.dataTransfer?.files?.[0];
  if (f) emit('change-mmio', f);
};
const handleInputBundle = (e: Event) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (f) emit('change-bundle', f);
};
const handleDropBundle = (e: DragEvent) => {
  draggingBundle.value = false;
  const f = e.dataTransfer?.files?.[0];
  if (f) emit('change-bundle', f);
};
</script>

<style scoped>
.mmio-upload-root {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Section */
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
.mmio-upload-section__required {
  color: hsl(var(--destructive));
  font-size: 0.8rem;
}
.mmio-upload-section__optional {
  color: hsl(var(--muted-foreground));
  font-size: 0.7rem;
  font-weight: 400;
}

/* Drop zone */
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
.mmio-drop-zone__locked-text {
  color: hsl(var(--muted-foreground));
  font-style: italic;
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

/* File badge */
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

/* Divider */
.mmio-upload-divider {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.25rem;
}
.mmio-upload-divider__line {
  flex: 1;
  height: 1px;
  background: hsl(var(--border));
}
.mmio-upload-divider__text {
  font-size: 0.75rem;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
}

/* TAR note */
.mmio-tar-note {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  padding: 0.25rem 0.125rem;
}

/* Read-only view */
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
