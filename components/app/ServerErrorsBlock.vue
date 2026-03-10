<script setup lang="ts">
import type { ApiErrorDetail } from "~/types/api.types";

defineProps<{
  errors: ApiErrorDetail[] | null;
}>();
</script>

<template>
  <div
    v-if="errors && errors.length > 0"
    class="server-errors-block mb-4 rounded-lg border border-destructive/50 bg-destructive/5 p-4"
  >
    <div class="server-errors-header flex items-center gap-2 text-sm font-semibold text-destructive">
      <Icon name="lucide:server-crash" class="size-4 flex-shrink-0" />
      <span>{{ $t("jsonld.editor.serverErrors", "Server Errors") }}</span>
    </div>
    <div class="server-errors-list mt-3 space-y-3">
      <div
        v-for="(err, idx) in errors"
        :key="idx"
        class="server-error-item rounded border border-destructive/30 bg-background p-3 text-sm"
      >
        <div class="font-medium text-destructive">
          {{ err.message ?? err.code ?? "Validation error" }}
        </div>
        <div
          v-if="err.details && err.details.length > 0"
          class="mt-2 space-y-1.5 pl-2 text-muted-foreground"
        >
          <div
            v-for="(d, di) in err.details"
            :key="di"
            class="text-xs"
          >
            <span v-if="d.resultMessage" class="font-medium">{{ d.resultMessage }}</span>
            <span v-if="d.resultPath" class="ml-1 opacity-80">({{ d.resultPath }})</span>
            <span v-if="d.focusNode" class="block mt-0.5 truncate opacity-70">{{ d.focusNode }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
