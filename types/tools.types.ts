// Tool catalogue types — mirrors the tool API payload. The catalogue currently
// renders from local sample data (see pages/tools/index.vue); swapping to an API
// means returning `Tool[]` from a fetch and dropping the sample array — the card
// + filtering stay unchanged.
//
// Presentation (thumbnail icon/colour) is derived from `category` in ToolCard,
// not stored here, so this stays a faithful copy of the API shape.

export type ToolType = "federated" | "library" | "utility";

export interface ToolLinks {
  /** Source-code repository. */
  repository?: string;
  /** Deployment entry on the Pathfinder platform (federated tools). */
  pathfinder?: string;
  /** DOI identifier, e.g. "10.5281/zenodo.0000001" (bare, no URL prefix). */
  doi?: string;
}

export interface Tool {
  id: string;
  name: string;
  /** Contributing partner shown in the card footer. */
  partner: string;
  description: string;
  /** Slug used for filtering, e.g. "imaging", "data-processing". */
  category: string;
  type: ToolType;
  /** Semantic version, e.g. "1.2.0". */
  version: string;
  /** SPDX license identifier, e.g. "Apache-2.0". */
  license: string;
  links: ToolLinks;
  keywords: string[];
}
