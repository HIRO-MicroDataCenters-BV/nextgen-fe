import type { JsonLdNode, JsonLdNodeType, FieldDefinition } from '../types/editor.types';
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
            if ('@value' in obj) return 'string'; // bare {@value} without @type/@language
            if ('@id' in obj) {
                // URI reference only when @id is the sole domain key (may have @type/@context alongside)
                const domainKeys = Object.keys(obj).filter(k => k !== '@type' && k !== '@context');
                if (domainKeys.length === 1) return 'uri';
            }
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
        context: 'dataset' | 'distribution' = 'dataset',
        parentChildSchema?: Record<string, FieldDefinition>
    ): JsonLdNode[] => {
        const nodes: JsonLdNode[] = [];

        for (const [key, value] of Object.entries(data)) {
            if (key === '@context') continue;

            const fieldDef = parentChildSchema?.[key] ?? getFieldDefinition(key, context);
            const detectedType = detectType(value);

            // Schema type takes priority for leaf nodes — ensures validation uses the correct
            // type even when the actual value doesn't match (e.g. an invalid URI typed as string
            // by detectType). Structural types (object, array, language-string) are always
            // determined from the data shape so they parse correctly regardless of schema.
            const STRUCTURAL_TYPES: JsonLdNodeType[] = ['object', 'array', 'language-string'];
            const type: JsonLdNodeType = (
                fieldDef?.type &&
                !STRUCTURAL_TYPES.includes(detectedType) &&  // data shape wins for structures
                fieldDef.type !== 'array' && fieldDef.type !== 'object'  // schema object/array need data shape
            ) ? fieldDef.type as JsonLdNodeType : detectedType;

            const node: JsonLdNode = {
                id: generateId(),
                key,
                type,
                metadata: {
                    required: fieldDef?.required ?? false,
                    readonly: fieldDef?.readonly ?? false,
                    repeatable: fieldDef?.repeatable ?? false,
                    label: fieldDef?.label,
                    category: fieldDef?.category,
                    xsdType: fieldDef?.xsdType,
                    description: fieldDef?.description,
                    placeholder: fieldDef?.placeholder,
                    hidden: fieldDef?.hidden ?? false,
                    autoGenerate: fieldDef?.autoGenerate ?? false,
                    defaultValue: fieldDef?.defaultValue,
                    vocabulary: fieldDef?.vocabulary,
                    dcatApCompliance: fieldDef?.dcatApCompliance,
                    format: fieldDef?.format,
                    icon: fieldDef?.icon,
                },
            };

            if (type === 'object') {
                const objValue = value as Record<string, unknown>;
                node.children = parseJsonLdToTree(objValue, key, context, fieldDef?.children as Record<string, FieldDefinition> | undefined);
            } else if (type === 'array') {
                const arrValue = value as unknown[];

                /**
                 * DCAT-AP 3 array parsing rules:
                 *
                 * "Typed literal" items  → { "@type": "xsd:...", "@value": ... }
                 *                          or { "@language": "en", "@value": ... }
                 *   These are leaf values — store the whole array as node.value.
                 *
                 * "Resource / concept" items → have @id, or namespace-prefixed keys
                 *   beyond the literal set.  These are nested objects — expand into
                 *   children so the editor can render them recursively.
                 *
                 * Hardcoded overrides:
                 *   dcat:distribution  → always children (distribution context)
                 *   dspace:extraMetadata → always children (readonly)
                 */
                const LITERAL_KEYS = new Set(['@type', '@value', '@language', '@id']);
                const isResourceObject = (item: unknown): boolean => {
                    if (typeof item !== 'object' || item === null) return false;
                    const obj = item as Record<string, unknown>;
                    // Typed literal: only @type + @value  (e.g. xsd:string)
                    const keys = Object.keys(obj);
                    if (keys.every(k => LITERAL_KEYS.has(k))) {
                        // It's a typed/language literal → treat as leaf value
                        // UNLESS it also has @id which signals a URI resource
                        return '@id' in obj && keys.length > 1;
                    }
                    // Has namespace-prefixed keys → real nested resource
                    return keys.some(k => k.includes(':') && !k.startsWith('@'));
                };

                if (fieldDef?.distributionContext) {
                    // Schema declares that this array's items should be parsed in distribution context
                    // (e.g. dcat:distribution → distributionContext: true in schema)
                    node.children = arrValue
                        .filter(item => typeof item === 'object' && item !== null)
                        .map((item, index) => ({
                            id: generateId(),
                            key: `[${index}]`,
                            type: 'object' as JsonLdNodeType,
                            children: parseJsonLdToTree(item as Record<string, unknown>, key, 'distribution'),
                            metadata: {
                                required: false,
                                readonly: fieldDef?.readonly ?? false,
                                repeatable: false,
                            },
                        }));
                } else if (arrValue.some(isResourceObject)) {
                    // Generic DCAT-AP 3 array of resources/concepts — expand as children
                    node.children = arrValue
                        .filter(item => typeof item === 'object' && item !== null)
                        .map((item, index) => ({
                            id: generateId(),
                            key: `[${index}]`,
                            type: 'object' as JsonLdNodeType,
                            children: parseJsonLdToTree(item as Record<string, unknown>, key, context, fieldDef?.children as Record<string, FieldDefinition> | undefined),
                            metadata: {
                                required: false,
                                readonly: false,
                                repeatable: false,
                            },
                        }));
                } else {
                    // Array of typed literals or plain primitives — store as value
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
                    } else if ('@id' in objValue) {
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
                if (key === 'dcat:distribution') {
                    // Distribution: serialize each child's children, auto-generate @id
                    result[key] = children.map((child, index) => {
                        const serialized = child.children
                            ? serializeTreeToJsonLd(child.children, undefined, 'distribution')
                            : {};
                        if (!serialized['@id']) {
                            const datasetId = result['@id'] as string || generateDatasetId();
                            serialized['@id'] = generateDistributionId(datasetId, index);
                        }
                        return serialized;
                    });
                } else {
                    // Generic DCAT-AP 3 array of resource objects (dcat:theme, dcatap:availability,
                    // dcat:accessService, dspace:extraMetadata, etc.) — serialize recursively
                    result[key] = children.map(child =>
                        child.children
                            ? serializeTreeToJsonLd(child.children, undefined, parentContext)
                            : (child.value ?? {})
                    );
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
                // URL fields store as plain string; @id-referenced nodes wrap back in {@id}
                const isUrlField = key.endsWith('URL') || key.endsWith('url')
                    || key === '@id'
                    || key === 'dcat:accessURL' || key === 'dcat:downloadURL'
                    || key === 'dcat:landingPage' || key === 'foaf:homepage'
                    || key === 'vcard:hasURL';
                if (isUrlField) {
                    result[key] = value;
                } else {
                    result[key] = { '@id': value };
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
