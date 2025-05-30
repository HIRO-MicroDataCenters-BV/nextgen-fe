import { ref } from "vue";
import { useI18n } from "vue-i18n";

export interface FilterItem {
  key: string;
  label: string;
  type: "checkbox" | "select" | "text" | "number";
  value: boolean | number | string | null;
}

export interface FilterGroup {
  key: string;
  label: string;
  items: FilterItem[];
}

export const useFilters = () => {
  const { t } = useI18n();

  const filterGroups = ref<FilterGroup[]>([
    {
      key: "sociodemographics",
      label: t("filters.sociodemographics"),
      items: [
        {
          key: "age",
          label: t("filters.age"),
          type: "number",
          value: null,
        },
        {
          key: "gender",
          label: t("filters.gender"),
          type: "select",
          value: null,
        },
        {
          key: "ethnicity",
          label: t("filters.ethnicity"),
          type: "select",
          value: null,
        },
      ],
    },
    {
      key: "comorbidities",
      label: t("filters.comorbidities"),
      items: [
        {
          key: "previous_myocardial_infarction",
          label: t("filters.previous_myocardial_infarction"),
          type: "checkbox",
          value: null,
        },
        {
          key: "stroke",
          label: t("filters.stroke"),
          type: "checkbox",
          value: null,
        },
        {
          key: "chronic_obstructive_pulmonary_disease",
          label: t("filters.chronic_obstructive_pulmonary_disease"),
          type: "checkbox",
          value: null,
        },
        {
          key: "atrial_fibrillation",
          label: t("filters.atrial_fibrillation"),
          type: "checkbox",
          value: null,
        },
        {
          key: "peripheral_artery_disease",
          label: t("filters.peripheral_artery_disease"),
          type: "checkbox",
          value: null,
        },
        {
          key: "hypertension",
          label: t("filters.hypertension"),
          type: "checkbox",
          value: null,
        },
        {
          key: "diabetes",
          label: t("filters.diabetes"),
          type: "checkbox",
          value: null,
        },
        {
          key: "hypercholesterolemia",
          label: t("filters.hypercholesterolemia"),
          type: "checkbox",
          value: null,
        },
        {
          key: "chronic_kidney_disease",
          label: t("filters.chronic_kidney_disease"),
          type: "checkbox",
          value: null,
        },
      ],
    },
    {
      key: "physical_measurements",
      label: t("filters.physical_measurements"),
      items: [
        {
          key: "height",
          label: t("filters.height"),
          type: "number",
          value: null,
        },
        {
          key: "waist_hip_ratio",
          label: t("filters.waist_hip_ratio"),
          type: "number",
          value: null,
        },
        {
          key: "waist_height_ratio",
          label: t("filters.waist_height_ratio"),
          type: "number",
          value: null,
        },
        {
          key: "sbp",
          label: t("filters.sbp"),
          type: "number",
          value: null,
        },
      ],
    },
    {
      key: "lifestyle_habits",
      label: t("filters.lifestyle_habits"),
      items: [
        {
          key: "smoking_history",
          label: t("filters.smoking_history"),
          type: "checkbox",
          value: null,
        },
      ],
    },
  ]);

  const getActiveFilters = () => {
    const activeFilters: Record<string, unknown> = {};

    filterGroups.value.forEach((group) => {
      group.items.forEach((item) => {
        if (item.value !== null) {
          activeFilters[item.key] = item.value;
        }
      });
    });

    return activeFilters;
  };

  const resetFilters = () => {
    filterGroups.value.forEach((group) => {
      group.items.forEach((item) => {
        item.value = null;
      });
    });
  };

  return {
    filterGroups,
    getActiveFilters,
    resetFilters,
  };
};
