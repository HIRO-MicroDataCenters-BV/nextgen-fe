import { useJsonLdSchema } from './useJsonLdSchema';
import { useJsonLdTransform } from './useJsonLdTransform';
import type { JsonLdNode, JsonLdNodeType, FieldDefinition } from '../types/editor.types';
import { DCAT_AP_CONTEXT } from '../dcatApContext';

/**
 * Builds the default DCAT-AP 3 dataset tree with mandatory and recommended
 * fields pre-populated as empty nodes so the editor never starts blank.
 */
function mergeJsonLdNodes(template: JsonLdNode, parsed: JsonLdNode | undefined): JsonLdNode {
    if (!parsed) {
        return structuredClone(template);
    }
    if (template.type === 'object' && parsed.type === 'object') {
        return {
            ...parsed,
            metadata: { ...template.metadata, ...parsed.metadata },
            children: mergeObjectChildrenByTemplate(template.children, parsed.children),
        };
    }
    if (template.type === 'array' && parsed.type === 'array') {
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

function mergeObjectChildrenByTemplate(
    templateChildren: JsonLdNode[] | undefined,
    parsedChildren: JsonLdNode[] | undefined,
): JsonLdNode[] {
    if (!templateChildren?.length) {
        return parsedChildren ? [...parsedChildren] : [];
    }
    const parsedMap = new Map((parsedChildren ?? []).map(c => [c.key, c] as const));
    const merged: JsonLdNode[] = [];
    for (const tChild of templateChildren) {
        merged.push(mergeJsonLdNodes(tChild, parsedMap.get(tChild.key)));
    }
    for (const pChild of parsedChildren ?? []) {
        if (!templateChildren.some(t => t.key === pChild.key)) {
            merged.push(pChild);
        }
    }
    return merged;
}

export function useDefaultDataset() {
    const { datasetSchema, distributionSchema } = useJsonLdSchema();
    const { createDefaultNode, serializeJsonLd } = useJsonLdTransform();

    const makeId = () =>
        `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    /**
     * Build a single empty array item node, seeded with schema children.
     * For distributionContext arrays, children come from distributionSchema.
     */
    const buildArrayItem = (def: FieldDefinition, index: number): JsonLdNode => {
        const childSchema: Record<string, FieldDefinition> = def.distributionContext
            ? distributionSchema
            : (def.children ?? {});

        const children = Object.values(childSchema).map(childDef => createDefaultNode(childDef));

        return {
            id: makeId(),
            key: `[${index}]`,
            type: 'object' as JsonLdNodeType,
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

        const isObject = def.type === 'object';
        const isArray = def.type === 'array';

        // For object types: build children from def.children (excludes hidden)
        const objectChildren: JsonLdNode[] = isObject && def.children
            ? Object.values(def.children)
                .filter(c => !c.hidden)
                .map((childDef): JsonLdNode => ({
                    id: makeId(),
                    key: childDef.key,
                    type: childDef.type as JsonLdNodeType,
                    value: childDef.type === 'object' ? undefined : (childDef.defaultValue ?? ''),
                    children: childDef.type === 'object' ? [] : undefined,
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
                }))
            : [];

        // For array types: seed one empty item with schema children
        const arrayChildren: JsonLdNode[] = isArray
            ? [buildArrayItem(def, 0)]
            : [];

        return {
            id: makeId(),
            key: def.key,
            type: def.type as JsonLdNodeType,
            value: (isObject || isArray) ? undefined : '',
            children: isObject && objectChildren.length > 0
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

    /** Returns a pre-populated tree with DCAT-AP 3 mandatory + recommended fields. */
    const buildDefaultDatasetTree = (): JsonLdNode[] => {
        const keys = [
            'dcterms:title',
            'dcterms:description',
            'dcterms:identifier',
            'dcat:keyword',
            'dcat:theme',
            'dcterms:publisher',
            'dcterms:modified',
            'dcterms:language',
            'dcterms:spatial',
            'dcat:contactPoint',
            'dcterms:accessRights',
        ];
        return keys.flatMap(k => {
            const n = buildNode(k);
            return n ? [n] : [];
        });
    };

    /** True when the tree has no visible, editable fields (i.e. it's a new dataset). */
    const isEmptyDataset = (tree: JsonLdNode[]): boolean =>
        tree.filter(n => !n.metadata.hidden && !n.metadata.readonly).length === 0;

    /**
     * Merges a sparse parse result (e.g. after JSON mode) with the default DCAT field tree
     * so optional empty fields stay visible. Skipped when metadata came from an uploaded file.
     */
    const mergeDatasetTreeWithDefaults = (parsedTree: JsonLdNode[]): JsonLdNode[] => {
        const defaultTree = buildDefaultDatasetTree();
        const defaultKeys = new Set(defaultTree.map(n => n.key));
        const parsedByKey = new Map(parsedTree.map(n => [n.key, n] as const));
        const merged: JsonLdNode[] = [];
        for (const templateNode of defaultTree) {
            merged.push(mergeJsonLdNodes(templateNode, parsedByKey.get(templateNode.key)));
        }
        for (const n of parsedTree) {
            if (!defaultKeys.has(n.key)) {
                merged.push(n);
            }
        }
        return merged;
    };

    /** Full default metadata object for create forms (all template keys + @context, @type). */
    const buildDefaultMetadataContentObject = (): Record<string, unknown> => {
        const tree = buildDefaultDatasetTree();
        const data = serializeJsonLd(tree, DCAT_AP_CONTEXT, 'object', { omitEmpty: false }) as Record<string, unknown>;
        if (typeof data['@type'] !== 'string') {
            data['@type'] = 'dcat:Dataset';
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
