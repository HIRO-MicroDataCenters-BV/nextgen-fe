export type JsonLdNodeType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'date' | 'uri' | 'language-string';

export type XsdType =
    | 'xsd:string'
    | 'xsd:boolean'
    | 'xsd:dateTime'
    | 'xsd:date'
    | 'xsd:nonNegativeInteger'
    | 'xsd:integer'
    | 'xsd:hexBinary';

export interface JsonLdNodeMetadata {
    required: boolean;
    readonly: boolean;
    repeatable: boolean;
    isNew?: boolean;
    xsdType?: XsdType;
    language?: string;
    description?: string;
    placeholder?: string;
}

export interface JsonLdNode {
    id: string;
    key: string;
    type: JsonLdNodeType;
    value?: unknown;
    children?: JsonLdNode[];
    metadata: JsonLdNodeMetadata;
}

export interface FieldDefinition {
    key: string;
    label: string;
    type: JsonLdNodeType;
    xsdType?: XsdType;
    required: boolean;
    readonly: boolean;
    repeatable: boolean;
    description?: string;
    placeholder?: string;
    children?: Record<string, FieldDefinition>;
    validation?: (value: unknown) => boolean | string;
    defaultValue?: unknown;
}

export interface JsonLdEditorProps {
    modelValue: string | Record<string, unknown>;
    readonly?: boolean;
    context?: Record<string, string>;
    initialMode?: 'visual' | 'code';
}

export type EditorMode = 'visual' | 'code';

export interface ValidationError {
    path: string;
    message: string;
    severity: 'error' | 'warning';
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}
