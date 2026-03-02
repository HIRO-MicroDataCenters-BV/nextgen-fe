import type { JsonLdNode, ValidationResult, ValidationError } from '../types/editor.types';
import { useJsonLdSchema } from './useJsonLdSchema';
import { jsonldFieldsEn } from '../../../i18n/jsonld-fields';

type FieldKey = keyof typeof jsonldFieldsEn;
const fieldLabel = (key: string) =>
    (jsonldFieldsEn[key as FieldKey] as { label?: string } | undefined)?.label
    || key.split(':').pop()?.replace(/([A-Z])/g, ' $1') || key;

export function useJsonLdValidation() {
    const { getRequiredFields, getFieldDefinition: _getFieldDefinition } = useJsonLdSchema();

    /** Returns true when a node has no meaningful value (handles language-string objects). */
    const isEffectivelyEmpty = (node: JsonLdNode): boolean => {
        // No value and no children
        if (node.value === undefined || node.value === null || node.value === '') {
            return !node.children?.length;
        }
        // language-string: { '@value': '', '@language': 'en' } → empty
        if (typeof node.value === 'object' && !Array.isArray(node.value)) {
            const v = node.value as Record<string, unknown>;
            if ('@value' in v) {
                return v['@value'] === '' || v['@value'] === undefined || v['@value'] === null;
            }
        }
        return false;
    };

    const validateNode = (node: JsonLdNode, path: string = ''): ValidationError[] => {
        const errors: ValidationError[] = [];
        const currentPath = path ? `${path}.${node.key}` : node.key;

        if (node.metadata.required && isEffectivelyEmpty(node)) {
            errors.push({
                path: currentPath,
                message: `${fieldLabel(node.key)} is required`,
                severity: 'error',
            });
        }

        // Keys with dedicated format validators — skip generic URI check to avoid duplicates
        const DEDICATED_FORMAT_KEYS = new Set([
            'vcard:hasEmail', 'vcard:hasTelephone',
            'foaf:homepage', 'dcat:landingPage', 'foaf:page', 'schema:url', 'vcard:hasURL',
        ]);

        if (node.type === 'uri' && node.value && !DEDICATED_FORMAT_KEYS.has(node.key) && !node.metadata.vocabulary) {
            const val = String(node.value).trim();
            // Accept:
            //   • Standard absolute URIs: http(s)://, file://, mailto:, tel:, urn:
            //   • JSON-LD prefixed forms: prefix:localName  (e.g. spdx:SHA256, dcterms:title)
            //     These are valid when a @context expands them to full URIs.
            const isAbsoluteUri = /^(https?|file|mailto|tel|urn):.+/.test(val);
            const isPrefixedUri = /^[a-zA-Z][a-zA-Z0-9_-]*:[a-zA-Z0-9_./-]/.test(val) && !val.startsWith('http') && !val.startsWith('urn');
            if (!isAbsoluteUri && !isPrefixedUri) {
                errors.push({
                    path: currentPath,
                    message: `${fieldLabel(node.key)} must be a valid URI`,
                    severity: 'error',
                });
            }
        }

        if (node.type === 'number' && node.value !== undefined && node.value !== null) {
            const numValue = Number(node.value);
            if (isNaN(numValue)) {
                errors.push({
                    path: currentPath,
                    message: `${node.key} must be a valid number`,
                    severity: 'error',
                });
            }
            if (node.metadata.xsdType === 'xsd:nonNegativeInteger' && numValue < 0) {
                errors.push({
                    path: currentPath,
                    message: `${node.key} must be non-negative`,
                    severity: 'error',
                });
            }
        }

        if (node.type === 'date' && node.value) {
            const datePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;
            if (!datePattern.test(String(node.value))) {
                errors.push({
                    path: currentPath,
                    message: `${node.key} must be a valid date`,
                    severity: 'error',
                });
            }
        }

        // ── Email (vcard:hasEmail) ─────────────────────────────
        if (node.key === 'vcard:hasEmail' && node.value) {
            const emailVal = String(node.value).trim();
            if (emailVal.startsWith('mailto:')) {
                const email = emailVal.slice(7);
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    errors.push({ path: currentPath, message: 'Invalid email format after mailto:', severity: 'error' });
                }
            } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
                // bare email — warn to add mailto: prefix (DCAT-AP expects URI)
                errors.push({ path: currentPath, message: 'Email should be in the form mailto:name@example.com', severity: 'warning' });
            } else {
                errors.push({ path: currentPath, message: 'Email must be in the form mailto:name@example.com', severity: 'error' });
            }
        }

        // ── Telephone (vcard:hasTelephone) ────────────────────
        if (node.key === 'vcard:hasTelephone' && node.value) {
            const telVal = String(node.value).trim();
            if (telVal.startsWith('tel:')) {
                const digits = telVal.slice(4);
                if (!/^\+?[\d\s\-().]{5,20}$/.test(digits)) {
                    errors.push({ path: currentPath, message: 'Invalid phone number format after tel:', severity: 'warning' });
                }
            } else if (/^\+?[\d\s\-().]{5,20}$/.test(telVal)) {
                errors.push({ path: currentPath, message: 'Phone should use tel: prefix, e.g. tel:+31201234567', severity: 'warning' });
            } else {
                errors.push({ path: currentPath, message: 'Phone must be in the form tel:+31201234567', severity: 'error' });
            }
        }

        // ── URL fields ────────────────────────────────────────
        const URL_KEYS = new Set([
            'foaf:homepage', 'dcat:landingPage', 'foaf:page',
            'schema:url', 'vcard:hasURL',
        ]);
        if (URL_KEYS.has(node.key) && node.value) {
            try {
                const u = new URL(String(node.value));
                if (!['http:', 'https:'].includes(u.protocol)) {
                    errors.push({ path: currentPath, message: `${fieldLabel(node.key)} must be an http(s) URL`, severity: 'warning' });
                }
            } catch {
                errors.push({ path: currentPath, message: `${fieldLabel(node.key)} must be a valid URL`, severity: 'error' });
            }
        }

        // Controlled vocabulary validation for access rights
        if (node.key === '@id' && path.includes('dcterms:accessRights') && node.value) {
            const validAccessRights = [
                'http://publications.europa.eu/resource/authority/access-right/PUBLIC',
                'http://publications.europa.eu/resource/authority/access-right/RESTRICTED',
                'http://publications.europa.eu/resource/authority/access-right/NON_PUBLIC',
            ];
            if (!validAccessRights.includes(String(node.value))) {
                errors.push({
                    path: currentPath,
                    message: 'Access rights must be one of: PUBLIC, RESTRICTED, NON_PUBLIC',
                    severity: 'warning',
                });
            }
        }

        // Language code validation
        if (node.key === '@id' && path.includes('dcterms:language') && node.value) {
            const languagePattern = /^http:\/\/publications\.europa\.eu\/resource\/authority\/language\/[A-Z]{3}$/;
            if (!languagePattern.test(String(node.value))) {
                errors.push({
                    path: currentPath,
                    message: 'Language must be a valid EU Vocabulary URI (e.g., .../language/ENG)',
                    severity: 'warning',
                });
            }
        }

        if (node.children) {
            for (const child of node.children) {
                errors.push(...validateNode(child, currentPath));
            }
        }

        return errors;
    };

    const validateTree = (tree: JsonLdNode[]): ValidationResult => {
        const errors: ValidationError[] = [];

        // Skip validation if tree is empty (no data loaded yet)
        if (!tree || tree.length === 0) {
            return {
                valid: true,
                errors: [],
            };
        }

        for (const node of tree) {
            errors.push(...validateNode(node));
        }

        const requiredDatasetFields = getRequiredFields('dataset');

        // Only check for missing required fields if we have some data
        // (at least one non-empty node)
        const hasData = tree.some(node =>
            !isEffectivelyEmpty(node)
        );

        if (hasData) {
            const presentKeys = new Set(tree.map(n => n.key));
            for (const requiredField of requiredDatasetFields) {
                // Only fire here if the field is completely absent from the tree.
                // If it IS present (even empty), validateNode above already generated the error.
                if (!presentKeys.has(requiredField)) {
                    errors.push({
                        path: requiredField,
                        message: `${fieldLabel(requiredField)} is required`,
                        severity: 'error',
                    });
                }
            }
        }

        return {
            valid: errors.filter(e => e.severity === 'error').length === 0,
            errors,
        };
    };

    const validateJsonLd = (data: Record<string, unknown>): ValidationResult => {
        const errors: ValidationError[] = [];

        // Skip validation if data is empty
        if (!data || Object.keys(data).length === 0) {
            return {
                valid: true,
                errors: [],
            };
        }

        const requiredFields = getRequiredFields('dataset');
        for (const field of requiredFields) {
            if (!(field in data)) {
                errors.push({
                    path: field,
                    message: `Required field ${field} is missing`,
                    severity: 'error',
                });
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    };

    /**
     * Get validation errors for a specific field path
     */
    const getFieldErrors = (errors: ValidationError[], path: string): ValidationError[] => {
        return errors.filter(err => err.path === path);
    };

    return {
        validateNode,
        validateTree,
        validateJsonLd,
        getFieldErrors,
    };
}
