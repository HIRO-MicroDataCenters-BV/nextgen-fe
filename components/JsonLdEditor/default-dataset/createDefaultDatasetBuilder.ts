import type {
  FieldDefinition,
  JsonLdNode,
  JsonLdNodeType,
} from "../types/editor.types";
import { DCAT_AP_CONTEXT } from "../dcatApContext";
import type { SerializeTreeOptions } from "../composables/createJsonLdTransform";
import { MINIMAL_DEFAULT_DATASET_KEYS } from "./constants";
import { mergeJsonLdNodes } from "./mergeJsonLdNodes";

export type DefaultDatasetDeps = {
  datasetSchema: Record<string, FieldDefinition>;
  distributionSchema: Record<string, FieldDefinition>;
  createDefaultNode: (def: FieldDefinition) => JsonLdNode;
  serializeJsonLd: (
    tree: JsonLdNode[],
    context?: Record<string, string>,
    format?: "string" | "object",
    serializeOptions?: SerializeTreeOptions,
  ) => string | Record<string, unknown>;
};

export function createDefaultDatasetBuilder(deps: DefaultDatasetDeps) {
  const { datasetSchema, distributionSchema, createDefaultNode, serializeJsonLd } =
    deps;

  const makeId = () =>
    `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const clearDctermsTypeDefaults = (nodes: JsonLdNode[]): void => {
    const typeNode = nodes.find((n) => n.key === "dcterms:type");
    if (!typeNode?.children) return;
    for (const ch of typeNode.children) {
      if (ch.key === "@id") {
        ch.value = "";
      }
      if (ch.key === "skos:prefLabel") {
        ch.value = { "@language": "en", "@value": "" };
      }
    }
  };

  const buildArrayItem = (def: FieldDefinition, index: number): JsonLdNode => {
    const childSchema: Record<string, FieldDefinition> = def.distributionContext
      ? distributionSchema
      : (def.children ?? {});

    const children = Object.values(childSchema).map((childDef) =>
      createDefaultNode(childDef),
    );

    return {
      id: makeId(),
      key: `[${index}]`,
      type: "object" as JsonLdNodeType,
      children,
      metadata: {
        required: false,
        readonly: def.readonly ?? false,
        repeatable: false,
      },
    };
  };

  const buildNode = (key: string): JsonLdNode | null => {
    const def = datasetSchema[key];
    if (!def || def.hidden) return null;

    const isObject = def.type === "object";
    const isArray = def.type === "array";

    const objectChildren: JsonLdNode[] =
      isObject && def.children
        ? Object.values(def.children)
            .filter((c) => !c.hidden)
            .map(
              (childDef): JsonLdNode => ({
                id: makeId(),
                key: childDef.key,
                type: childDef.type as JsonLdNodeType,
                value:
                  childDef.type === "object"
                    ? undefined
                    : (childDef.defaultValue ?? ""),
                children: childDef.type === "object" ? [] : undefined,
                metadata: {
                  required: childDef.required,
                  readonly: childDef.readonly,
                  repeatable: childDef.repeatable,
                  label: childDef.label,
                  hidden: childDef.hidden ?? false,
                  placeholder: childDef.placeholder,
                  description: childDef.description,
                  defaultValue: childDef.defaultValue,
                  vocabulary: childDef.vocabulary,
                  format: childDef.format,
                  icon: childDef.icon,
                  dcatApCompliance: childDef.dcatApCompliance,
                  xsdType: childDef.xsdType,
                },
              }),
            )
        : [];

    const arrayChildren: JsonLdNode[] = isArray ? [buildArrayItem(def, 0)] : [];

    return {
      id: makeId(),
      key: def.key,
      type: def.type as JsonLdNodeType,
      value: isObject || isArray ? undefined : "",
      children:
        isObject && objectChildren.length > 0
          ? objectChildren
          : isArray
            ? arrayChildren
            : undefined,
      metadata: {
        required: def.required,
        readonly: def.readonly,
        repeatable: def.repeatable,
        label: def.label,
        category: def.category,
        description: def.description,
        placeholder: def.placeholder,
        vocabulary: def.vocabulary,
        dcatApCompliance: def.dcatApCompliance,
        icon: def.icon,
        xsdType: def.xsdType,
      },
    };
  };

  const buildDefaultDatasetTree = (): JsonLdNode[] => {
    const tree = MINIMAL_DEFAULT_DATASET_KEYS.flatMap((k) => {
      const n = buildNode(k);
      return n ? [n] : [];
    });
    clearDctermsTypeDefaults(tree);
    return tree;
  };

  const isEmptyDataset = (tree: JsonLdNode[]): boolean =>
    tree.filter((n) => !n.metadata.hidden && !n.metadata.readonly).length ===
    0;

  const mergeDatasetTreeWithDefaults = (
    parsedTree: JsonLdNode[],
  ): JsonLdNode[] => {
    const defaultTree = buildDefaultDatasetTree();
    const defaultKeys = new Set(defaultTree.map((n) => n.key));
    const parsedByKey = new Map(parsedTree.map((n) => [n.key, n] as const));
    const merged: JsonLdNode[] = [];
    for (const templateNode of defaultTree) {
      merged.push(
        mergeJsonLdNodes(templateNode, parsedByKey.get(templateNode.key)),
      );
    }
    for (const n of parsedTree) {
      if (!defaultKeys.has(n.key)) {
        merged.push(n);
      }
    }
    return merged;
  };

  const buildDefaultMetadataContentObject = (): Record<string, unknown> => {
    const tree = buildDefaultDatasetTree();
    const data = serializeJsonLd(tree, DCAT_AP_CONTEXT, "object", {
      omitEmpty: false,
    }) as Record<string, unknown>;
    if (typeof data["@type"] !== "string") {
      data["@type"] = "dcat:Dataset";
    }
    data["@id"] = "";

    const kw = data["dcat:keyword"];
    if (!Array.isArray(kw)) {
      data["dcat:keyword"] = [{ "@type": "xsd:string", "@value": "" }];
    }

    const dist = data["dcat:distribution"];
    if (Array.isArray(dist)) {
      for (const item of dist) {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          (item as Record<string, unknown>)["@id"] = "";
        }
      }
    }

    return data;
  };

  return {
    buildDefaultDatasetTree,
    isEmptyDataset,
    mergeDatasetTreeWithDefaults,
    buildDefaultMetadataContentObject,
  };
}
