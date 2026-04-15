export type FlatItem = {
  key: string;
  value: unknown;
  type: "string" | "date" | "boolean" | "array" | "object" | "number" | "bytes";
};

export const useDetailsView = (dayjs: ReturnType<typeof useDayjs>) => {
  const getDataType = (key: string, value: unknown): FlatItem["type"] => {
    if (value === null || value === undefined) return "string";
    if (isLikelyDateKey(key) && (typeof value === "string" || value instanceof Date)) {
      return "date";
    }
    if (isLikelyByteSizeKey(key) && (typeof value === "number" || isNumericString(value))) {
      return "bytes";
    }
    if (isBooleanLike(value)) return "boolean";
    if (typeof value === "number") return "number";
    if (Array.isArray(value)) return "array";
    if (typeof value === "object") return "object";
    if (typeof value === "string") {
      if (looksLikeDate(value)) return "date";
      return "string";
    }
    return "string";
  };

  const formatLabel = (key: string): string => {
    const dictionary: Record<string, string> = {
      dctermsIssued: "Issued",
      dctermsModified: "Modified",
      dctermsIdentifier: "Identifier",
      dctermsLicense: "License",
      dctermsPublisherFoafName: "Publisher",
      dcatDistributionDcatAccessURL: "Access URL",
      dcatDistributionDcatDownloadURL: "Download URL",
      dcatDistributionDcatByteSize: "File size",
      dcatDistributionDcatFormat: "Format",
      dcatKeyword: "Keywords",
      dcatThemeSkosPrefLabel: "Theme",
      dctermsTypeSkosPrefLabel: "Type",
      isShared: "Shared",
      isDeleted: "Deleted",
    };
    if (dictionary[key]) return dictionary[key] as string;
    return key
      .replaceAll("/", " / ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replaceAll("_", " ")
      .replaceAll(":", " ")
      .trim();
  };

  const getDisplayValue = (value: unknown): string => {
    if (value === null || value === undefined || value === "") return "—";
    if (isBooleanLike(value)) return toBoolean(value) ? "True" : "False";
    if (typeof value === "string" && looksLikeDate(value)) return formatDateValue(value);
    if (typeof value === "number") return formatNumberValue(value);
    if (Array.isArray(value)) return value.length === 0 ? "—" : `${value.length} items`;
    if (typeof value === "object") {
      const v = value as Record<string, unknown>;
      if (typeof v.label === "string") return v.label;
      if (typeof v.name === "string") return v.name;
      if (typeof v.title === "string") return v.title;
      if (typeof v.id === "string") return v.id;
      return JSON.stringify(value, null, 0);
    }
    const stringValue = String(value);
    if (stringValue.includes("/") && (stringValue.startsWith("http") || stringValue.includes("://"))) {
      const parts = stringValue.split("/");
      return parts[parts.length - 1] || stringValue;
    }
    return stringValue;
  };

  const formatDateValue = (value: unknown): string => {
    if (typeof value !== "string" || !value.trim()) return "—";
    const parsed = dayjs(value);
    if (!parsed.isValid()) return "—";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return parsed.format("DD MMM YYYY");
    return parsed.format("DD MMM YYYY, HH:mm");
  };

  const formatNumberValue = (value: unknown): string => {
    const num = toNumber(value);
    if (num === null || Number.isNaN(num)) return "—";
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(num);
  };

  const formatByteSize = (value: unknown): string => {
    const size = toNumber(value);
    if (size === null || Number.isNaN(size) || size < 0) return "—";
    if (size === 0) return "0B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const exp = Math.min(
      Math.floor(Math.log(size) / Math.log(1024)),
      units.length - 1,
    );
    const normalized = size / 1024 ** exp;
    return `${normalized.toFixed(normalized >= 10 ? 0 : 1)}${units[exp]}`;
  };

  const flattenData = (data: unknown, prefix = ""): FlatItem[] => {
    const result: FlatItem[] = [];
    if (!data || typeof data !== "object" || Array.isArray(data)) return result;
    const dataObj = data as Record<string, unknown>;
    for (const [key, value] of Object.entries(dataObj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const type = getDataType(fullKey, value);
      if (key.startsWith("@") || key === "type") continue;
      if (type === "object" && value && !Array.isArray(value)) {
        const objectValue = value as Record<string, unknown>;
        if (Object.keys(objectValue).length <= 5) {
          result.push({ key: fullKey, value: objectValue, type: "object" });
        } else {
          result.push(...flattenData(objectValue, fullKey));
        }
      } else {
        result.push({ key: fullKey, value, type });
      }
    }
    return result;
  };

  const isUrl = (value: unknown): boolean =>
    typeof value === "string" && /^https?:\/\//.test(value);
  const looksLikeDate = (value: string): boolean => {
    if (!value.trim()) return false;
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return true;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
    return dayjs(value).isValid();
  };
  const isLikelyDateKey = (key: string): boolean =>
    /(issued|modified|created|updated|date|temporal|start|end)/i.test(key);
  const isLikelyByteSizeKey = (key: string): boolean =>
    /(bytesize|byte_size|size|filesize)/i.test(key);
  const isNumericString = (value: unknown): value is string =>
    typeof value === "string" &&
    value.trim().length > 0 &&
    !Number.isNaN(Number(value.trim()));
  const toNumber = (value: unknown): number | null => {
    if (typeof value === "number") return value;
    if (isNumericString(value)) return Number(value.trim());
    return null;
  };
  const isBooleanLike = (value: unknown): boolean => {
    if (typeof value === "boolean") return true;
    if (typeof value !== "string") return false;
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "false";
  };
  const toBoolean = (value: unknown): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.trim().toLowerCase() === "true";
    return Boolean(value);
  };
  const booleanLabel = (value: unknown): string => (toBoolean(value) ? "True" : "False");
  const isEmptyValue = (value: unknown): boolean =>
    value === null || value === undefined || value === "";

  return {
    flattenData,
    formatLabel,
    getDisplayValue,
    formatDateValue,
    formatNumberValue,
    formatByteSize,
    isUrl,
    isBooleanLike,
    toBoolean,
    booleanLabel,
    isEmptyValue,
  };
};
