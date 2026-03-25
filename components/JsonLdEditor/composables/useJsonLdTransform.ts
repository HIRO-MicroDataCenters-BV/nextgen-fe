import type { JsonLdNode, JsonLdNodeType, FieldDefinition } from '../types/editor.types';
import { useJsonLdSchema } from './useJsonLdSchema';
import { useIdGenerator } from '@/composables/useIdGenerator';

export type SerializeTreeOptions = { omitEmpty?: boolean };

export function useJsonLdTransform() {
    const { getFieldDefinition, distributionSchema } = useJsonLdSchema();
    const { generateDatasetId, generateDistributionId } = useIdGenerator();

    const generateId = (): string => {
        return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    // Create an empty default node for a FieldDefinition (for hydrating missing schema fields)
    const createDefaultNode = (def: FieldDefinition): JsonLdNode => ({
        id: generateId(),
        key: def.key,
        type: def.type as JsonLdNodeType,
        value: def.type === 'object' ? undefined : (def.defaultValue ?? ''),
        children: def.type === 'object'
            ? Object.values(def.children ?? {}).map(c => createDefaultNode(c))
            : undefined,
        metadata: {
            required: def.required,
            readonly: def.readonly ?? false,
            repeatable: def.repeatable ?? false,
            label: def.label,
            hidden: def.hidden ?? false,
            placeholder: def.placeholder,
            description: def.description,
            defaultValue: def.defaultValue,
            vocabulary: def.vocabulary,
            format: def.format,
            icon: def.icon,
            dcatApCompliance: def.dcatApCompliance,
            xsdType: def.xsdType,
            category: def.category,
        },
    });

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

    /**
     * Resolve schema for a key. When inside a parent object, never fall back to top-level
     * technical @id/@type — getFieldDefinition('@id') would always match the dataset root @id.
     */
    const resolveFieldDefinition = (
        key: string,
        parentChildSchema: Record<string, FieldDefinition> | undefined,
        ctx: 'dataset' | 'distribution',
    ): FieldDefinition | undefined => {
        if (parentChildSchema && key in parentChildSchema) {
            return parentChildSchema[key];
        }
        if (parentChildSchema && (key === '@id' || key === '@type')) {
            return undefined;
        }
        return getFieldDefinition(key, ctx);
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

            const fieldDef = resolveFieldDefinition(key, parentChildSchema, context);
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
                    node.children = arrValue
                        .filter(item => typeof item === 'object' && item !== null)
                        .map((item, index) => {
                            const parsedChildren = parseJsonLdToTree(item as Record<string, unknown>, key, 'distribution');

                            // Merge with distribution schema defaults so missing fields are always visible
                            const parsedKeys = new Set(parsedChildren.map(c => c.key));
                            const schemaDefaults = Object.values(distributionSchema)
                                .filter(def => !parsedKeys.has(def.key))
                                .map(def => createDefaultNode(def));

                            return {
                                id: generateId(),
                                key: `[${index}]`,
                                type: 'object' as JsonLdNodeType,
                                children: [...parsedChildren, ...schemaDefaults],
                                metadata: {
                                    required: false,
                                    readonly: fieldDef?.readonly ?? false,
                                    repeatable: false,
                                },
                            };
                        });
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
        parentContext?: 'dataset' | 'distribution',
        options?: SerializeTreeOptions,
    ): Record<string, unknown> => {
        const omitEmpty = options?.omitEmpty !== false;
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
                const serialized = serializeTreeToJsonLd(children, undefined, parentContext, options);
                if (!omitEmpty) {
                    result[key] = serialized;
                } else {
                    const META_ONLY_KEYS = new Set(['@type', '@context', '@id']);
                    const meaningfulKeys = Object.keys(serialized).filter(k => {
                        if (META_ONLY_KEYS.has(k)) return false;
                        const v = serialized[k];
                        if (v === '' || v === null || v === undefined) return false;
                        if (typeof v === 'object' && !Array.isArray(v)) {
                            const obj = v as Record<string, unknown>;
                            if ('@id' in obj && (obj['@id'] === '' || obj['@id'] === null)) return false;
                            if ('@value' in obj && (obj['@value'] === '' || obj['@value'] === null)) return false;
                        }
                        return true;
                    });
                    if (meaningfulKeys.length > 0) {
                        result[key] = serialized;
                    }
                }
            } else if (type === 'array' && !children && Array.isArray(value) && key !== 'dcat:distribution') {
                const xsd = metadata.xsdType || 'xsd:string';
                const items = (value as unknown[]).map(v => {
                    if (v !== null && typeof v === 'object' && '@type' in v && '@value' in v) return v;
                    return { '@type': xsd, '@value': v };
                });
                const filtered = omitEmpty
                    ? items.filter(it => {
                        if (typeof it === 'object' && it !== null && '@value' in it) {
                            const vv = (it as Record<string, unknown>)['@value'];
                            return vv !== '' && vv != null;
                        }
                        return false;
                    })
                    : items;
                if (omitEmpty ? filtered.length > 0 : items.length > 0) {
                    result[key] = filtered;
                }
            } else if (type === 'array' && children) {
                if (key === 'dcat:distribution') {
                    // Distribution: serialize each child's children, auto-generate @id
                    result[key] = children.map((child, index) => {
                        const serialized = child.children
                            ? serializeTreeToJsonLd(child.children, undefined, 'distribution', options)
                            : {};
                        if (!serialized['@id']) {
                            const datasetId = result['@id'] as string || generateDatasetId();
                            serialized['@id'] = generateDistributionId(datasetId, index);
                        }
                        return serialized;
                    });
                } else {
                    const META_KEYS = new Set(['@type', '@context', '@id']);
                    const items = children.map(child => {
                        if (child.children) {
                            return serializeTreeToJsonLd(child.children, undefined, parentContext, options);
                        }
                        if (child.value !== '' && child.value != null) {
                            return child.metadata.xsdType
                                ? { '@type': child.metadata.xsdType, '@value': child.value }
                                : child.value;
                        }
                        if (!omitEmpty) {
                            return child.metadata.xsdType
                                ? { '@type': child.metadata.xsdType, '@value': '' }
                                : '';
                        }
                        return null;
                    });
                    const filtered = omitEmpty
                        ? items.filter(item => {
                            if (item === null || item === undefined || item === '') return false;
                            if (typeof item === 'object' && !Array.isArray(item)) {
                                const domainKeys = Object.keys(item as object).filter(k => !META_KEYS.has(k));
                                return domainKeys.length > 0 || ('@id' in (item as object) && (item as Record<string, unknown>)['@id'] !== '');
                            }
                            return true;
                        })
                        : items;
                    if (omitEmpty ? filtered.length > 0 : children.length > 0) {
                        result[key] = filtered;
                    }
                }
            } else if (type === 'language-string') {
                if (value && typeof value === 'object' && '@language' in value && '@value' in value) {
                    const lv = value as { '@language': string; '@value': string };
                    if (!omitEmpty || (lv['@value'] !== '' && lv['@value'] != null)) {
                        result[key] = value;
                    }
                } else if (typeof value === 'string') {
                    if (!omitEmpty || value !== '') {
                        result[key] = {
                            '@language': metadata.language || 'en',
                            '@value': value,
                        };
                    }
                } else if (!omitEmpty) {
                    result[key] = {
                        '@language': metadata.language || 'en',
                        '@value': '',
                    };
                }
            } else if (type === 'boolean') {
                result[key] = {
                    '@type': metadata.xsdType || 'xsd:boolean',
                    '@value': Boolean(value),
                };
            } else if (type === 'number') {
                const num = Number(value);
                if (num === 0 && metadata.xsdType === 'xsd:nonNegativeInteger') {
                    // Skip zero byteSize — UI placeholder, not meaningful data
                } else if (!isNaN(num)) {
                    result[key] = {
                        '@type': metadata.xsdType || 'xsd:integer',
                        '@value': num,
                    };
                } else if (!omitEmpty && metadata.xsdType) {
                    result[key] = {
                        '@type': metadata.xsdType,
                        '@value': '',
                    };
                }
            } else if (type === 'date') {
                if (value !== '' && value != null) {
                    result[key] = {
                        '@type': metadata.xsdType || 'xsd:dateTime',
                        '@value': value,
                    };
                } else if (!omitEmpty) {
                    result[key] = {
                        '@type': metadata.xsdType || 'xsd:dateTime',
                        '@value': '',
                    };
                }
            } else if (type === 'uri') {
                if (value !== '' && value != null) {
                    result[key] = key === '@id' ? value : { '@id': value };
                } else if (!omitEmpty && key !== '@id') {
                    result[key] = { '@id': '' };
                }
            } else if (type === 'string') {
                if (metadata.repeatable && Array.isArray(value)) {
                    const raw = value as unknown[];
                    const items = raw.map(v => {
                        if (v !== null && typeof v === 'object' && '@type' in v && '@value' in v) return v;
                        if (metadata.xsdType) return { '@type': metadata.xsdType, '@value': v };
                        return v;
                    });
                    const filtered = omitEmpty
                        ? items.filter(it => {
                            if (it === null || it === undefined) return false;
                            if (typeof it === 'object' && it !== null && '@value' in it) {
                                const vv = (it as Record<string, unknown>)['@value'];
                                return vv !== '' && vv != null;
                            }
                            return String(it) !== '';
                        })
                        : items;
                    if (omitEmpty ? filtered.length > 0 : raw.length > 0) {
                        result[key] = filtered;
                    }
                } else if (value !== '' && value != null) {
                    if (metadata.xsdType) {
                        result[key] = { '@type': metadata.xsdType, '@value': value };
                    } else {
                        result[key] = value;
                    }
                } else if (!omitEmpty) {
                    result[key] = metadata.xsdType
                        ? { '@type': metadata.xsdType, '@value': '' }
                        : '';
                }
            } else {
                if (metadata.xsdType) {
                    if (!omitEmpty || (value !== '' && value != null)) {
                        result[key] = {
                            '@type': metadata.xsdType,
                            '@value': value ?? '',
                        };
                    }
                } else if (value !== '' && value != null) {
                    result[key] = value;
                } else if (!omitEmpty) {
                    result[key] = '';
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
        format: 'string' | 'object' = 'string',
        serializeOptions?: SerializeTreeOptions,
    ): string | Record<string, unknown> => {
        const data = serializeTreeToJsonLd(tree, context, undefined, serializeOptions);

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
        createDefaultNode,
    };
}
