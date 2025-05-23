export interface JsonLdContext {
  "@vocab"?: string;
  [key: string]: string | undefined;
}

export interface JsonLdValue {
  "@value": string;
  "@language"?: string;
  "@type"?: string;
}

export interface JsonLdObject {
  "@id"?: string;
  "@type"?: string;
  "@value"?: string;
  "@context"?: JsonLdContext;
  [key: string]: unknown;
}

export interface SearchFilter {
  "@context": JsonLdContext;
  "@type": "Filters";
  filters: Array<JsonLdObject>;
}

export interface SearchResponse {
  "@context": JsonLdContext;
  "@type": string;
  results: JsonLdObject[];
  metadata?: {
    total: number;
    page: number;
    pageSize: number;
    catalogs: Array<{
      id: string;
      status: "success" | "error";
      error?: string;
    }>;
  };
}

export interface CatalogDataset extends JsonLdObject {
  "@type": "dcat:Dataset";
  "dcterms:identifier": JsonLdValue;
  "dcterms:title": JsonLdValue[];
  "dcterms:description": JsonLdValue[];
  "dcat:keyword": JsonLdValue[];
  "dcterms:license": JsonLdValue;
  "dcat:theme": Array<{
    "@id": string;
    "@type": "skos:Concept";
    "skos:prefLabel": JsonLdValue;
  }>;
  "dcat:distribution": Array<{
    "@id": string;
    "@type": "dcat:Distribution";
    "dcterms:description": JsonLdValue;
    "dcat:byteSize": JsonLdValue;
    "dcat:mediaType": {
      "@id": string;
    };
    "dcat:format": JsonLdValue;
    "dcatap:availability": Array<{
      "@id": string;
    }>;
    "spdx:checksum": {
      "spdx:algorithm": JsonLdValue;
      "spdx:checksumValue": JsonLdValue;
    };
    "dcat:accessURL": {
      "@id": string;
    };
    "dcat:accessService": Array<{
      "@id": string;
      "@type": "dcat:DataService";
      "dcterms:title": JsonLdValue;
      "dcat:endpointURL": {
        "@id": string;
      };
    }>;
  }>;
  "dcat:inSeries": {
    "@id": string;
  };
  "dspace:extraMetadata": JsonLdObject;
  "dcterms:issued": JsonLdValue;
  "dcterms:publisher": {
    "@id": string;
    "@type": "foaf:Agent";
    "foaf:name": string;
  };
  "dspace:isShared": JsonLdValue;
  "dspace:isDeleted": JsonLdValue;
  "dspace:metadataFilename": JsonLdValue;
}

export interface CatalogResponse extends JsonLdObject {
  "@type": "dcat:Catalog";
  "dcterms:title": JsonLdValue;
  "dcterms:description": JsonLdValue;
  "dcterms:publisher": {
    "@id": string;
    "@type": "foaf:Agent";
    "foaf:name": string;
  };
  "dcat:dataset": CatalogDataset[];
}

export interface ApiError {
  "@type": "Error";
  "dcterms:description": JsonLdValue;
  "dcterms:title": JsonLdValue;
  "http:statusCode": number;
}
