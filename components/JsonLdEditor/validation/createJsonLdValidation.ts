import type { JsonLdNode, ValidationResult, ValidationError } from '../types/editor.types';
import { CLIENT_URL_CONFIG } from '@/constants';
import {
    getDctermsTypeIdFromTreeNodes,
    hasItemTypeMismatchForDctermsId,
} from '~/utils/metadataItemTypeConsistency';
import {
    jsonLdFieldLabel,
    isEffectivelyEmptyJsonLdNode,
    exemptFromMandatoryEmptyError,
    jsonLdFormatIssueSeverity,
} from './jsonLdValidationHelpers';

export type JsonLdValidationDeps = {
    t: (key: string, values?: Record<string, unknown>) => string;
    getSelectedClient: () => string | null | undefined;
    getMandatoryDatasetFieldKeys: () => string[];
};

export function createJsonLdValidation(deps: JsonLdValidationDeps) {
    const { t, getSelectedClient, getMandatoryDatasetFieldKeys } = deps;

    type ValidateCtx = { enforceClientAccessUrl: boolean };

    const validateNode = (
        node: JsonLdNode,
        path: string = '',
        ctx: ValidateCtx = { enforceClientAccessUrl: true },
    ): ValidationError[] => {
        const errors: ValidationError[] = [];
        const currentPath = path ? `${path}.${node.key}` : node.key;

        if (node.metadata.hidden) {
            if (node.children?.length) {
                for (const child of node.children) {
                    errors.push(...validateNode(child, currentPath, ctx));
                }
            }
            return errors;
        }

        // Only DCAT-AP *mandatory* fields block submission; schema `required` is used elsewhere (e.g. nested defaults).
        if (node.metadata.dcatApCompliance === 'mandatory' && isEffectivelyEmptyJsonLdNode(node)) {
            if (!exemptFromMandatoryEmptyError(currentPath, node.key)) {
                errors.push({
                    path: currentPath,
                    message: `${jsonLdFieldLabel(node.key)} is required`,
                    severity: 'error',
                });
            }
        }

        // ── URI validation (generic \u2014 skipped for vocabulary fields and format-specific ones) ──
        // Format-specific fields (email, tel, url) have their own validators below.
        // Vocabulary fields are selection-only and don't need URI pattern validation.
        if (node.type === 'uri' && node.value && !node.metadata.vocabulary && !node.metadata.format) {
            const val = String(node.value).trim();
            let uriValid = false;

            if (val.includes('://')) {
                // RFC 3986 §3.1 — scheme = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
                const schemeMatch = val.match(/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//);
                if (schemeMatch) {
                    uriValid = val.length > schemeMatch[0].length;
                }
            } else if (val.includes(':')) {
                if (/^https?:/i.test(val)) {
                    uriValid = false; // http/https without :// is always invalid
                } else if (/^(mailto|tel|urn):[^\s]/.test(val)) {
                    uriValid = true;
                } else if (/^[a-zA-Z][a-zA-Z0-9_-]*:[a-zA-Z0-9_./#%@-]/.test(val)) {
                    uriValid = true; // JSON-LD prefixed form: prefix:localName
                }
            }

            if (!uriValid) {
                errors.push({
                    path: currentPath,
                    message: `${jsonLdFieldLabel(node.key)} must be a valid URI`,
                    severity: jsonLdFormatIssueSeverity(node),
                });
            }
        }

        // ── Email (format: 'email') ──────────────────────────────
        if (node.metadata.format === 'email' && node.value) {
            const emailVal = String(node.value).trim();
            if (emailVal.startsWith('mailto:')) {
                const email = emailVal.slice(7);
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    errors.push({ path: currentPath, message: 'Invalid email format after mailto:', severity: jsonLdFormatIssueSeverity(node) });
                }
            } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
                errors.push({ path: currentPath, message: 'Email should be in the form mailto:name@example.com', severity: 'warning' });
            } else {
                errors.push({ path: currentPath, message: 'Email must be in the form mailto:name@example.com', severity: jsonLdFormatIssueSeverity(node) });
            }
        }

        // ── Telephone (format: 'tel') ────────────────────────────
        if (node.metadata.format === 'tel' && node.value) {
            const telVal = String(node.value).trim();
            if (telVal.startsWith('tel:')) {
                const digits = telVal.slice(4);
                if (!/^\+?[\d\s\-().]{5,20}$/.test(digits)) {
                    errors.push({ path: currentPath, message: 'Invalid phone number format after tel:', severity: 'warning' });
                }
            } else if (/^\+?[\d\s\-().]{5,20}$/.test(telVal)) {
                errors.push({ path: currentPath, message: 'Phone should use tel: prefix, e.g. tel:+31201234567', severity: 'warning' });
            } else {
                errors.push({ path: currentPath, message: 'Phone must be in the form tel:+31201234567', severity: jsonLdFormatIssueSeverity(node) });
            }
        }

        // ── URL (format: 'url') ──────────────────────────────────
        if (node.metadata.format === 'url' && node.value) {
            const val = String(node.value).trim();
            const isAccessOrDownloadUrl = node.key === 'dcat:accessURL' || node.key === 'dcat:downloadURL';
            const client = getSelectedClient();
            const config = client ? CLIENT_URL_CONFIG[client] : null;

            if (isAccessOrDownloadUrl && config && ctx.enforceClientAccessUrl) {
                const hasExpectedPrefix = config.protocolPrefix ? val.startsWith(config.protocolPrefix) : false;
                const hasWrongProtocol = Object.values(CLIENT_URL_CONFIG).some(
                    (c) => c !== config && c.protocolPrefix && val.startsWith(c.protocolPrefix)
                ) || (val.startsWith('http') && !config.allowedProtocols.includes('http:') && !config.allowedProtocols.includes('https:'));

                if (hasExpectedPrefix && config.urlPattern) {
                    if (!config.urlPattern.test(val)) {
                        errors.push({
                            path: currentPath,
                            message: t(`jsonld.editor.validation.${config.invalidFormatKey}`, { field: jsonLdFieldLabel(node.key) }),
                            severity: jsonLdFormatIssueSeverity(node),
                        });
                    }
                } else if (config.allowedProtocols.length > 0 && !config.urlPattern) {
                    try {
                        const u = new URL(val);
                        if (!config.allowedProtocols.includes(u.protocol)) {
                            errors.push({
                                path: currentPath,
                                message: t(`jsonld.editor.validation.${config.invalidFormatKey}`, { field: jsonLdFieldLabel(node.key) }),
                                severity: jsonLdFormatIssueSeverity(node),
                            });
                        }
                    } catch {
                        errors.push({
                            path: currentPath,
                            message: t('jsonld.editor.validation.url_valid', { field: jsonLdFieldLabel(node.key) }),
                            severity: jsonLdFormatIssueSeverity(node),
                        });
                    }
                } else if (hasWrongProtocol) {
                    errors.push({
                        path: currentPath,
                        message: t(`jsonld.editor.validation.${config.wrongProtocolKey}`, { field: jsonLdFieldLabel(node.key) }),
                        severity: 'warning',
                    });
                } else {
                    try {
                        const u = new URL(val);
                        const genericProtocols = ['http:', 'https:', 'file:', 's3:'];
                        if (!genericProtocols.includes(u.protocol)) {
                            errors.push({
                                path: currentPath,
                                message: t('jsonld.editor.validation.url_valid', { field: jsonLdFieldLabel(node.key) }),
                                severity: jsonLdFormatIssueSeverity(node),
                            });
                        }
                    } catch {
                        errors.push({
                            path: currentPath,
                            message: t('jsonld.editor.validation.url_valid', { field: jsonLdFieldLabel(node.key) }),
                            severity: jsonLdFormatIssueSeverity(node),
                        });
                    }
                }
            } else {
                try {
                    const u = new URL(val);
                    let allowedProtocols: string[];
                    if (isAccessOrDownloadUrl && !ctx.enforceClientAccessUrl) {
                        allowedProtocols = ['http:', 'https:', 'file:', 's3:'];
                    } else {
                        allowedProtocols = ['http:', 'https:', 'file:'];
                        if (isAccessOrDownloadUrl && config?.allowedProtocols.includes('s3:')) {
                            allowedProtocols.push('s3:');
                        }
                    }
                    if (!allowedProtocols.includes(u.protocol)) {
                        errors.push({
                            path: currentPath,
                            message: t('jsonld.editor.validation.url_http_only', { field: jsonLdFieldLabel(node.key) }),
                            severity: 'warning',
                        });
                    }
                } catch {
                    errors.push({
                        path: currentPath,
                        message: t('jsonld.editor.validation.url_valid', { field: jsonLdFieldLabel(node.key) }),
                        severity: jsonLdFormatIssueSeverity(node),
                    });
                }
            }
        }

        // ── Hex (format: 'hex') ────────────────────────────────
        if (node.metadata.format === 'hex' && node.value) {
            if (!/^[0-9a-fA-F]+$/.test(String(node.value).trim())) {
                errors.push({ path: currentPath, message: `${jsonLdFieldLabel(node.key)} must be a valid hexadecimal string`, severity: jsonLdFormatIssueSeverity(node) });
            }
        }

        if (node.type === 'number' && node.value !== undefined && node.value !== null) {
            const numValue = Number(node.value);
            if (isNaN(numValue)) {
                errors.push({
                    path: currentPath,
                    message: `${node.key} must be a valid number`,
                    severity: jsonLdFormatIssueSeverity(node),
                });
            }
            if (node.metadata.xsdType === 'xsd:nonNegativeInteger' && numValue < 0) {
                errors.push({
                    path: currentPath,
                    message: `${node.key} must be non-negative`,
                    severity: jsonLdFormatIssueSeverity(node),
                });
            }
        }

        if (node.type === 'date' && node.value) {
            const datePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;
            if (!datePattern.test(String(node.value))) {
                errors.push({
                    path: currentPath,
                    message: `${node.key} must be a valid date`,
                    severity: jsonLdFormatIssueSeverity(node),
                });
            }
        }

        if (node.children) {
            for (const child of node.children) {
                errors.push(...validateNode(child, currentPath, ctx));
            }
        }

        return errors;
    };


    const validateTree = (
        tree: JsonLdNode[],
        itemType?: string,
        options?: { enforceClientAccessUrl?: boolean },
    ): ValidationResult => {
        const errors: ValidationError[] = [];
        const ctx: ValidateCtx = {
            enforceClientAccessUrl: options?.enforceClientAccessUrl !== false,
        };

        if (!tree || tree.length === 0) {
            return { valid: true, errors: [] };
        }

        for (const node of tree) {
            errors.push(...validateNode(node, '', ctx));
        }

        const mandatoryTopLevelKeys = getMandatoryDatasetFieldKeys();
        const hasData = tree.some(node => !isEffectivelyEmptyJsonLdNode(node));

        if (hasData) {
            const presentKeys = new Set(tree.map(n => n.key));
            for (const fieldKey of mandatoryTopLevelKeys) {
                if (!presentKeys.has(fieldKey)) {
                    errors.push({
                        path: fieldKey,
                        message: `${jsonLdFieldLabel(fieldKey)} is required`,
                        severity: 'error',
                    });
                }
            }
        }

        if (itemType && hasData) {
            const dctermsTypeId = getDctermsTypeIdFromTreeNodes(tree);
            if (hasItemTypeMismatchForDctermsId(dctermsTypeId, itemType)) {
                errors.push({
                    path: 'dcterms:type',
                    message: t('jsonld.editor.validation.item_type_mismatch'),
                    severity: 'error',
                });
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

        const mandatoryFields = getMandatoryDatasetFieldKeys();
        for (const field of mandatoryFields) {
            if (!(field in data)) {
                errors.push({
                    path: field,
                    message: `Required field ${field} is missing`,
                    severity: 'error',
                });
            }
        }

        return {
            valid: errors.filter(e => e.severity === 'error').length === 0,
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
