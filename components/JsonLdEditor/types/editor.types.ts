export type JsonLdNodeType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'date' | 'uri' | 'language-string';

export type XsdType =
    | 'xsd:string'
    | 'xsd:boolean'
    | 'xsd:dateTime'
    | 'xsd:date'
    | 'xsd:nonNegativeInteger'
    | 'xsd:integer'
    | 'xsd:hexBinary';

export type DcatApCompliance = 'mandatory' | 'recommended' | 'optional';

export type ControlledVocabulary =
    | 'accessRights'
    | 'language'
    | 'algorithm'
    | 'theme'
    | 'frequency'
    | 'fileType'
    | 'licenseType'
    | 'availability';

export interface JsonLdNodeMetadata {
    required: boolean;
    readonly: boolean;
    repeatable: boolean;
    label?: string; // Friendly display label (from schema)
    category?: string; // DCAT-AP category for grouping
    isNew?: boolean;
    xsdType?: XsdType;
    language?: string;
    description?: string;
    placeholder?: string;
    hidden?: boolean;
    autoGenerate?: boolean;
    defaultValue?: unknown;
    vocabulary?: ControlledVocabulary;
    dcatApCompliance?: DcatApCompliance;
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
    hidden?: boolean;
    autoGenerate?: boolean;
    category?: string;
    vocabulary?: ControlledVocabulary;
    dcatApCompliance?: DcatApCompliance;
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
