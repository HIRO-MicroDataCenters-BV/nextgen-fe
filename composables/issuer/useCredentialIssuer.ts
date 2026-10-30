import { ACCESS_TOKEN_KEY } from "~/composables/useAuthUser";
import { createCredentialIssuerClient } from "./credentialIssuerClient";

/** ds-credential-issuer client, pointed at the configured issuer URL, with the session token. */
export const useCredentialIssuer = () => {
  const config = useRuntimeConfig();
  const token = useLocalStorage<string | null>(ACCESS_TOKEN_KEY, null);
  return createCredentialIssuerClient({
    baseUrl: config.public.apiCredentialIssuerUrl,
    getToken: () => token.value,
  });
};
