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
          key: "med:age",
          label: t("filters.age"),
          type: "checkbox",
          value: null,
        },
        {
          key: "med:gender",
          label: t("filters.gender"),
          type: "checkbox",
          value: null,
        },
        {
          key: "med:ethnicity",
          label: t("filters.ethnicity"),
          type: "checkbox",
          value: null,
        },
      ],
    },
    {
      key: "comorbidities",
      label: t("filters.comorbidities"),
      items: [
        {
          key: "med:previous_myocardial_infarction",
          label: t("filters.previous_myocardial_infarction"),
          type: "checkbox",
          value: null,
        },
        {
          key: "med:stroke",
          label: t("filters.stroke"),
          type: "checkbox",
          value: null,
        },
        {
          key: "med:chronic_obstructive_pulmonary_disease",
          label: t("filters.chronic_obstructive_pulmonary_disease"),
          type: "checkbox",
          value: null,
        },
        {
          key: "med:atrial_fibrillation",
          label: t("filters.atrial_fibrillation"),
          type: "checkbox",
          value: null,
        },
        {
          key: "med:peripheral_artery_disease",
          label: t("filters.peripheral_artery_disease"),
          type: "checkbox",
          value: null,
        },
        {
          key: "med:hypertension",
          label: t("filters.hypertension"),
          type: "checkbox",
          value: null,
        },
        {
          key: "med:diabetes",
          label: t("filters.diabetes"),
          type: "checkbox",
          value: null,
        },
        {
          key: "med:hypercholesterolemia",
          label: t("filters.hypercholesterolemia"),
          type: "checkbox",
          value: null,
        },
        {
          key: "med:chronic_kidney_disease",
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
          key: "med:height",
          label: t("filters.height"),
          type: "checkbox",
          value: null,
        },
        {
          key: "med:waist_hip_ratio",
          label: t("filters.waist_hip_ratio"),
          type: "checkbox",
          value: null,
        },
        {
          key: "med:waist_height_ratio",
          label: t("filters.waist_height_ratio"),
          type: "checkbox",
          value: null,
        },
        {
          key: "med:sbp",
          label: t("filters.sbp"),
          type: "checkbox",
          value: null,
        },
      ],
    },
    {
      key: "lifestyle_habits",
      label: t("filters.lifestyle_habits"),
      items: [
        {
          key: "med:smoking_history",
          label: t("filters.smoking_history"),
          type: "checkbox",
          value: null,
        },
      ],
    },
    {
      key: "distribution",
      label: t("filters.distribution"),
      items: [
        {
          key: "distribution_csv",
          label: t("filters.distribution_csv"),
          type: "checkbox",
          value: null,
        },
        {
          key: "distribution_dicom",
          label: t("filters.distribution_dicom"),
          type: "checkbox",
          value: null,
        },
        {
          key: "distribution_mmio",
          label: t("filters.distribution_mmio"),
          type: "checkbox",
          value: null,
        },
      ],
    },
    {
      key: "catalog",
      label: t("filters.catalog"),
      items: [
        {
          key: "isShared",
          label: t("filters.is_shared"),
          type: "checkbox",
          value: null,
        },
      ],
    }
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
