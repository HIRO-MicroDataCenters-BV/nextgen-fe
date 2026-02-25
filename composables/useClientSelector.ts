export type ClientType = "S3" | "local";
export type ClientStatus = "idle" | "checking" | "valid" | "error";

export const useClientSelector = () => {
    const selectedClient = useState<ClientType>("client_selector_type", () => "S3");
    const clientStatus = useState<ClientStatus>("client_selector_status", () => "idle");
    const clientError = useState<string | null>("client_selector_error", () => null);

    const { connectorHealthCheck } = useApi();
    const { t } = useI18n();

    const selectClient = async (type: ClientType) => {
        selectedClient.value = type;
        clientStatus.value = "checking";
        clientError.value = null;

        if (import.meta.client) {
            localStorage.setItem("selected_client", type);
        }

        try {
            const result = await connectorHealthCheck(type);
            if (result !== null && result !== undefined) {
                clientStatus.value = "valid";
            } else {
                clientStatus.value = "error";
                clientError.value = t("client_selector.status.error");
            }
        } catch {
            clientStatus.value = "error";
            clientError.value = t("client_selector.status.error");
        }
    };

    // Auto-run health check on first client-side load
    if (import.meta.client && clientStatus.value === "idle") {
        const stored = localStorage.getItem("selected_client") as ClientType | null;
        const initial: ClientType =
            stored === "S3" || stored === "local" ? stored : "S3";
        selectClient(initial);
    }

    const clearClient = () => {
        selectedClient.value = "S3";
        clientStatus.value = "idle";
        clientError.value = null;
        if (import.meta.client) {
            localStorage.removeItem("selected_client");
        }
    };

    const isClientValid = computed(() => clientStatus.value === "valid");

    return {
        selectedClient,
        clientStatus,
        clientError,
        isClientValid,
        selectClient,
        clearClient,
    };
};
