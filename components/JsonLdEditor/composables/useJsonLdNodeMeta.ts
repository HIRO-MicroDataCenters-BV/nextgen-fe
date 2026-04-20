import { computed, type Ref } from "vue";
import { jsonldFieldsEn } from "~/i18n/jsonld-fields";
import type { JsonLdNode, ValidationError } from "../types/editor.types";

interface UseJsonLdNodeMetaOptions {
  node: Ref<JsonLdNode>;
  nodePath: Ref<string>;
  readonly: Ref<boolean>;
  depth: Ref<number>;
  validationErrors: Ref<ValidationError[]>;
}

type FieldKey = keyof typeof jsonldFieldsEn;

const META_KEY_DESCRIPTIONS: Record<string, string> = {
  "@value": "The text value of this field",
  "@id": "Unique identifier (URI)",
  "@language": "Language code, e.g. en, nl, de",
  "@type": "The type of this resource",
};

const TEXT_TYPES = new Set(["string", "language-string", "uri"]);
const NO_CHAR_COUNT_KEYS = new Set([
  "vcard:hasEmail",
  "vcard:hasTelephone",
  "foaf:homepage",
  "dcat:landingPage",
  "foaf:page",
  "schema:url",
  "vcard:hasURL",
]);

export const useJsonLdNodeMeta = (options: UseJsonLdNodeMetaOptions) => {
  const fieldI18n = computed(
    () => jsonldFieldsEn[options.node.value.key as FieldKey] ?? null,
  );

  const fieldLabel = computed(() => {
    if (fieldI18n.value?.label) return fieldI18n.value.label;
    if (options.node.value.metadata.label) return options.node.value.metadata.label;
    const raw = options.node.value.key.split(":").pop() || options.node.value.key;
    return raw.charAt(0).toUpperCase() + raw.slice(1).replace(/([A-Z])/g, " $1");
  });

  const fieldDescription = computed(
    () =>
      fieldI18n.value?.description ||
      options.node.value.metadata.description ||
      META_KEY_DESCRIPTIONS[options.node.value.key] ||
      null,
  );

  const fieldIconName = computed(
    () => options.node.value.metadata.icon ?? "lucide:circle-dot",
  );

  const hasChildren = computed(
    () =>
      Array.isArray(options.node.value.children) &&
      (options.node.value.children.length > 0 ||
        options.node.value.type === "object" ||
        options.node.value.type === "array"),
  );

  const visibleChildren = computed(() =>
    (options.node.value.children ?? []).filter((child) => !child.metadata.hidden),
  );

  const currentPath = computed(() =>
    options.nodePath.value
      ? `${options.nodePath.value}.${options.node.value.key}`
      : options.node.value.key,
  );

  const isFromMmio = computed(
    () =>
      currentPath.value === "dspace:extraMetadata" ||
      currentPath.value.startsWith("dspace:extraMetadata."),
  );

  const isFromFile = computed(
    () =>
      (options.node.value.metadata as unknown as Record<string, unknown>)
        .fromFile === true,
  );

  const effectiveReadonly = computed(
    () => options.readonly.value || isFromMmio.value || isFromFile.value,
  );

  const fieldErrors = computed(() =>
    options.validationErrors.value.filter((e) => e.path === currentPath.value),
  );

  const hasValue = computed(() => {
    const value = options.node.value.value;
    if (value === undefined || value === null || value === "") return false;
    if (typeof value === "object" && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      if ("@value" in obj) {
        return (
          obj["@value"] !== "" &&
          obj["@value"] !== undefined &&
          obj["@value"] !== null
        );
      }
    }
    return true;
  });

  const isDcatMandatory = computed(
    () => options.node.value.metadata.dcatApCompliance === "mandatory",
  );

  const charCountMax = computed(() => {
    if (options.node.value.key === "dcterms:description") return 500;
    if (options.node.value.key === "dcterms:title") return 120;
    return null;
  });

  const showCharCount = computed(
    () =>
      charCountMax.value !== null &&
      TEXT_TYPES.has(options.node.value.type) &&
      !NO_CHAR_COUNT_KEYS.has(options.node.value.key) &&
      !options.node.value.metadata.readonly,
  );

  const charCount = computed(() => {
    const value = options.node.value.value;
    if (!value) return 0;
    if (typeof value === "string") return value.length;
    if (typeof value === "object" && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      return typeof obj["@value"] === "string" ? obj["@value"].length : 0;
    }
    return 0;
  });

  const charCountClass = computed(() => {
    const max = charCountMax.value;
    if (!max) return "";
    if (charCount.value > max) return "char-counter--danger";
    if (charCount.value > max * 0.85) return "char-counter--warn";
    return "";
  });

  const canRemoveNode = computed(
    () =>
      options.node.value.metadata.dcatApCompliance !== "mandatory" &&
      options.depth.value === 0,
  );

  return {
    fieldLabel,
    fieldDescription,
    fieldIconName,
    hasChildren,
    visibleChildren,
    currentPath,
    isFromMmio,
    isFromFile,
    effectiveReadonly,
    fieldErrors,
    hasValue,
    isDcatMandatory,
    charCountMax,
    showCharCount,
    charCount,
    charCountClass,
    canRemoveNode,
  };
};
