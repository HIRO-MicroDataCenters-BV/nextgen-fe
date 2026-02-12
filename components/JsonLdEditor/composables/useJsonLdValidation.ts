import type { JsonLdNode, ValidationResult, ValidationError } from '../types/editor.types';
import { useJsonLdSchema } from './useJsonLdSchema';

export function useJsonLdValidation() {
    const { getRequiredFields, getFieldDefinition: _getFieldDefinition } = useJsonLdSchema();

    const validateNode = (node: JsonLdNode, path: string = ''): ValidationError[] => {
        const errors: ValidationError[] = [];
        const currentPath = path ? `${path}.${node.key}` : node.key;

        if (node.metadata.required && !node.value && (!node.children || node.children.length === 0)) {
            errors.push({
                path: currentPath,
                message: `${node.key} is required`,
                severity: 'error',
            });
        }

        if (node.type === 'uri' && node.value) {
            const urlPattern = /^(https?|file):\/\/.+/;
            if (!urlPattern.test(String(node.value))) {
                errors.push({
                    path: currentPath,
                    message: `${node.key} must be a valid URI`,
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

        if (node.children) {
            for (const child of node.children) {
                errors.push(...validateNode(child, currentPath));
            }
        }

        return errors;
    };

    const validateTree = (tree: JsonLdNode[]): ValidationResult => {
        const errors: ValidationError[] = [];

        for (const node of tree) {
            errors.push(...validateNode(node));
        }

        const requiredDatasetFields = getRequiredFields('dataset');
        const presentKeys = tree.map(node => node.key);

        for (const requiredField of requiredDatasetFields) {
            if (!presentKeys.includes(requiredField)) {
                errors.push({
                    path: requiredField,
                    message: `Required field ${requiredField} is missing`,
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

    return {
        validateNode,
        validateTree,
        validateJsonLd,
    };
}
