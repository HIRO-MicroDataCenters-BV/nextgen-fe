<template>
  <Badge :variant="look.variant" :class="look.class">
    <Icon :name="look.icon" class="size-3" />
    {{ t(`admin.state.${state}`) }}
  </Badge>
</template>

<script setup lang="ts">
import type { ContractDisplayState } from "~/utils/contractState";

const props = defineProps<{ state: ContractDisplayState }>();
const { t } = useI18n();

type Variant = "default" | "secondary" | "destructive" | "outline";

// Active and Expired use the same pill styles as ToolCard.vue, so a status
// reads the same everywhere in the app. The two ordinary endings share a
// quiet grey; revoked is the one that should catch the eye.
const LOOKS: Record<ContractDisplayState, { variant: Variant; class: string; icon: string }> = {
  active: {
    variant: "outline",
    class:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
    icon: "lucide:circle-check",
  },
  expired: {
    variant: "outline",
    class:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
    icon: "lucide:hourglass",
  },
  revoked: { variant: "destructive", class: "", icon: "lucide:ban" },
  completed: { variant: "secondary", class: "", icon: "lucide:check" },
  cancelled: { variant: "secondary", class: "", icon: "lucide:x" },
};

const look = computed(() => LOOKS[props.state]);
</script>
