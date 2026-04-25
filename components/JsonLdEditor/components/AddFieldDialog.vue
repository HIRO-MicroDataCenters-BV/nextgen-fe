<template>
  <!-- Floating slide-over panel -->
  <Transition name="panel">
    <div v-if="open" class="panel-backdrop" @click.self="close">
      <div class="field-panel" role="dialog" aria-modal="true" :aria-label="t('jsonld.editor.addFieldDialog.title')">

        <!-- Panel header -->
        <div class="panel-header">
          <div>
            <h2 class="panel-title">{{ t('jsonld.editor.addFieldDialog.title') }}</h2>
            <p class="panel-subtitle">{{ t('jsonld.editor.addFieldDialog.description') }}</p>
          </div>
          <button class="close-btn" type="button" @click="close">
            <Icon name="lucide:x" class="size-5" />
          </button>
        </div>

        <!-- Search -->
        <AddFieldSearchBar
          v-model="searchQuery"
          ref="searchBarRef"
          :placeholder="t('jsonld.editor.addFieldDialog.searchPlaceholder')"
        />

        <!-- Field groups -->
        <div class="panel-body">
          <div v-if="filteredGroupedFields.length === 0" class="empty-msg">
            <Icon name="lucide:search-x" class="size-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>{{ t('jsonld.editor.addFieldDialog.noFieldsAvailable') }}</p>
          </div>

          <div
            v-for="group in filteredGroupedFields"
            :key="group.category"
            class="field-group"
          >
            <div class="group-header">
              <span class="group-icon">{{ categoryMeta[group.category]?.emoji ?? '📋' }}</span>
              <span class="group-label">
                {{ t(`jsonld.editor.addFieldDialog.categories.${group.category}`, group.category) }}
              </span>
            </div>

            <!-- Dashboard card grid -->
            <div class="field-grid">
              <AddFieldCard
                v-for="field in group.fields"
                :key="field.key"
                :field="field"
                :added="isAlreadyAdded(field.key)"
                @select="selectField(field)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import type { FieldDefinition } from '../types/editor.types';
import { useJsonLdSchema } from '../composables/useJsonLdSchema';
import { useAddFieldCatalog } from '../composables/useAddFieldCatalog';
import { ADD_FIELD_CATEGORY_META } from '../constants/addFieldCategories';
import AddFieldSearchBar from './AddFieldSearchBar.vue';
import AddFieldCard from './AddFieldCard.vue';

interface Props {
  open: boolean;
  existingKeys?: string[];
  context?: 'dataset' | 'distribution';
}

const props = withDefaults(defineProps<Props>(), {
  existingKeys: () => [],
  context: 'dataset',
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  confirm: [field: FieldDefinition];
}>();

const { t } = useI18n();
const { getAddableFields } = useJsonLdSchema();

const searchQuery = ref('');
const searchBarRef = ref<{ focusInput: () => void } | null>(null);

// Focus search when panel opens
watch(
  () => props.open,
  async (open) => {
    if (open) {
      searchQuery.value = '';
      await nextTick();
      searchBarRef.value?.focusInput();
    }
  },
);

// Category display metadata
const categoryMeta = ADD_FIELD_CATEGORY_META;


const { filteredGroupedFields, isAlreadyAdded } = useAddFieldCatalog({
  context: computed(() => props.context),
  existingKeys: computed(() => props.existingKeys),
  searchQuery,
  getAddableFields,
});

const selectField = (field: FieldDefinition) => {
  if (isAlreadyAdded(field.key)) return;
  emit('confirm', field);
  close();
};

const close = () => {
  emit('update:open', false);
  searchQuery.value = '';
};
</script>

<style scoped>
/* ── Backdrop ──────────────────────────────────────────────────  */
.panel-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: hsl(0 0% 0% / 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
}

/* ── Panel ─────────────────────────────────────────────────────  */
.field-panel {
  width: min(580px, 100vw);
  height: 100%;
  display: flex;
  flex-direction: column;
  /* Explicit solid background so the panel is always opaque */
  background: #ffffff;
  box-shadow: -8px 0 32px hsl(0 0% 0% / 0.18);
  overflow: hidden;
}

:root.dark .field-panel {
  background: #1a1b1e;
}

/* ── Panel enter/leave animation ───────────────────────────────  */
.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.22s ease;
}
.panel-enter-active .field-panel,
.panel-leave-active .field-panel {
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
}
.panel-enter-from .field-panel {
  transform: translateX(100%);
}
.panel-leave-to .field-panel {
  transform: translateX(100%);
}

/* ── Header ────────────────────────────────────────────────────  */
.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid hsl(var(--border, 220 13% 88%));
  gap: 1rem;
  flex-shrink: 0;
  background: inherit;
}

.panel-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: hsl(var(--foreground));
  margin: 0 0 0.2rem;
}

.panel-subtitle {
  font-size: 0.8rem;
  color: hsl(var(--muted-foreground));
  margin: 0;
}

.close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid hsl(var(--border));
  background: transparent;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}
.close-btn:hover { background: hsl(var(--muted)); color: hsl(var(--foreground)); }

/* ── Body ──────────────────────────────────────────────────────  */
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.empty-msg {
  text-align: center;
  padding: 3rem 0;
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
}

/* ── Group ─────────────────────────────────────────────────────  */
.field-group { display: flex; flex-direction: column; gap: 0.625rem; }

.group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.125rem;
}

.group-icon { font-size: 1rem; line-height: 1; }

.group-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground));
}

/* ── Field grid (2 per row) ────────────────────────────────────  */
.field-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
}

@media (max-width: 480px) {
  .field-grid { grid-template-columns: 1fr; }
}

:root.dark .field-panel {
  background: #111827;
}
</style>
