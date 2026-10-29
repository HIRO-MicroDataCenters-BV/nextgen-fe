<template>
  <section
    class="flex flex-wrap items-start gap-4 rounded-xl border bg-card p-5 shadow-xs"
    data-testid="issuer-hub"
  >
    <div
      class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
    >
      <Icon name="lucide:landmark" class="size-6" />
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="min-w-0">
          <div class="text-xs text-muted-foreground">
            {{ t("credentials.hub.label") }}
          </div>
          <div class="text-lg font-semibold">
            {{ issuer?.issuer_name ?? "—" }}
          </div>
        </div>
        <button
          v-if="issuer"
          type="button"
          class="flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
          :title="issuer.issuer_aid"
          @click="emit('copy', issuer.issuer_aid)"
        >
          {{ shortId(issuer.issuer_aid) }}
          <Icon name="lucide:copy" class="size-3" />
        </button>
      </div>

      <!-- Health checks: each one is a reason a login could fail -->
      <ul class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <li
          v-for="check in checks"
          :key="check.id"
          class="flex items-center gap-1.5"
          :class="toneText[check.tone]"
          :title="check.hint"
        >
          <Icon :name="toneIcon[check.tone]" class="size-4" />
          {{ check.label }}
        </li>
      </ul>

      <p
        v-if="explanation"
        class="mt-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground"
      >
        {{ explanation }}
      </p>
    </div>

    <Button
      v-if="issuerState === 'offline'"
      size="sm"
      variant="outline"
      @click="emit('retry')"
    >
      <Icon name="lucide:rotate-cw" />
      {{ t("credentials.hub.retry") }}
    </Button>
  </section>
</template>

<script setup lang="ts">
import { shortId } from "~/composables/issuer/format";
import type { WitnessStatus } from "~/composables/issuer/witnessClient";
import type { IssuerInfo } from "~/types/issuer.types";

type Tone = "ok" | "warn" | "bad" | "idle";

const props = defineProps<{
  issuer: IssuerInfo | null;
  issuerState: "checking" | "online" | "offline";
  issuerError: string | null;
  witnessStatus: WitnessStatus | "checking";
  /** False when no witness URL is configured (e.g. HUS: the witness is
   *  internal); the witness and login rows are then not shown. */
  witnessChecked?: boolean;
}>();
const emit = defineEmits<{ retry: []; copy: [aid: string] }>();

const { t } = useI18n();

const toneText: Record<Tone, string> = {
  ok: "text-emerald-600 dark:text-emerald-400",
  warn: "text-amber-600 dark:text-amber-400",
  bad: "text-destructive",
  idle: "text-muted-foreground",
};
const toneIcon: Record<Tone, string> = {
  ok: "lucide:circle-check",
  warn: "lucide:triangle-alert",
  bad: "lucide:circle-x",
  idle: "lucide:loader-circle",
};

const checks = computed(() => {
  const service: Tone =
    props.issuerState === "online"
      ? "ok"
      : props.issuerState === "offline"
        ? "bad"
        : "idle";

  const witness: Tone =
    props.issuerState !== "online" || props.witnessStatus === "checking"
      ? "idle"
      : props.witnessStatus === "published"
        ? "ok"
        : "warn";

  // Logins verify the issuer's key at a witness, so they follow the witness check.
  const login: Tone =
    witness === "ok" ? "ok" : witness === "warn" ? "warn" : "idle";

  const rows = [
    {
      id: "service",
      tone: service,
      label: t(`credentials.hub.service.${props.issuerState}`),
      hint: props.issuerError ?? "",
    },
    {
      id: "witness",
      tone: witness,
      label: t(`credentials.hub.witness.${witness === "idle" ? "checking" : props.witnessStatus}`),
      hint: t("credentials.hub.witness.hint"),
    },
    {
      id: "login",
      tone: login,
      label: t(`credentials.hub.login.${login}`),
      hint: t("credentials.hub.login.hint"),
    },
  ];
  return props.witnessChecked === false ? rows.slice(0, 1) : rows;
});

const explanation = computed(() => {
  if (props.issuerState === "offline") return props.issuerError;
  if (props.issuerState !== "online" || props.witnessChecked === false) return null;
  if (props.witnessStatus === "missing") return t("credentials.hub.explain_missing");
  if (props.witnessStatus === "unknown") return t("credentials.hub.explain_unknown");
  return null;
});
</script>
