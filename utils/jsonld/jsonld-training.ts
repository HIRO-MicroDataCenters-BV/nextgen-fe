import type {
  JsonLdObject,
  JsonLdValue,
  JsonLdStringValue,
  JsonLdLanguageValue,
  JsonLdLongValue,
} from "~/types/jsonld.types";
import { getJsonLdValue, getJsonLdValueByPath, getLanguageValue } from "./jsonld-values";

export function convertJsonLdForTraining(input: unknown): {
  dataset: Array<Record<string, unknown>>;
} {
  const asObj = (input || {}) as Record<string, unknown>;
  if (Array.isArray(asObj.dataset)) {
    return { dataset: asObj.dataset as Array<Record<string, unknown>> };
  }

  const result: Array<Record<string, unknown>> = [];

  const datasets: unknown[] = (() => {
    if (Array.isArray((asObj as Record<string, unknown>)["dcat:dataset"])) {
      return (asObj as Record<string, unknown>)["dcat:dataset"] as unknown[];
    }
    if ((asObj as Record<string, unknown>)["@type"] === "dcat:Dataset") {
      return [asObj];
    }
    return [];
  })();

  const toBool = (v: unknown): boolean => {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") return v.toLowerCase() === "true";
    if (
      v &&
      typeof v === "object" &&
      "@value" in (v as Record<string, unknown>)
    ) {
      return toBool((v as Record<string, unknown>)["@value"]);
    }
    return false;
  };

  const extractScalar = (v: unknown): string => {
    if (v == null) return "";
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    )
      return String(v);
    if (Array.isArray(v)) {
      for (const item of v) {
        const s = extractScalar(item);
        if (s) return s;
      }
      return "";
    }
    if (typeof v === "object") {
      const obj = v as Record<string, unknown>;
      if ("@value" in obj) return getJsonLdValue(obj as unknown as JsonLdValue);
      if ("@language" in obj && "@value" in obj)
        return getLanguageValue(obj as unknown as JsonLdLanguageValue);
      if ("@id" in obj && Object.keys(obj).length === 1)
        return String(obj["@id"]);
      if ("skos:prefLabel" in obj)
        return getLanguageValue(
          obj["skos:prefLabel"] as unknown as JsonLdLanguageValue
        );
      if ("prefLabel" in obj) return extractScalar(obj["prefLabel"]);
      for (const key of ["value", "name", "title"]) {
        if (key in obj) {
          const s = extractScalar(obj[key]);
          if (s) return s;
        }
      }
    }
    return "";
  };

  const keyFromIri = (iri: string): string => {
    const bySlash = iri.split("/");
    const last = bySlash[bySlash.length - 1] ?? "";
    return last.replace(/[^A-Za-z0-9_-]/g, "_");
  };

  const normalizeExtraMetadata = (extra: unknown): Record<string, boolean> => {
    const out: Record<string, boolean> = {};
    if (!extra || typeof extra !== "object") return out;
    const obj = extra as Record<string, unknown>;
    Object.entries(obj).forEach(([k, v]) => {
      if (k.startsWith("@")) return;
      const key = keyFromIri(k);
      out[key] = toBool(v);
    });
    return out;
  };

  const toPlainDataset = (
    ds: Record<string, unknown>
  ): Record<string, unknown> => {
    const extra = ds["extraMetadata"] as unknown;
    const publisher = ds["dcterms:publisher"] as
      | Record<string, unknown>
      | undefined;
    const theme = ds["dcat:theme"] as Record<string, unknown> | undefined;
    const distributions = ds["dcat:distribution"] as unknown[] | undefined;

    const extractNames = (v: unknown): string[] => {
      if (!v) return [];
      if (Array.isArray(v)) {
        return (v as unknown[])
          .map((n) => {
            if (typeof n === "string") return n;
            if (n && typeof n === "object") {
              return (
                getLanguageValue(n as unknown as JsonLdLanguageValue) ||
                getJsonLdValue(n as unknown as JsonLdValue)
              );
            }
            return "";
          })
          .filter((s) => !!s);
      }
      if (typeof v === "string") return [v];
      if (v && typeof v === "object") {
        const lang = getLanguageValue(v as unknown as JsonLdLanguageValue);
        if (lang) return [lang];
        const val = getJsonLdValue(v as unknown as JsonLdValue);
        if (val) return [val];
      }
      return [];
    };

    const publisherName = publisher
      ? extractNames(publisher["foaf:name"])
      : undefined;

    const availabilityPrefLabel = (dist: Record<string, unknown>): string => {
      const av = dist["dcatap:availability"] as
        | Record<string, unknown>
        | undefined;
      if (!av) return "";
      const label = av?.["skos:prefLabel"] as unknown as
        | JsonLdLanguageValue
        | undefined;
      return label ? getLanguageValue(label) : String(av["@id"] || "");
    };

    return {
      extraMetadata: normalizeExtraMetadata(extra),
      isDeleted: toBool((ds as Record<string, unknown>)["isDeleted"]),
      isShared: toBool((ds as Record<string, unknown>)["isShared"]),
      region:
        getJsonLdValueByPath(ds as unknown as JsonLdObject, "region.@value") ||
        extractScalar((ds as Record<string, unknown>)["region"]),
      metadataFilename:
        getJsonLdValueByPath(
          ds as unknown as JsonLdObject,
          "metadataFilename.@value"
        ) || extractScalar((ds as Record<string, unknown>)["metadataFilename"]),
      description:
        getLanguageValue(
          ds["dcterms:description"] as unknown as JsonLdLanguageValue
        ) || extractScalar(ds["dcterms:description"]),
      identifier: getJsonLdValue(
        ds["dcterms:identifier"] as unknown as JsonLdStringValue
      ),
      issued: getJsonLdValue(
        ds["dcterms:issued"] as unknown as JsonLdStringValue
      ),
      license:
        getJsonLdValue(ds["dcterms:license"] as unknown as JsonLdStringValue) ||
        (ds["dcterms:license"] as Record<string, unknown>)?.["@id"] ||
        extractScalar(ds["dcterms:license"]) ||
        "",
      publisher: publisher
        ? {
          identifier: getJsonLdValue(
            publisher["dcterms:identifier"] as unknown as JsonLdStringValue
          ),
          name: publisherName || [],
        }
        : undefined,
      title:
        getLanguageValue(
          ds["dcterms:title"] as unknown as JsonLdLanguageValue
        ) || extractScalar(ds["dcterms:title"]),
      distribution: Array.isArray(distributions)
        ? distributions.map((d) => {
          const dist = d as Record<string, unknown>;
          return {
            availability: availabilityPrefLabel(dist),
            description: getLanguageValue(
              dist["dcterms:description"] as unknown as JsonLdLanguageValue
            ),
            accessURL:
              (dist["dcat:accessURL"] as Record<string, unknown>)?.["@id"] ||
              (dist["dcat:downloadURL"] as Record<string, unknown>)?.[
              "@id"
              ] ||
              extractScalar(dist["dcat:accessURL"]) ||
              "",
            byteSize: getJsonLdValue(
              dist["dcat:byteSize"] as unknown as JsonLdLongValue
            ),
            format:
              getJsonLdValue(
                dist["dcat:format"] as unknown as JsonLdStringValue
              ) ||
              getLanguageValue(
                dist["dcterms:format"] as unknown as JsonLdLanguageValue
              ) ||
              extractScalar(dist["dcterms:format"]),
          } as Record<string, unknown>;
        })
        : undefined,
      keyword:
        getJsonLdValue(ds["dcat:keyword"] as unknown as JsonLdStringValue) ||
        extractScalar(ds["dcat:keyword"]),
      theme: theme
        ? getLanguageValue(
          theme["skos:prefLabel"] as unknown as JsonLdLanguageValue
        ) || theme
        : undefined,
    } as Record<string, unknown>;
  };

  datasets.forEach((raw) => {
    if (!raw || typeof raw !== "object") return;
    result.push(toPlainDataset(raw as Record<string, unknown>));
  });

  return { dataset: result };
}
