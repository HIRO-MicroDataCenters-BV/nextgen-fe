import type { Ref } from "vue";

export const useErrorNavigation = (editorContentRef: Ref<HTMLElement | null>) => {
  const findErrorEl = (errorPath: string): Element | null => {
    const root = editorContentRef.value;
    if (!root) return null;
    const candidates: string[] = [];
    let path = errorPath;
    while (path) {
      candidates.push(path);
      const dot = path.lastIndexOf(".");
      path = dot > -1 ? path.slice(0, dot) : "";
    }
    const allNodes = Array.from(root.querySelectorAll("[data-node-path]"));
    for (const candidate of candidates) {
      const el = allNodes.find(
        (node) => node.getAttribute("data-node-path") === candidate,
      );
      if (el) return el;
    }
    return null;
  };

  const canScrollToError = (errorPath: string): boolean => !!findErrorEl(errorPath);

  const scrollToError = (errorPath: string) => {
    const el = findErrorEl(errorPath);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.dispatchEvent(new CustomEvent("flash-field", { bubbles: false }));
  };

  return {
    canScrollToError,
    scrollToError,
  };
};
