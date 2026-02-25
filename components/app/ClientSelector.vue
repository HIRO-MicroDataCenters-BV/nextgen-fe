<template>
  <div class="space-y-2">
    <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {{ t("client_selector.label") }}
    </label>
    <Select
      :model-value="selectedClient ?? ''"
      @update:model-value="(v) => onClientChange(String(v ?? ''))"
    >
      <SelectTrigger class="w-full">
        <SelectValue :placeholder="t('client_selector.placeholder')" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="S3">
            {{ t("client_selector.s3") }}
          </SelectItem>
          <SelectItem value="local">
            {{ t("client_selector.local") }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>

    <!-- Status row -->
    <div class="flex items-center gap-2 h-4">
      <template v-if="clientStatus === 'checking'">
        <Icon name="lucide:loader-circle" class="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        <span class="text-xs text-muted-foreground">{{ t("client_selector.status.checking") }}</span>
      </template>
      <template v-else-if="clientStatus === 'valid'">
        <Icon name="lucide:check-circle-2" class="h-3.5 w-3.5 text-green-600" />
        <span class="text-xs text-green-600">{{ t("client_selector.status.valid") }}</span>
      </template>
      <template v-else-if="clientStatus === 'error'">
        <Icon name="lucide:x-circle" class="h-3.5 w-3.5 text-destructive" />
        <span class="text-xs text-destructive">{{ t("client_selector.status.error") }}</span>
      </template>
    </div>

    <!-- Error banner -->
    <p
      v-if="clientStatus === 'error'"
      class="text-sm text-muted-foreground mt-1"
    >
      {{ t("client_selector.error_description") }}
    </p>
  </div>
</template>

<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClientType } from "@/composables/useClientSelector";

const { t } = useI18n();
const { selectedClient, clientStatus, selectClient } = useClientSelector();

const onClientChange = (value: string) => {
  if (value === "S3" || value === "local") {
    selectClient(value as ClientType);
  }
};
</script>
