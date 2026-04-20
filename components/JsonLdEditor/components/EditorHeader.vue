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
          :disabled="readonly"
          @update:model-value="emit('toggle-mode', !!$event)"
        />
        <Label for="mode-switch" class="text-xs text-muted-foreground">{{
          t("jsonld.editor.modeJson")
        }}</Label>
      </div>
    </div>
  </div>
</template>
