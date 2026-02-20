import { useJsonLdSchema } from './useJsonLdSchema';
import type { JsonLdNode, JsonLdNodeType } from '../types/editor.types';

/**
 * Builds the default DCAT-AP 3 dataset tree with mandatory and recommended
 * fields pre-populated as empty nodes so the editor never starts blank.
 */
export function useDefaultDataset() {
    const { datasetSchema } = useJsonLdSchema();

    const makeId = () =>
        `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const buildNode = (key: string): JsonLdNode | null => {
        const def = datasetSchema[key];
        if (!def || def.hidden) return null;

        const children: JsonLdNode[] = def.children
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
                    },
                }))
            : [];

        return {
            id: makeId(),
            key: def.key,
            type: def.type as JsonLdNodeType,
            value: (def.type === 'object' || def.type === 'array') ? undefined : '',
            children: def.type === 'object' && children.length > 0
                ? children
                : def.type === 'array'
                    ? []
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
