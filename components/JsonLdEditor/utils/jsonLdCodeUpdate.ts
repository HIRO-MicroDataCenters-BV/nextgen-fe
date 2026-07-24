/**
 * Parses code-editor JSON and re-injects MMIO extraMetadata (not editable in code mode).
 */
export const applyJsonLdCodeUpdate = (
  newCode: string,
  extraMetadata: Array<Record<string, unknown>> | null | undefined,
): {
  codeData: string;
  lastEmitted: string;
  modelValue: string | Record<string, unknown>;
} => {
  try {
    const parsed = JSON.parse(newCode) as Record<string, unknown>;
    const out = extraMetadata?.length
      ? { ...parsed, "dspace:extraMetadata": extraMetadata }
      : parsed;
    const outStr = JSON.stringify(out, null, 2);
    return {
      codeData: outStr,
      lastEmitted: outStr,
      modelValue: out,
    };
  } catch {
    return {
      codeData: newCode,
      lastEmitted: newCode,
      modelValue: newCode,
    };
  }
};
