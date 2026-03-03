import { useJsonLdSchema } from './useJsonLdSchema';
import { useJsonLdTransform } from './useJsonLdTransform';
import type { JsonLdNode, JsonLdNodeType, FieldDefinition } from '../types/editor.types';

/**
 * Builds the default DCAT-AP 3 dataset tree with mandatory and recommended
 * fields pre-populated as empty nodes so the editor never starts blank.
 */
export function useDefaultDataset() {
    const { datasetSchema, distributionSchema } = useJsonLdSchema();
    const { createDefaultNode } = useJsonLdTransform();

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

    return { buildDefaultDatasetTree, isEmptyDataset };
}
