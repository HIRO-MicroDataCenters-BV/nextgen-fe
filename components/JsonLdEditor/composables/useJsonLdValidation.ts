import { useJsonLdSchema } from './useJsonLdSchema';
import { createJsonLdValidation } from '../validation/createJsonLdValidation';

export type { JsonLdValidationDeps } from '../validation/createJsonLdValidation';

export function useJsonLdValidation() {
    const { t } = useI18n();
    const { selectedClient } = useClientSelector();
    const { getMandatoryDatasetFieldKeys } = useJsonLdSchema();

    return createJsonLdValidation({
        t,
        getSelectedClient: () => selectedClient.value,
        getMandatoryDatasetFieldKeys,
    });
}
