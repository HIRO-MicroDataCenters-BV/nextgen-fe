import type { VocabularyOption } from "../constants/vocabularies";

export const normalizeVocabularyUri = (uri: string): string => {
  if (!uri) return "";

  let local = uri;
  const prefixColon = uri.indexOf(":");

  if (
    prefixColon !== -1 &&
    !uri.startsWith("http") &&
    !uri.startsWith("urn")
  ) {
    local = uri.slice(prefixColon + 1);
  } else {
    const hash = uri.lastIndexOf("#");
    local = hash !== -1 ? uri.slice(hash + 1) : uri.split("/").pop() ?? uri;
  }

  local = local.replace(/^checksumAlgorithm_/i, "");
  return local.toLowerCase().replace(/[-_\s]/g, "");
};

export const matchesVocabularyOption = (
  option: VocabularyOption,
  incoming: string,
): boolean => {
  if (!incoming) return false;
  if (option.value === incoming) return true;

  const normalized = normalizeVocabularyUri(incoming);
  return option.match.some(
    (keyword) =>
      normalized === keyword ||
      normalized.includes(keyword) ||
      keyword.includes(normalized),
  );
};
