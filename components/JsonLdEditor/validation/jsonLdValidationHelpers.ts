import type { JsonLdNode } from '../types/editor.types';
import { jsonldFieldsEn } from '../../../i18n/jsonld-fields';

type FieldKey = keyof typeof jsonldFieldsEn;

export const jsonLdFieldLabel = (key: string) =>
    (jsonldFieldsEn[key as FieldKey] as { label?: string } | undefined)?.label
    || key.split(':').pop()?.replace(/([A-Z])/g, ' $1') || key;

/** Returns true when a node has no meaningful value (handles language-string objects). */
export const isEffectivelyEmptyJsonLdNode = (node: JsonLdNode): boolean => {
    if (node.value === undefined || node.value === null || node.value === '') {
        return !node.children?.length;
    }
    if (typeof node.value === 'object' && !Array.isArray(node.value)) {
        const v = node.value as Record<string, unknown>;
        if ('@value' in v) {
            return v['@value'] === '' || v['@value'] === undefined || v['@value'] === null;
        }
    }
    return false;
};

/**
 * Defensive: these leaves sit under DCAT *recommended* parents; never treat as submit-blocking
 * even if metadata was wrongly resolved (e.g. ambiguous @id).
 */
export const exemptFromMandatoryEmptyError = (path: string, key: string): boolean =>
    (key === '@id' && path.includes('dcterms:language')) ||
    (key === 'vcard:fn' && path.includes('dcat:contactPoint'));

/** Format/shape problems on non-mandatory fields must not block submit (warnings only). */
export const jsonLdFormatIssueSeverity = (node: JsonLdNode): 'error' | 'warning' =>
    node.metadata.dcatApCompliance === 'mandatory' ? 'error' : 'warning';
