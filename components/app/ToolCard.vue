<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tool, ToolType } from "~/types/tools.types";

const props = defineProps<{ tool: Tool }>();
const { t } = useI18n();

// Literal class strings only — Tailwind v4 emits classes it sees verbatim, so the
// per-type badge palette must never be built by interpolation.
const typeBadgeClass: Record<ToolType, string> = {
  federated:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  library: "border-transparent bg-muted text-muted-foreground",
  utility:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
};

// The icon/colour mapping is derived here from the tool's `category`, rather than
// stored on the tool, so the data model stays a faithful copy of the API shape.
// Unknown categories fall back to a neutral tint. Accent classes are literal for
// Tailwind v4.
const CATEGORY_STYLE: Record<string, { icon: string; accent: string }> = {
  imaging: { icon: "lucide:image", accent: "bg-blue-100 dark:bg-blue-950/40" },
  analytics: { icon: "lucide:activity", accent: "bg-violet-100 dark:bg-violet-950/40" },
  interoperability: {
    icon: "lucide:badge-check",
    accent: "bg-rose-100 dark:bg-rose-950/40",
  },
  "data-processing": {
    icon: "lucide:file-code",
    accent: "bg-emerald-100 dark:bg-emerald-950/40",
  },
  privacy: { icon: "lucide:shield-check", accent: "bg-amber-100 dark:bg-amber-950/40" },
  visualization: {
    icon: "lucide:bar-chart-3",
    accent: "bg-cyan-100 dark:bg-cyan-950/40",
  },
};
const FALLBACK_STYLE = { icon: "lucide:box", accent: "bg-muted" };
const style = computed(
  () => CATEGORY_STYLE[props.tool.category] ?? FALLBACK_STYLE,
);

const doiUrl = computed(() =>
  props.tool.links.doi ? `https://doi.org/${props.tool.links.doi}` : undefined,
);

// Primary destination for the "View" action: source first, then deployment, then DOI.
const primaryLink = computed(
  () =>
    props.tool.links.repository ??
    props.tool.links.pathfinder ??
    doiUrl.value,
);

// Secondary link icons — only those that exist and aren't already the primary action.
const secondaryLinks = computed(() => {
  const out: { href: string; icon: string; label: string }[] = [];
  const { pathfinder } = props.tool.links;
  if (pathfinder && pathfinder !== primaryLink.value) {
    out.push({
      href: pathfinder,
      icon: "lucide:rocket",
      label: t("tools.link.pathfinder"),
    });
  }
  if (doiUrl.value && doiUrl.value !== primaryLink.value) {
    out.push({ href: doiUrl.value, icon: "lucide:book-open", label: t("tools.link.doi") });
  }
  return out;
});
</script>

<template>
  <div
    class="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm"
  >
    <!-- Thumbnail + type badge -->
    <div class="flex items-start justify-between gap-2">
      <div
        :class="
          cn('flex size-11 shrink-0 items-center justify-center rounded-lg', style.accent)
        "
        aria-hidden="true"
      >
        <Icon :name="style.icon" class="size-5 text-foreground/70" />
      </div>
      <Badge
        variant="outline"
        :class="cn('rounded-full font-medium', typeBadgeClass[tool.type])"
      >
        {{ t(`tools.type.${tool.type}`) }}
      </Badge>
    </div>

    <!-- Title + version -->
    <div class="flex flex-col gap-1">
      <div class="flex items-baseline gap-2">
        <h3 class="min-w-0 truncate font-semibold text-foreground">
          {{ tool.name }}
        </h3>
        <span class="shrink-0 text-xs text-muted-foreground">v{{ tool.version }}</span>
      </div>
      <p class="line-clamp-2 text-sm text-muted-foreground">
        {{ tool.description }}
      </p>
    </div>

    <!-- Keywords -->
    <div v-if="tool.keywords.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="kw in tool.keywords.slice(0, 3)"
        :key="kw"
        class="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
      >
        {{ kw }}
      </span>
    </div>

    <!-- Footer: partner + license, secondary links, view -->
    <div
      class="mt-auto flex items-end justify-between gap-2 border-t border-border/60 pt-3"
    >
      <div class="min-w-0">
        <p
          class="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          {{ tool.partner }}
        </p>
        <p class="mt-0.5 truncate text-xs text-muted-foreground/80">
          {{ tool.license }}
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-3">
        <a
          v-for="link in secondaryLinks"
          :key="link.href"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="link.label"
          :title="link.label"
          class="text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon :name="link.icon" class="size-4" />
        </a>
        <a
          v-if="primaryLink"
          :href="primaryLink"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {{ t("tools.action.view") }}
          <Icon name="lucide:arrow-right" class="size-4" />
        </a>
      </div>
    </div>
  </div>
</template>
