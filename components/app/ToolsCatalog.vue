<template>
  <AppContent :title="t('title.tools')" :description="t('subtitle.tools')">
    <div
      :class="
        fullWidth
          ? 'w-full px-8 py-6'
          : 'mx-auto w-full max-w-[1200px] px-8 py-8'
      "
    >
      <!-- Search + filters -->
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="relative w-full sm:max-w-xs">
          <Icon
            name="lucide:search"
            class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            v-model="search"
            :placeholder="t('tools.search_placeholder')"
            class="pl-9"
          />
        </div>

        <Select v-model="category">
          <SelectTrigger class="w-full sm:w-52">
            <SelectValue :placeholder="t('tools.all_categories')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t("tools.all_categories") }}</SelectItem>
            <SelectItem v-for="c in categories" :key="c" :value="c">
              {{ humanize(c) }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="type">
          <SelectTrigger class="w-full sm:w-44">
            <SelectValue :placeholder="t('tools.all_types')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t("tools.all_types") }}</SelectItem>
            <SelectItem v-for="ty in types" :key="ty" :value="ty">
              {{ t(`tools.type.${ty}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Grid -->
      <div
        v-if="filtered.length"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AppToolCard v-for="tool in filtered" :key="tool.id" :tool="tool" />
      </div>

      <!-- Empty state -->
      <div
        v-else
        class="flex flex-col items-center justify-center gap-3 py-20 text-center"
      >
        <div class="flex size-12 items-center justify-center rounded-full bg-muted">
          <Icon name="lucide:search-x" class="size-6 text-muted-foreground" />
        </div>
        <div class="space-y-1">
          <p class="font-medium">{{ t("tools.empty_title") }}</p>
          <p class="text-sm text-muted-foreground">{{ t("tools.empty_hint") }}</p>
        </div>
      </div>
    </div>
  </AppContent>
</template>

<script setup lang="ts">
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Tool } from "~/types/tools.types";

// `fullWidth` = the authenticated /tools page (edge-to-edge, no side space).
// Default (guest landing at "/") is a contained layout with left/right margins.
withDefaults(defineProps<{ fullWidth?: boolean }>(), { fullWidth: false });

const { t } = useI18n();
const { setPage } = useApp();

setPage({
  section: "tools",
  title: t("title.tools"),
  subtitle: t("subtitle.tools"),
});

// Sample catalogue matching the tool API shape. Replace with an API response
// (Tool[]) when the endpoint exists — the filtering + card rendering below are
// data-source agnostic.
const tools = ref<Tool[]>([
  {
    id: "tool-1",
    name: "Imaging Segmentation Suite",
    partner: "HUS",
    description: "Automated segmentation of medical imaging with federated model training.",
    category: "imaging",
    type: "federated",
    version: "1.2.0",
    license: "Apache-2.0",
    links: {
      repository: "https://github.com/nextgen-eu/imaging-segmentation",
      pathfinder: "https://pathfinder.nextgen.eu/tools/imaging-segmentation",
      doi: "10.5281/zenodo.1000001",
    },
    keywords: ["imaging", "segmentation"],
  },
  {
    id: "tool-2",
    name: "Cohort Builder",
    partner: "KI",
    description: "Assemble and refine patient cohorts from harmonised metadata.",
    category: "analytics",
    type: "federated",
    version: "3.0.4",
    license: "MIT",
    links: {
      repository: "https://github.com/nextgen-eu/cohort-builder",
      pathfinder: "https://pathfinder.nextgen.eu/tools/cohort-builder",
      doi: "10.5281/zenodo.1000002",
    },
    keywords: ["cohort", "analytics", "selection"],
  },
  {
    id: "tool-3",
    name: "DCAT-AP Validator",
    partner: "UMCU",
    description: "Check dataset metadata against the DCAT-AP 3 profile before publishing.",
    category: "interoperability",
    type: "library",
    version: "0.9.2",
    license: "EUPL-1.2",
    links: {
      repository: "https://github.com/nextgen-eu/dcat-ap-validator",
      doi: "10.5281/zenodo.1000003",
    },
    keywords: ["dcat-ap", "metadata", "validation"],
  },
  {
    id: "tool-4",
    name: "MMIO Toolkit",
    partner: "UvA",
    description: "Parse, transform and export machine-readable metadata input objects.",
    category: "data-processing",
    type: "library",
    version: "1.5.0",
    license: "Apache-2.0",
    links: {
      repository: "https://github.com/nextgen-eu/mmio-toolkit",
    },
    keywords: ["mmio", "etl", "metadata"],
  },
  {
    id: "tool-5",
    name: "Consent Manager",
    partner: "TUM",
    description: "Track and enforce data-use agreements and access conditions.",
    category: "privacy",
    type: "utility",
    version: "2.1.3",
    license: "GPL-3.0",
    links: {
      repository: "https://github.com/nextgen-eu/consent-manager",
      pathfinder: "https://pathfinder.nextgen.eu/tools/consent-manager",
    },
    keywords: ["consent", "access", "governance"],
  },
  {
    id: "tool-6",
    name: "Insight Charts",
    partner: "HUS",
    description: "Generate shareable visualisations from federated aggregate results.",
    category: "visualization",
    type: "utility",
    version: "0.4.0",
    license: "MIT",
    links: {
      repository: "https://github.com/nextgen-eu/insight-charts",
      doi: "10.5281/zenodo.1000006",
    },
    keywords: ["charts", "visualization"],
  },
]);

const search = ref("");
const category = ref<string>("all");
const type = ref<string>("all");

const categories = computed(() =>
  [...new Set(tools.value.map((tool) => tool.category))].sort(),
);
const types = ["federated", "library", "utility"] as const;

// Category slugs → human labels for the filter, e.g. "data-processing" → "Data processing".
const humanize = (slug: string) =>
  slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return tools.value.filter((tool) => {
    const matchesQuery =
      !q ||
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.partner.toLowerCase().includes(q) ||
      tool.keywords.some((kw) => kw.toLowerCase().includes(q));
    const matchesCategory =
      category.value === "all" || tool.category === category.value;
    const matchesType = type.value === "all" || tool.type === type.value;
    return matchesQuery && matchesCategory && matchesType;
  });
});
</script>
