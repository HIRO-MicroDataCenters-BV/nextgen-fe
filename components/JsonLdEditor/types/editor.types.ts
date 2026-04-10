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
    label?: string;
    category?: string;
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
    /** Input format hint — drives field renderer without key-based if/else */
    format?: 'email' | 'tel' | 'url' | 'hex';
    /** Lucide icon name for this field */
    icon?: string;
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
    /** Input format hint — drives field renderer and validation without key-based if/else */
    format?: 'email' | 'tel' | 'url' | 'hex';
    /** Lucide icon name shown in the editor */
    icon?: string;
    /** When true, child arrays are parsed in 'distribution' context */
    distributionContext?: boolean;
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
