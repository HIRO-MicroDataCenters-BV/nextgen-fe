import type {
  JsonLdValue,
  JsonLdObject,
  JsonLdLanguageValue,
} from "~/types/jsonld.types";

const JSONLD_PLAIN_MAX_DEPTH = 12;

const JSONLD_BOGUS_OBJECT_PLACEHOLDER = /^\[object object\]$/i;

/** True when the string is the JS coercion artifact from serializing a plain object. */
export function isBogusJsonLdObjectPlaceholder(text: string): boolean {
  return JSONLD_BOGUS_OBJECT_PLACEHOLDER.test(text.trim());
}

/**
 * Flatten a JSON-LD literal / nested @value tree to a display or API-safe string.
 * Avoids "[object Object]" when @value is an object or array.
 */
export function jsonLdValueToPlainString(
  input: unknown,
  depth = 0
): string {
  if (input == null || depth > JSONLD_PLAIN_MAX_DEPTH) return "";
  if (typeof input === "string") return input;
  if (typeof input === "number" || typeof input === "boolean") {
    return String(input);
  }
  if (Array.isArray(input)) {
    return input
      .map((x) => jsonLdValueToPlainString(x, depth + 1))
      .filter((s) => s.trim().length > 0)
      .join(", ");
  }
  if (typeof input === "object") {
    const o = input as Record<string, unknown>;
    if ("@value" in o) {
      return jsonLdValueToPlainString(o["@value"], depth + 1);
    }
    if ("@id" in o && Object.keys(o).length <= 3) {
      const id = o["@id"];
      if (typeof id === "string") return id;
    }
  }
  return "";
}

/**
 * Collapse dcterms:title-style language maps to one { @language, @value } with a plain string @value.
 * Prefers preferredLanguage; handles arrays of literals and typed { @type, @value }.
 */
export function normalizeDctermsLanguageLiteral(
  value: unknown,
  preferredLanguage = "en"
): { "@language": string; "@value": string } {
  const leaf = (v: unknown) => jsonLdValueToPlainString(v);

  if (Array.isArray(value)) {
    const picks: { lang: string; text: string }[] = [];
    for (const item of value) {
      if (typeof item === "string") {
        const t = item.trim();
        if (t && !isBogusJsonLdObjectPlaceholder(t)) {
          picks.push({ lang: preferredLanguage, text: t });
        }
        continue;
      }
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const lang =
        typeof o["@language"] === "string" ? o["@language"] : preferredLanguage;
      const text = leaf(
        o["@value"] !== undefined ? o["@value"] : o
      ).trim();
      if (text && !isBogusJsonLdObjectPlaceholder(text)) {
        picks.push({ lang, text });
      }
    }
    // Same language repeated (invalid but common after merges): use the **last** entry —
    // usually the newest edit; the first match was wrongly shown in catalog lists.
    const preferredMatches = picks.filter(
      (p) => p.lang === preferredLanguage
    );
    const best =
      preferredMatches.length > 0
        ? preferredMatches[preferredMatches.length - 1]
        : picks.length > 0
          ? picks[picks.length - 1]
          : undefined;
    return {
      "@language": best?.lang ?? preferredLanguage,
      "@value": best?.text ?? "",
    };
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    const lang =
      typeof o["@language"] === "string" ? o["@language"] : preferredLanguage;
    if ("@value" in o) {
      const plain = leaf(o["@value"]);
      if (isBogusJsonLdObjectPlaceholder(plain)) {
        return { "@language": preferredLanguage, "@value": "" };
      }
      return { "@language": lang, "@value": plain };
    }
  }

  if (typeof value === "string") {
    if (isBogusJsonLdObjectPlaceholder(value)) {
      return { "@language": preferredLanguage, "@value": "" };
    }
    return { "@language": preferredLanguage, "@value": value };
  }

  const fallback = leaf(value);
  if (isBogusJsonLdObjectPlaceholder(fallback)) {
    return { "@language": preferredLanguage, "@value": "" };
  }
  return { "@language": preferredLanguage, "@value": fallback };
}

/**
 * Extract value from JSON-LD value object
 */
export function getJsonLdValue(
  value: JsonLdValue | JsonLdValue[] | undefined
): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const first = value[0];
    if (!first) return "";
    if (typeof first === "object" && first !== null && "@value" in first) {
      return jsonLdValueToPlainString(
        (first as unknown as Record<string, unknown>)["@value"]
      );
    }
    return jsonLdValueToPlainString(first);
  }

  if (typeof value === "object" && value !== null && "@value" in value) {
    return jsonLdValueToPlainString(
      (value as unknown as Record<string, unknown>)["@value"]
    );
  }

  return "";
}

/**
 * Extract value from JSON-LD object by path
 */
export function getJsonLdValueByPath(
  obj: JsonLdObject | undefined | null,
  path: string
): string {
  if (!obj) return "";

  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (!current || typeof current !== "object") return "";
    current = current[part as keyof typeof current];
  }

  return getJsonLdValue(current as JsonLdValue | JsonLdValue[] | undefined);
}

/**
 * Get language value from JSON-LD object
 */
export function getLanguageValue(
  value: JsonLdLanguageValue | JsonLdLanguageValue[] | undefined,
  preferredLanguage: string = "en"
): string {
  if (!value) return "";
  return normalizeDctermsLanguageLiteral(
    value as unknown,
    preferredLanguage
  )["@value"];
}

function extractTitleNodePlain(
  node: unknown,
  preferredLanguage: string
): string {
  if (typeof node === "string") return node.trim();
  if (!node) return "";
  if (Array.isArray(node)) {
    return normalizeDctermsLanguageLiteral(node, preferredLanguage)[
      "@value"
    ].trim();
  }
  if (typeof node === "object" && node !== null && "@value" in node) {
    return jsonLdValueToPlainString(
      (node as { "@value": unknown })["@value"]
    ).trim();
  }
  return "";
}

/**
 * Human-readable string from dataset metadata `dcterms:title` (for UI display / name field).
 * Accepts a metadata object or a JSON string of it.
 */
export function extractDctermsTitlePlainText(
  metadata: unknown,
  preferredLanguage: string = "en"
): string {
  let obj: Record<string, unknown> | null = null;
  if (!metadata) return "";
  if (typeof metadata === "string") {
    try {
      const p = JSON.parse(metadata) as unknown;
      if (p && typeof p === "object" && !Array.isArray(p)) {
        obj = p as Record<string, unknown>;
      }
    } catch {
      return "";
    }
  } else if (
    typeof metadata === "object" &&
    metadata !== null &&
    !Array.isArray(metadata)
  ) {
    obj = metadata as Record<string, unknown>;
  }
  if (!obj) return "";
  return extractTitleNodePlain(obj["dcterms:title"], preferredLanguage);
}
