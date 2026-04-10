export type ClientType = string;
export type ClientStatus = "idle" | "checking" | "valid" | "error";

export const useClientSelector = () => {
    const selectedClient = useState<ClientType>("client_selector_type", () => "s3");
    const clientStatus = useState<ClientStatus>("client_selector_status", () => "idle");
    const clientError = useState<string | null>("client_selector_error", () => null);
    const availableClients = useState<string[]>("client_selector_available", () => []);

    const { getConnectorMetadata, getDataproducts } = useApi();

    const selectClient = async (type: ClientType) => {
        selectedClient.value = type;
        clientStatus.value = "checking";
        clientError.value = null;

        if (import.meta.client) {
            localStorage.setItem("selected_client", type);
        }

        try {
            const result = await getDataproducts(type || "local");
            if (result !== null) {
                clientStatus.value = "valid";
                clientError.value = null;
            } else {
                clientStatus.value = "error";
                clientError.value = null;
            }
        } catch {
            clientStatus.value = "error";
            clientError.value = null;
        }
    };

    const initClient = async () => {
        if (!import.meta.client) return;

        const meta = await getConnectorMetadata();
        if (meta?.supported_interfaces?.length) {
            availableClients.value = meta.supported_interfaces;
        }

        const stored = localStorage.getItem("selected_client");
        const first = availableClients.value[0] ?? "s3";
        const initial: ClientType =
            stored && availableClients.value.includes(stored) ? stored : first;

        await selectClient(initial);
    };

    if (import.meta.client && clientStatus.value === "idle") {
        initClient();
    }

    const clearClient = () => {
        const first = availableClients.value[0] ?? "s3";
        selectedClient.value = first;
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
        availableClients,
        isClientValid,
        selectClient,
        clearClient,
    };
};
