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
        <div class="panel-search">
          <Icon name="lucide:search" class="search-icon" />
          <input
            ref="searchInput"
            v-model="searchQuery"
            class="search-input"
            type="text"
            :placeholder="t('jsonld.editor.addFieldDialog.searchPlaceholder')"
          >
          <button v-if="searchQuery" class="clear-btn" type="button" @click="searchQuery = ''">
            <Icon name="lucide:x" class="size-3.5" />
          </button>
        </div>

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
              <button
                v-for="field in group.fields"
                :key="field.key"
                type="button"
                class="field-card"
                :class="{ 'field-card--added': isAlreadyAdded(field.key) }"
                :disabled="isAlreadyAdded(field.key)"
                @click="selectField(field)"
              >
                <!-- Icon circle: always has a background -->
                <span class="card-icon-wrap" :class="`card-icon--${field.dcatApCompliance ?? 'optional'}`">
                  <Icon :name="field.icon ?? 'lucide:circle-dot'" class="size-5" />
                </span>

                <span class="card-body">
                  <span class="card-name">{{ field.label }}</span>
                  <span v-if="field.description" class="card-desc">{{ field.description }}</span>
                </span>

                <!-- Status pill -->
                <span
                  v-if="isAlreadyAdded(field.key)"
                  class="status-pill status-pill--added"
                >✓ {{ t('jsonld.editor.addFieldDialog.alreadyAdded') }}</span>
                <span
                  v-else-if="field.dcatApCompliance === 'mandatory'"
                  class="status-pill status-pill--mandatory"
                >{{ t('jsonld.editor.compliance.mandatory') }}</span>
                <span
                  v-else-if="field.dcatApCompliance === 'recommended'"
                  class="status-pill status-pill--recommended"
                >{{ t('jsonld.editor.compliance.recommended') }}</span>
              </button>
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
const searchInput = ref<HTMLInputElement | null>(null);

// Focus search when panel opens
watch(
  () => props.open,
  async (open) => {
    if (open) {
      searchQuery.value = '';
      await nextTick();
      searchInput.value?.focus();
    }
  },
);

// Category display metadata
const categoryMeta: Record<string, { emoji: string }> = {
  identification: { emoji: '🏷️' },
  provenance:     { emoji: '📅' },
  coverage:       { emoji: '🌍' },
  access:         { emoji: '🔑' },
  distribution:   { emoji: '📦' },
};


// Category order
const categoryOrder = ['identification', 'provenance', 'coverage', 'access', 'distribution'];

const allFields = computed(() => getAddableFields(props.context));

const filteredFields = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return allFields.value;
  return allFields.value.filter(f =>
    f.label.toLowerCase().includes(q) ||
    f.description?.toLowerCase().includes(q) ||
    f.key.toLowerCase().includes(q),
  );
});

const filteredGroupedFields = computed(() => {
  const groups: Record<string, FieldDefinition[]> = {};
  for (const field of filteredFields.value) {
    const cat = field.category ?? 'other';
    (groups[cat] ??= []).push(field);
  }
  return categoryOrder
    .filter(cat => groups[cat]?.length)
    .map(cat => ({ category: cat, fields: groups[cat] }));
});

const isAlreadyAdded = (key: string) => props.existingKeys.includes(key);

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

/* ── Search ────────────────────────────────────────────────────  */
.panel-search {
  position: relative;
  padding: 0.875rem 1.5rem;
  border-bottom: 1px solid hsl(var(--border, 220 13% 88%));
  box-shadow: 0 4px 12px -4px hsl(0 0% 0% / 0.08);
  flex-shrink: 0;
  background: inherit;
  z-index: 1;
}

.search-icon {
  position: absolute;
  left: 2.25rem;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: hsl(var(--muted-foreground));
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 2.5rem 0 2.5rem;
  border-radius: 0.625rem;
  border: 1.5px solid hsl(var(--border));
  background: hsl(var(--background));
  font-size: 0.875rem;
  color: hsl(var(--foreground));
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-input:focus {
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 3px hsl(var(--ring) / 0.1);
}
.search-input::placeholder { color: hsl(var(--muted-foreground)); }

.clear-btn {
  position: absolute;
  right: 2.25rem;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px; height: 20px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
}
.clear-btn:hover { background: hsl(var(--muted)); }

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

/* ── Field card ────────────────────────────────────────────────  */
.field-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.875rem 0.875rem 0.75rem;
  background: #ffffff;
  border: 1.5px solid #e5e7eb;
  border-radius: 0.75rem;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.18s ease-out,
              box-shadow   0.18s ease-out,
              transform    0.18s ease-out;
  position: relative;
}

.field-card:not(.field-card--added):hover {
  border-color: #9ca3af;
  box-shadow: 0 0 0 3px hsl(var(--primary) / 0.12),
              0 2px 10px -2px hsl(var(--primary) / 0.08);
  transform: translateY(-1px);
}

.field-card:not(.field-card--added):active {
  transform: translateY(0);
}

.field-card--added {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ── Icon wrap ─────────────────────────────────────────────────  */
.card-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  flex-shrink: 0;
  transition: background 0.25s cubic-bezier(0.4,0,0.2,1), color 0.25s cubic-bezier(0.4,0,0.2,1);
  /* Solid fallback — always visible regardless of CSS variable resolution */
  background: #f3f4f6;
  color: #6b7280;
}

.card-icon--mandatory   { background: #fee2e2; color: #b91c1c; }
.card-icon--recommended { background: #dbeafe; color: #1d4ed8; }
.card-icon--optional    { background: #f3f4f6; color: #6b7280; }

:root.dark .card-icon--mandatory   { background: #450a0a; color: #fca5a5; }
:root.dark .card-icon--recommended { background: #1e3a5f; color: #93c5fd; }
:root.dark .card-icon--optional    { background: #1f2937; color: #9ca3af; }
:root.dark .field-panel            { background: #111827; }
:root.dark .field-card             { background: #1f2937; border-color: #374151; }

/* ── Card text ─────────────────────────────────────────────────  */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}

.card-name {
  font-size: 0.83rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  line-height: 1.3;
}

.card-desc {
  font-size: 0.72rem;
  color: hsl(var(--muted-foreground));
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Status pills ──────────────────────────────────────────────  */
.status-pill {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 999px;
  line-height: 1.6;
  margin-top: auto;
}

.status-pill--mandatory   { background: hsl(0 80% 94%);   color: hsl(0 70% 40%); }
.status-pill--recommended { background: hsl(214 80% 93%); color: hsl(214 70% 38%); }
.status-pill--added       { background: hsl(142 60% 92%); color: hsl(142 50% 30%); }

:root.dark .status-pill--mandatory   { background: hsl(0 50% 22%);   color: hsl(0 90% 80%); }
:root.dark .status-pill--recommended { background: hsl(214 50% 22%); color: hsl(214 90% 80%); }
:root.dark .status-pill--added       { background: hsl(142 40% 18%); color: hsl(142 80% 70%); }
</style>
