import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";
import type { JsonLdNode } from "../types/editor.types";

interface UseJsonLdNodeEffectsOptions {
  node: Ref<JsonLdNode>;
  emitUpdate: (node: JsonLdNode) => void;
}

export const useJsonLdNodeEffects = (options: UseJsonLdNodeEffectsOptions) => {
  const nodeRef = ref<HTMLElement | null>(null);
  const isFlashing = ref(false);
  const isNewlyAdded = ref(false);

  const flashHighlight = () => {
    isFlashing.value = true;
    setTimeout(() => {
      isFlashing.value = false;
    }, 1400);
  };

  onMounted(() => {
    nodeRef.value?.addEventListener("flash-field", flashHighlight);
  });

  onUnmounted(() => {
    nodeRef.value?.removeEventListener("flash-field", flashHighlight);
  });

  watch(
    () => options.node.value.metadata.isNew,
    (isNew) => {
      if (!isNew) return;
      isNewlyAdded.value = true;
      setTimeout(() => {
        nodeRef.value?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 80);
      setTimeout(() => {
        isNewlyAdded.value = false;
        options.emitUpdate({
          ...options.node.value,
          metadata: { ...options.node.value.metadata, isNew: false },
        });
      }, 2500);
    },
    { immediate: true },
  );

  return {
    nodeRef,
    isFlashing,
    isNewlyAdded,
    flashHighlight,
  };
};
