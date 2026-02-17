# Appealing dataspace demo

To deliver a compelling demo for partners and potential clients, we need an interface that is both intuitive and aligned with user needs. This document outlines two key improvements to enhance usability and flexibility:

## Uploading the structural ontology (JSONLD) should be separate inputs instead of a single input field

### **Problem**

Most users (e.g., researchers, potential clients) are not familiar with JSON-LD syntax. Requiring them to manually write or paste JSON-LD creates a high barrier to entry.

### **Proposed Solution**

- **Provide a user-friendly form** with individual input fields corresponding to the relevant properties in the DCAT-AP ontology.
- The frontend should **automatically construct valid JSON-LD** from these inputs and send it to the backend.
- **Retain the option** for advanced users to directly input or upload raw JSON-LD.

### **Current Ontology: DCAT-AP v3.0**

We are using the [DCAT-AP 3.0](https://semiceu.github.io/DCAT-AP/releases/3.0.0/) specification. Key documentation:

- [Specification](https://semiceu.github.io/DCAT-AP/releases/3.0.0/)
- [Overview Diagram](https://semiceu.github.io/DCAT-AP/releases/3.0.0/html/overview-annotated.jpg)

The input fields must cover the fields in this DCAT AP ontology 

currenlty we are depending on three main components in DCAT AP ontology 

- **DCAT:Catalog** Typically auto-generated when onboarding a new partner node
- **DCAT: Dataset** Primary metadata container for data assets
- **DCAT: distribution** Describes how the dataset can be accessed or downloaded

**obligatory fields** that we now depend on, so the frontend can apply this validation 

| Component name | obligoatory fields | Notes |  |
| --- | --- | --- | --- |
| Dataset | dcterms:identifier
dcterms:title
dcterms:description
dcterms:type |  |  |
| Distibution  | dcat:accessURL |  |  |

**Additional UI/UX Considerations**

- These components could be extended, and we can support more components that have other fields like DataSetSeries,…, so we should be able to adapt this in an dynamic way (This could be out of the scope of this task)
- During the edit, you will get more data coming from the semantic metadata  from the MMIO, and it is under the title **extrametadata.** This will need to be displayed in the edit mode, but you can’t edit directly; you will have to upload a new MMIO with different semantics
- Some data coming from the backend will be displayed like **dspace:region** (all our backend fields should be under **Dspace:** ), they can’t be edited manually
- Some parts of the DCAT ontology are dynamic as distribution, so you can add more than a single distribution (the user can add more than a single distribution).

**Future-Proofing: Ontology Agnosticism**

We aim to remain ontology-agnostic. In the future, we may adopt other profiles (e.g., healthDCAT, DCAT-3, or domain-specific variants).
Recommendation: Design the form structure to be dynamically driven by the active ontology, even if this is out of scope for the current task. This ensures long-term maintainability.

## Make the filters dynamic

### **Problem**

Current filters in the Catalog and Marketplace are **statically defined** in the frontend. This breaks when:

- The underlying ontology changes.
- A client uses a custom or domain-specific schema (e.g., financial, healthcare).

### **Goal**

Support **dynamic, ontology-driven filtering** that adapts to any semantic schema.

### **Implementation**

1. **Backend API Endpoint (Recommended)**
    - Expose a `/filters` endpoint from the Catalog server.
    - Backend returns filter definitions based on the currently active ontology.
    - Storage can be file-based (YAML/JSON) or database-backed, depending on complexity.

**TODO**: document the endpoint specs

**Related links**
https://semiceu.github.io/DCAT-AP/releases/3.0.0/