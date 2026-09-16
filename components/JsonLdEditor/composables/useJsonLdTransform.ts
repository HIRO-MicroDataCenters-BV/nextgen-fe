import { useJsonLdSchema } from './useJsonLdSchema';
import { useIdGenerator } from '@/composables/useIdGenerator';
import { createJsonLdTransform, type IdFactory } from './createJsonLdTransform';

export type { SerializeTreeOptions, IdFactory } from './createJsonLdTransform';

export function useJsonLdTransform(options?: { idFactory?: IdFactory }) {
    const { getFieldDefinition, distributionSchema } = useJsonLdSchema();
    const { generateDatasetId, generateDistributionId } = useIdGenerator();

    const generateId: IdFactory =
        options?.idFactory ??
        (() => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

    return createJsonLdTransform({
        getFieldDefinition,
        distributionSchema,
        generateDatasetId,
        generateDistributionId,
        generateId,
    });
}
