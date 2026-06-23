<script setup lang="ts">
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { EditorMode } from "../types/editor.types";

interface Props {
  searchQuery: string;
  currentMode: EditorMode;
  readonly: boolean;
  saveStatus: "idle" | "saving" | "saved";
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "update:searchQuery", value: string): void;
  (e: "toggle-mode", checked: boolean): void;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="editor-header">
    <div class="flex-1 max-w-md">
      <div class="relative">
        <Icon
          name="lucide:search"
          class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
        />
        <Input
          :model-value="searchQuery"
          :placeholder="
            currentMode === 'visual'
              ? t('jsonld.editor.searchPlaceholderVisual')
              : t('jsonld.editor.searchPlaceholderCode')
          "
          class="pl-9 h-9"
          @update:model-value="emit('update:searchQuery', String($event || ''))"
        />
        <Button
          v-if="searchQuery"
          variant="ghost"
          size="sm"
          class="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          @click="emit('update:searchQuery', '')"
        >
          <Icon name="lucide:x" class="size-4" />
        </Button>
      </div>
    </div>

    <div class="header-right">
      <div class="save-slot">
        <span v-if="saveStatus === 'saving'" class="save-indicator save-indicator--saving">
          <Icon name="lucide:loader-circle" class="size-3 animate-spin" />
          <span>{{ t("jsonld.editor.saving") }}</span>
        </span>
        <span v-else-if="saveStatus === 'saved'" class="save-indicator save-indicator--saved">
          <Icon name="lucide:check" class="size-3" />
          <span>{{ t("jsonld.editor.saved") }}</span>
        </span>
      </div>

      <div class="mode-toggle-wrap" :title="t('jsonld.editor.modeToggleTitle')">
        <Label for="mode-switch" class="text-xs text-muted-foreground">{{
          t("jsonld.editor.modeVisual")
        }}</Label>
        <Switch
          id="mode-switch"
          :model-value="currentMode === 'code'"
          @update:model-value="emit('toggle-mode', !!$event)"
        />
        <Label for="mode-switch" class="text-xs text-muted-foreground">{{
          t("jsonld.editor.modeJson")
        }}</Label>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* These elements live in this component, so the styles must be defined here:
   scoped CSS in the parent (index.css) cannot reach a child's inner nodes. */
.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

/* Fixed-width slot reserves space for the transient save indicator so it can
   fade in/out beside the toggle without shifting it (was causing a flicker). */
.save-slot {
  width: 80px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.save-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
  animation: save-appear 0.2s ease;
}
@keyframes save-appear {
  from { opacity: 0; }
  to { opacity: 1; }
}
.save-indicator--saving {
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted));
}
.save-indicator--saved {
  color: hsl(142 50% 32%);
  background: hsl(142 60% 92%);
}
:global(:root.dark) .save-indicator--saved {
  background: hsl(142 40% 18%);
  color: hsl(142 70% 65%);
}

/* Mode toggle — keep Visual / switch / JSON stacked vertically */
.mode-toggle-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.mode-toggle-wrap:hover {
  opacity: 1;
}
</style>
