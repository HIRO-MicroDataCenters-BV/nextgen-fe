import { ref } from "vue";

type CatalogEntityType = "datasets" | "applications";
type StoredSelection = Record<string, unknown> | null;

const STORAGE_KEY = "training-order-selection-v1";
const selectedDataset = ref<Record<string, unknown> | null>(null);
const selectedApplication = ref<Record<string, unknown> | null>(null);
let hydrated = false;

const getScalar = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const scalar = getScalar(item);
      if (scalar) return scalar;
    }
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("@value" in obj) return getScalar(obj["@value"]);
    if ("@id" in obj) return getScalar(obj["@id"]);
  }
  return null;
};

const normalizeSelection = (
  item: StoredSelection,
  fallbackId?: string | null,
): Record<string, unknown> | null => {
  if (!item || typeof item !== "object") return null;
  const obj = { ...item } as Record<string, unknown>;
  const id =
    getScalar(obj.id) ||
    getScalar(obj.identifier) ||
    getScalar(obj["@id"]) ||
    getScalar(obj["dcterms:identifier"]) ||
    fallbackId ||
    null;
  const name =
    getScalar(obj.name) ||
    getScalar(obj.title) ||
    getScalar(obj["dcterms:title"]) ||
    getScalar(obj["rdfs:label"]) ||
    id ||
    null;
  if (id) obj.id = id;
  if (name) obj.name = name;
  return obj;
};

export const useTrainingOrder = () => {
  const persist = () => {
    if (!import.meta.client) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        dataset: selectedDataset.value,
        application: selectedApplication.value,
      }),
    );
  };

  const hydrate = () => {
    if (hydrated) return;
    if (!import.meta.client) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        dataset?: Record<string, unknown> | null;
        application?: Record<string, unknown> | null;
      };
      selectedDataset.value = normalizeSelection(parsed.dataset ?? null);
      selectedApplication.value = normalizeSelection(parsed.application ?? null);
    } catch {
      // ignore corrupted storage
    }
    hydrated = true;
  };

  hydrate();

  const setSelection = (
    type: CatalogEntityType,
    items: Record<string, unknown>[],
    fallbackId?: string | null,
  ) => {
    const first = normalizeSelection(items[0] ?? null, fallbackId);
    if (type === "datasets") {
      selectedDataset.value = first;
      persist();
      return;
    }
    selectedApplication.value = first;
    persist();
  };

  const clearOrder = () => {
    selectedDataset.value = null;
    selectedApplication.value = null;
    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearSelection = (type: CatalogEntityType) => {
    if (type === "datasets") {
      selectedDataset.value = null;
    } else {
      selectedApplication.value = null;
    }
    persist();
  };

  return {
    selectedDataset,
    selectedApplication,
    setSelection,
    clearOrder,
    clearSelection,
  };
};
