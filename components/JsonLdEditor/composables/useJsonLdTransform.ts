import type { JsonLdNode, JsonLdNodeType } from '../types/editor.types';
import { useJsonLdSchema } from './useJsonLdSchema';
import { useIdGenerator } from '@/composables/useIdGenerator';

export function useJsonLdTransform() {
    const { getFieldDefinition } = useJsonLdSchema();
    const { generateDatasetId, generateDistributionId } = useIdGenerator();

    const generateId = (): string => {
        return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    const detectType = (value: unknown): JsonLdNodeType => {
        if (value === null || value === undefined) return 'string';
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'number') return 'number';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') {
            const obj = value as Record<string, unknown>;
            if ('@value' in obj && '@language' in obj) return 'language-string';
            if ('@value' in obj && '@type' in obj) {
                const xsdType = obj['@type'] as string;
                if (xsdType === 'xsd:dateTime' || xsdType === 'xsd:date') return 'date';
                if (xsdType === 'xsd:boolean') return 'boolean';
                if (xsdType === 'xsd:integer' || xsdType === 'xsd:nonNegativeInteger') return 'number';
            }
            if ('@id' in obj && Object.keys(obj).length === 1) return 'uri';
            return 'object';
        }
        if (typeof value === 'string') {
            if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) return 'date';
            if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('file://')) return 'uri';
            return 'string';
        }
        return 'string';
    };

    const parseJsonLdToTree = (
        data: Record<string, unknown>,
        _parentKey: string = '',
        context: 'dataset' | 'distribution' = 'dataset'
    ): JsonLdNode[] => {
        const nodes: JsonLdNode[] = [];

        for (const [key, value] of Object.entries(data)) {
            if (key === '@context') continue;

            const fieldDef = getFieldDefinition(key, context);
            const type = detectType(value);

            const node: JsonLdNode = {
                id: generateId(),
                key,
                type,
                metadata: {
                    required: fieldDef?.required ?? false,
                    readonly: fieldDef?.readonly ?? false,
                    repeatable: fieldDef?.repeatable ?? false,
                    xsdType: fieldDef?.xsdType,
                    description: fieldDef?.description,
                    placeholder: fieldDef?.placeholder,
                    hidden: fieldDef?.hidden ?? false,
                    autoGenerate: fieldDef?.autoGenerate ?? false,
                    defaultValue: fieldDef?.defaultValue,
                },
            };

            if (type === 'object') {
                const objValue = value as Record<string, unknown>;
                node.children = parseJsonLdToTree(objValue, key, context);
            } else if (type === 'array') {
                const arrValue = value as unknown[];
                if (key === 'dcat:distribution') {
                    node.children = arrValue
                        .filter(item => typeof item === 'object' && item !== null)
                        .map((item, index) => ({
                            id: generateId(),
                            key: `[${index}]`,
                            type: 'object' as JsonLdNodeType,
                            children: parseJsonLdToTree(item as Record<string, unknown>, key, 'distribution'),
                            metadata: {
                                required: false,
                                readonly: false,
                                repeatable: false,
                            },
                        }));
                } else if (key === 'dspace:extraMetadata') {
                    node.children = arrValue
                        .filter(item => typeof item === 'object' && item !== null)
                        .map((item, index) => ({
                            id: generateId(),
                            key: `[${index}]`,
                            type: 'object' as JsonLdNodeType,
                            children: parseJsonLdToTree(item as Record<string, unknown>, key, context),
                            metadata: {
                                required: false,
                                readonly: true,
                                repeatable: false,
                            },
                        }));
                } else {
                    node.value = arrValue;
                }
            } else if (type === 'language-string') {
                const langValue = value as { '@language': string; '@value': string };
                node.value = langValue;
                node.metadata.language = langValue['@language'];
            } else {
                // Handle other types
                if (typeof value === 'object' && value !== null) {
                    const objValue = value as Record<string, unknown>;
                    if ('@value' in objValue) {
                        node.value = objValue['@value'];
                    } else if ('@id' in objValue && Object.keys(objValue).length === 1) {
                        node.value = objValue['@id'];
                    } else {
                        node.value = value;
                    }
                } else {
                    // Primitive value (string, number, boolean)
                    node.value = value;
                }
            }

            nodes.push(node);
        }

        return nodes;
    };

    const serializeTreeToJsonLd = (
        nodes: JsonLdNode[],
        context?: Record<string, string>,
        parentContext?: 'dataset' | 'distribution'
    ): Record<string, unknown> => {
        const result: Record<string, unknown> = {};

        if (context) {
            result['@context'] = context;
        }

        // Auto-generate @id if marked as autoGenerate and not present
        const idNode = nodes.find(n => n.key === '@id');
        if (idNode?.metadata.autoGenerate && (!idNode.value || idNode.value === '')) {
            if (parentContext === 'distribution') {
                // For distributions, we need parent dataset ID - will be set by parent
                result['@id'] = generateDistributionId('temp', 0);
            } else {
                result['@id'] = generateDatasetId();
            }
        }

        // Always include @type even if hidden
        const typeNode = nodes.find(n => n.key === '@type');
        if (typeNode?.metadata.hidden && typeNode.metadata.defaultValue) {
            result['@type'] = typeNode.metadata.defaultValue;
        }

        for (const node of nodes) {
            const { key, type, value, children, metadata } = node;

            // Skip if already handled above
            if (key === '@id' && metadata.autoGenerate && (!value || value === '')) {
                continue;
            }
            if (key === '@type' && metadata.hidden) {
                continue; // Already added above
            }

            if (type === 'object' && children) {
                result[key] = serializeTreeToJsonLd(children, undefined, key === 'dcat:distribution' ? 'distribution' : parentContext);
            } else if (type === 'array' && children) {
                if (key === 'dcat:distribution' || key === 'dspace:extraMetadata') {
                    result[key] = children.map((child, index) => {
                        const serialized = child.children ? serializeTreeToJsonLd(child.children, undefined, 'distribution') : {};
                        // Auto-generate distribution IDs
                        if (key === 'dcat:distribution' && !serialized['@id']) {
                            const datasetId = result['@id'] as string || generateDatasetId();
                            serialized['@id'] = generateDistributionId(datasetId, index);
                        }
                        return serialized;
                    });
                } else {
                    result[key] = value;
                }
            } else if (type === 'language-string') {
                if (value && typeof value === 'object' && '@language' in value && '@value' in value) {
                    result[key] = value;
                } else if (typeof value === 'string') {
                    result[key] = {
                        '@language': metadata.language || 'en',
                        '@value': value,
                    };
                }
            } else if (type === 'boolean') {
                result[key] = {
                    '@type': metadata.xsdType || 'xsd:boolean',
                    '@value': Boolean(value),
                };
            } else if (type === 'number') {
                result[key] = {
                    '@type': metadata.xsdType || 'xsd:integer',
                    '@value': Number(value),
                };
            } else if (type === 'date') {
                result[key] = {
                    '@type': metadata.xsdType || 'xsd:dateTime',
                    '@value': value,
                };
            } else if (type === 'uri') {
                if (key.endsWith('URL') || key.endsWith('url') || key === '@id') {
                    result[key] = { '@id': value };
                } else {
                    result[key] = value;
                }
            } else if (type === 'string') {
                // Simple string value
                result[key] = value || '';
            } else {
                if (metadata.xsdType) {
                    result[key] = {
                        '@type': metadata.xsdType,
                        '@value': value,
                    };
                } else {
                    result[key] = value;
                }
            }
        }

        return result;
    };

    const parseJsonLd = (input: string | Record<string, unknown>): {
        tree: JsonLdNode[];
        context?: Record<string, string>;
    } => {
        let data: Record<string, unknown>;

        if (typeof input === 'string') {
            data = JSON.parse(input);
        } else {
            data = input;
        }

        const context = data['@context'] as Record<string, string> | undefined;
        const tree = parseJsonLdToTree(data);

        return { tree, context };
    };

    const serializeJsonLd = (
        tree: JsonLdNode[],
        context?: Record<string, string>,
        format: 'string' | 'object' = 'string'
    ): string | Record<string, unknown> => {
        const data = serializeTreeToJsonLd(tree, context);

        if (format === 'string') {
            return JSON.stringify(data, null, 2);
        }

        return data;
    };

    return {
        parseJsonLd,
        serializeJsonLd,
        parseJsonLdToTree,
        serializeTreeToJsonLd,
    };
}
