# NextGen Frontend (`nextgen-fe`)

Web client for the **NextGen** data ecosystem: catalog management, **DCAT-AP 3.0** dataset metadata in **JSON-LD**, marketplace discovery, and connector-backed workflows (MMIO, related data products, checkout).

Built with **[Nuxt 3](https://nuxt.com/)** and **[Vue 3](https://vuejs.org/)**.

---

## NextGen programme

### Next generation tools for genome-centric multimodal data integration in personalised cardiovascular medicine

Healthcare is the **fastest** growing EU27 expenditure. Personalised medicine, comprising tailored approaches for prevention, diagnosis, monitoring and treatment is essential to reduce the burden of disease and improve the quality of life. Integration of multiple data types (multimodal data) into artificial intelligence models is required for the development of accurate and personalised interventions. This is particularly true for the inclusion of genomic data, which is information-rich and individual-specific, and more routinely available as the cost of sequencing continues to fall. Multimodal data integration is complex due to privacy & governance requirements, the presence of multiple standards, distinct data formats, and underlying data complexity and volume. NextGen tools will remove barriers in data integration several cardiovascular use cases. NextGen deliverables will include tooling for multimodal data integration and research portability, extension of secure federated analytics to genomic computation, more effective federated learning over distributed infrastructures, more effective and accessible tools for genomic data analysis; improved clinical efficiency of variant prioritisation; scalable genomic data curation; and improved data discoverability and data management. A comprehensive gap analysis of the existing landscape, factoring ongoing initiatives will ensure NextGen deliverables are forward-looking and complementary. NextGen embedded governance framework and robust regulatory processes will ensure secure multi-jurisdictional multiomic multimodal data access aligned with initiatives including “1+ Million Genomes” and the European Health Data Space. Several real-world pilots will demonstrate the effectiveness of NextGen tools and will be integrated in the NextGen Pathfinder network of five collaborating clinical sites as a self-contained data ecosystem and comprehensive proof of concept.

**HIRO MICRODATACENTERS B.V.** (904044463)  
participant · Netherlands  
**EU contribution:** 1 497 000,00 EUR

**EU project factsheet:**  
https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/projects-details/43108390/101136962

---

## Highlights

### DCAT-AP 3.0 JSON-LD metadata editor

- **Dual mode**: structured **visual** tree editor and raw **JSON** editor, with reliable round-trips (including empty / default forms when switching modes).
- **Schema-driven UI** (`useJsonLdSchema`): fields aligned with DCAT-AP 3-style vocabulary (identification, provenance, coverage, access, distribution), plus project extensions (`dspace:*`, etc.).
- **Live validation**: errors and warnings, **mandatory-field progress**, and a **DCAT-AP compliance** indicator in the footer.
- **Distributions**: `dcat:distribution` items edited with a dedicated distribution schema (checksums, formats, access URLs, etc.).
- **Add Field** dialog to attach additional DCAT properties beyond the default template.
- **Context handling**: standard namespace `@context` (dcat, dcterms, dcatap, foaf, skos, spdx, vcard, xsd, dspace, …) merged on load and serialize.
- **Keyboard**: e.g. **A** opens “Add field” in visual mode (when not typing in an input).

### My Catalog (datasets & applications)

- **Create**: item type (dataset / application), **connector client** selector, **related data product** (from connector API), MMIO file upload (**TAR** / JSON flows), and full metadata in the JSON-LD editor.
- **Name field** on create is **read-only** and **mirrors `dcterms:title`** from the metadata (single source of truth in the editor).
- **Edit**: metadata and DCAT document editing; **client selector hidden**; **related data product** shown as **read-only** (value derived from metadata, e.g. `dcat:inSeries` / distribution paths); file field locked for existing uploads.
- **MMIO / OCA**: TAR and JSON pipelines can populate **`dspace:extraMetadata`**; DCAT JSON can be loaded client-side for preview without hitting MMIO upload where inappropriate.
- **Save** builds normalized JSON-LD via `createDatasetJsonLd` and talks to the **catalog** API (`application/ld+json`).

### Marketplace & search

- Browse and filter datasets from the **search** service, dataset detail views, and **checkout** flow (order id / status) via configured checkout API.

### Auth & shell

- Login flow, toasts, i18n (**English** UI strings in repo), responsive layout with **Tailwind CSS** and **shadcn-nuxt** / **Reka UI** components.

---

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Nuxt 3, Vue 3, Vue Router |
| UI | Tailwind CSS 4, shadcn-nuxt, Reka UI, Lucide icons |
| Forms | Vee-Validate + Zod |
| i18n | @nuxtjs/i18n, nuxt-zod-i18n |
| JSON-LD | `jsonld` package + custom parse/serialize tree (`useJsonLdTransform`) |
| HTTP | Native `fetch` via `useApi` (catalog / search / connector bases) |
| Dates | Day.js (Nuxt module) |

---

## Configuration

Set backend URLs and options via environment variables (see `nuxt.config.ts` → `runtimeConfig`):

| Variable | Role |
|----------|------|
| `NUXT_PUBLIC_API_SEARCH_SERVICE_URL` | Search API base |
| `NUXT_PUBLIC_API_CATALOG_SERVICE_URL` | Catalog API base |
| `NUXT_PUBLIC_API_CONNECTOR_SERVICE_URL` | Connector API (metadata, dataproducts, client interfaces) |
| `NUXT_PUBLIC_CATALOG_NAME` | Catalog slug (default `hus_catalog`) |
| `NUXT_PUBLIC_API_CHECKOUT_SERVICE_URL` | Marketplace checkout |
| `NUXT_PUBLIC_COG_URL` / `NUXT_PUBLIC_API_COG_URL` | COG integration |
| `NUXT_PUBLIC_TRAINING_BUILDER_SERVICE_URL` | Training builder |
| `NUXT_DEX_*`, `NUXT_DEX_SKIP_TLS_VERIFY` | Server-side Dex auth (not exposed to client) |

---

## Setup

```bash
corepack enable
pnpm install
```

Uses the pnpm version from `package.json` → `packageManager` (via Corepack).

## Development

```bash
pnpm dev
```

App runs at [http://localhost:3000](http://localhost:3000) (default Nuxt dev server).

## Production

```bash
pnpm build
```

See [Nuxt deployment](https://nuxt.com/docs/getting-started/deployment).

## Lint

```bash
pnpm lint
pnpm lint:fix
```

---

## About this repository

This **frontend** codebase (`nextgen-fe`) implements the catalog, metadata editor, marketplace UI, and related client flows described under [Highlights](#highlights). Backend services (catalog, search, connector, checkout, Dex, etc.) are **separate** deployments; point the app at them using the [configuration](#configuration) variables above. For the scientific and policy framing of the NextGen programme, see [NextGen programme](#nextgen-programme).
