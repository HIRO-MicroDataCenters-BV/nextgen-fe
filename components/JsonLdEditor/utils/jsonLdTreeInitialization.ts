import type { JsonLdNode } from "../types/editor.types";
import { DCAT_AP_CONTEXT } from "../dcatApContext";

export const jsonLdNodeHasValue = (n: JsonLdNode): boolean => {
  if (n.value !== undefined && n.value !== null && n.value !== "") return true;
  if (n.children?.length) return n.children.some(jsonLdNodeHasValue);
  return false;
};

/** Marks nodes that carry file-upload values (without setting readonly). */
export const markJsonLdFileOriginNodes = (nodes: JsonLdNode[]): void => {
  for (const n of nodes) {
    if (jsonLdNodeHasValue(n)) {
      (n.metadata as unknown as Record<string, unknown>).fromFile = true;
    }
    if (n.children?.length) markJsonLdFileOriginNodes(n.children);
  }
};

export type ResolveParsedTreeOptions = {
  tree: JsonLdNode[];
  context: Record<string, string> | undefined;
  contentFromFile: boolean;
  buildDefaultDatasetTree: () => JsonLdNode[];
  isEmptyDataset: (tree: JsonLdNode[]) => boolean;
  mergeDatasetTreeWithDefaults: (tree: JsonLdNode[]) => JsonLdNode[];
};

export const resolveParsedJsonLdTree = ({
  tree,
  context,
  contentFromFile,
  buildDefaultDatasetTree,
  isEmptyDataset,
  mergeDatasetTreeWithDefaults,
}: ResolveParsedTreeOptions): {
  treeData: JsonLdNode[];
  preservedContext: Record<string, string>;
} => {
  let treeData: JsonLdNode[];

  if (isEmptyDataset(tree)) {
    const hiddenNodes = tree.filter(
      (n) => n.metadata.hidden || n.metadata.readonly,
    );
    treeData = [...buildDefaultDatasetTree(), ...hiddenNodes];
  } else {
    let next = tree;
    if (!contentFromFile) {
      next = mergeDatasetTreeWithDefaults(tree);
    }
    if (contentFromFile) {
      markJsonLdFileOriginNodes(next);
    }
    treeData = next;
  }

  const preservedContext = context
    ? { ...DCAT_AP_CONTEXT, ...context }
    : { ...DCAT_AP_CONTEXT };

  return { treeData, preservedContext };
};
