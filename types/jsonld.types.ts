/**
 * Basic JSON-LD value types
 */
export interface JsonLdStringValue {
  "@type": "xsd:string";
  "@value": string;
}

export interface JsonLdBooleanValue {
  "@type": "xsd:boolean";
  "@value": string;
}

export interface JsonLdLongValue {
  "@type": "xsd:long";
  "@value": string;
}

export interface JsonLdLanguageValue {
  "@language": string;
  "@value": string;
}

/**
 * Complex JSON-LD object types
 */
export interface JsonLdPublisher {
  "@id": string;
  "@type": "foaf:Person";
  "dcterms:identifier": JsonLdStringValue;
  "foaf:name": JsonLdStringValue;
}

export interface JsonLdTheme {
  "@id": string;
  "@type": "skos:Concept";
  "skos:prefLabel": JsonLdLanguageValue;
}

export interface JsonLdDistribution {
  "@id": string;
  "@type": "dcat:Distribution";
  "dcatap:availability": {
    "@id": string;
    "@type": "skos:Concept";
    "skos:prefLabel": JsonLdLanguageValue;
  };
  "dcterms:description": JsonLdLanguageValue;
  "dcat:accessURL": { "@id": string };
  "dcat:byteSize": JsonLdLongValue;
  "dcat:format": JsonLdStringValue;
}

/**
 * Transformed dataset metadata interface
 */
export interface DatasetMetadata {
  id: string;
  name: string;
  description: string;
  biobank: string;
  last_update: string;
  issued: string;
  publisher: string;
  license: string;
  isDeleted: boolean;
  isShared: boolean;
  metadataFilename: string;
  keyword: string;
  themes: string[];
  distribution: {
    availability: string;
    description: string;
    accessURL: string;
    byteSize: string;
    format: string;
  } | null;
}

/**
 * JSON-LD response types
 */
export interface JsonLdResponse {
  "@context": {
    "@vocab": string;
    [key: string]: string;
  };
  "@graph": JsonLdObject[];
}

export interface JsonLdObject {
  "@id": string;
  "@type": string | string[];
  [key: string]: any;
}

export interface JsonLdValue {
  "@type"?: string;
  "@language"?: string;
  "@value": string;
}

/**
 * Search filter types
 */
export interface SearchFilter {
  "@context": {
    "@vocab": string;
    dcat: string;
    dcterms: string;
    dspace: string;
  };
  "@type": "Filters";
  filters: Array<{
    "@type": string;
    [key: string]: unknown;
  }>;
}
