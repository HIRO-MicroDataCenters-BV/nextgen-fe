import { computed, type Ref } from "vue";
import type { JsonLdNode } from "../types/editor.types";

const isNodeFilled = (node: JsonLdNode): boolean => {
  if (node.value === undefined || node.value === null || node.value === "") {
    return !!node.children?.length;
  }
  if (typeof node.value === "object" && !Array.isArray(node.value)) {
    const value = node.value as Record<string, unknown>;
    if ("@value" in value) return value["@value"] !== "" && value["@value"] !== undefined;
  }
  return true;
};

export const useMandatoryProgress = (treeData: Ref<JsonLdNode[]>) => {
  const mandatoryNodes = computed(() =>
    treeData.value.filter(
      (node) =>
        node.metadata.dcatApCompliance === "mandatory" &&
        !node.metadata.hidden &&
        !node.metadata.readonly,
    ),
  );

  const mandatoryProgress = computed(() => {
    const total = mandatoryNodes.value.length;
    const filled = mandatoryNodes.value.filter(isNodeFilled).length;
    const pct = total === 0 ? 100 : Math.round((filled / total) * 100);
    return { total, filled, pct };
  });

  const complianceScore = computed(() => mandatoryProgress.value.pct);

  const progressColorClass = computed(() => {
    const pct = mandatoryProgress.value.pct;
    if (pct === 100) return "progress--green";
    if (pct >= 60) return "progress--amber";
    return "progress--red";
  });

  return {
    mandatoryProgress,
    complianceScore,
    progressColorClass,
  };
};
