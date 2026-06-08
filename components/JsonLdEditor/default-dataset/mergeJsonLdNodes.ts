import type { JsonLdNode } from "../types/editor.types";

export function mergeJsonLdNodes(
  template: JsonLdNode,
  parsed: JsonLdNode | undefined,
): JsonLdNode {
  if (!parsed) {
    return structuredClone(template);
  }
  if (template.type === "object" && parsed.type === "object") {
    return {
      ...parsed,
      metadata: { ...template.metadata, ...parsed.metadata },
      children: mergeObjectChildrenByTemplate(template.children, parsed.children),
    };
  }
  if (template.type === "array" && parsed.type === "array") {
    const tc = template.children ?? [];
    const pc = parsed.children ?? [];
    const len = Math.max(tc.length, pc.length);
    const mergedChildren: JsonLdNode[] = [];
    for (let i = 0; i < len; i++) {
      const t = tc[i];
      const p = pc[i];
      if (t && p) mergedChildren.push(mergeJsonLdNodes(t, p));
      else if (t) mergedChildren.push(structuredClone(t));
      else if (p) mergedChildren.push(p);
    }
    return {
      ...parsed,
      metadata: { ...template.metadata, ...parsed.metadata },
      children: mergedChildren.map((c, i) => ({ ...c, key: `[${i}]` })),
    };
  }
  return {
    ...parsed,
    metadata: { ...template.metadata, ...parsed.metadata },
  };
}

export function mergeObjectChildrenByTemplate(
  templateChildren: JsonLdNode[] | undefined,
  parsedChildren: JsonLdNode[] | undefined,
): JsonLdNode[] {
  if (!templateChildren?.length) {
    return parsedChildren ? [...parsedChildren] : [];
  }
  const parsedMap = new Map(
    (parsedChildren ?? []).map((c) => [c.key, c] as const),
  );
  const merged: JsonLdNode[] = [];
  for (const tChild of templateChildren) {
    merged.push(mergeJsonLdNodes(tChild, parsedMap.get(tChild.key)));
  }
  for (const pChild of parsedChildren ?? []) {
    if (!templateChildren.some((t) => t.key === pChild.key)) {
      merged.push(pChild);
    }
  }
  return merged;
}
