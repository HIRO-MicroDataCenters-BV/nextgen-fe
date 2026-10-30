<template>
  <!-- One line: "Signed by: HUS issuer · EAjRk4…LU4G · Online" -->
  <section
    class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-card px-4 py-2.5 text-sm"
    data-testid="issuer-hub"
    :title="t('credentials.hub.explain')"
  >
    <div class="flex min-w-0 items-center gap-2">
      <Icon name="lucide:landmark" class="size-4 shrink-0 text-muted-foreground" />
      <span class="text-muted-foreground">{{ t("credentials.hub.label") }}</span>
      <span class="font-medium">{{ displayName }}</span>
      <span v-if="issuer" class="text-muted-foreground" aria-hidden="true">·</span>
      <button
        v-if="issuer"
        type="button"
        class="flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        :title="issuer.issuer_aid"
        @click="emit('copy', issuer.issuer_aid)"
      >
        {{ shortId(issuer.issuer_aid) }}
        <Icon name="lucide:copy" class="size-3" />
      </button>
    </div>

    <span class="text-muted-foreground" aria-hidden="true">·</span>

    <!-- Health checks: each one is a reason a login could fail -->
    <ul class="flex flex-wrap items-center gap-x-4 gap-y-1">
      <li
        v-for="check in checks"
        :key="check.id"
        class="flex items-center gap-1.5"
        :class="toneText[check.tone]"
        :title="check.hint || undefined"
      >
        <span
          v-if="check.id === 'service'"
          class="size-2 rounded-full"
          :class="toneDot[check.tone]"
          aria-hidden="true"
        />
        <Icon v-else :name="toneIcon[check.tone]" class="size-4" />
        {{ check.label }}
      </li>
    </ul>

    <Button
      v-if="issuerState === 'offline'"
      size="sm"
      variant="outline"
      class="h-7"
      @click="emit('retry')"
    >
      <Icon name="lucide:rotate-cw" />
      {{ t("credentials.hub.retry") }}
    </Button>

    <p
      v-if="explanation"
      class="basis-full rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground"
    >
      {{ explanation }}
    </p>
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
const toneDot: Record<Tone, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-destructive",
  idle: "bg-muted-foreground/50 animate-pulse",
};
const toneIcon: Record<Tone, string> = {
  ok: "lucide:circle-check",
  warn: "lucide:triangle-alert",
  bad: "lucide:circle-x",
  idle: "lucide:loader-circle",
};

// "hus-issuer" → "HUS issuer" (the site's issuer); other names as they are.
const displayName = computed(() => {
  const name = props.issuer?.issuer_name;
  if (!name) return "—";
  const site = /^([a-z0-9]+)-issuer$/i.exec(name)?.[1];
  return site ? t("credentials.hub.site_issuer", { site: site.toUpperCase() }) : name;
});

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
