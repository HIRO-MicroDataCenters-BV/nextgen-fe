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

        if (node.type === 'uri' && node.value) {
            const urlPattern = /^(https?|file):\/\/.+/;
            if (!urlPattern.test(String(node.value))) {
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

        // Email validation for vcard:hasEmail
        if (node.key === 'vcard:hasEmail' && node.value) {
            const emailValue = String(node.value);
            if (emailValue.startsWith('mailto:')) {
                const email = emailValue.substring(7);
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(email)) {
                    errors.push({
                        path: currentPath,
                        message: 'Invalid email format',
                        severity: 'error',
                    });
                }
            } else {
                errors.push({
                    path: currentPath,
                    message: 'Email must start with mailto:',
                    severity: 'warning',
                });
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
