import type { JsonLdNode } from "../types/editor.types";

/**
 * Recursively normalizes array item keys and preserves object references
 * when nothing changed to reduce unnecessary reactive churn.
 */
export const updateJsonLdArrayIndices = (nodes: JsonLdNode[]): JsonLdNode[] => {
  let changed = false;

  const mapped = nodes.map((node) => {
    if (node.type === "array" && node.children) {
      let childChanged = false;
      const updatedChildren = node.children.map((child, index) => {
        const normalizedChildren = child.children
          ? updateJsonLdArrayIndices(child.children)
          : child.children;
        const nextKey = `[${index}]`;
        const keyChanged = child.key !== nextKey;
        const nestedChanged = normalizedChildren !== child.children;
        if (keyChanged || nestedChanged) {
          childChanged = true;
          return {
            ...child,
            key: nextKey,
            children: normalizedChildren,
          };
        }
        return child;
      });

      if (childChanged) {
        changed = true;
        return {
          ...node,
          children: updatedChildren,
        };
      }

      return node;
    }

    if (node.children) {
      const normalizedChildren = updateJsonLdArrayIndices(node.children);
      if (normalizedChildren !== node.children) {
        changed = true;
        return {
          ...node,
          children: normalizedChildren,
        };
      }
    }

    return node;
  });

  return changed ? mapped : nodes;
};
