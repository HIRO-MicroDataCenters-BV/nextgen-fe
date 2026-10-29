<template>
  <AppContent
    :title="t('credentials.title')"
    :description="t('credentials.subtitle')"
  >
    <!-- Same frame as Marketplace and My Catalog: the page name lives in the
         top bar breadcrumb, content starts with the tabs. -->
    <div class="@container mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-8 py-4">
      <!-- Issuing needs a site_admin or operator token (issuer:write); others would only get 403s. -->
      <Alert v-if="!canIssueCredentials(role)">
        <Icon name="lucide:lock" />
        <AlertTitle>{{ t("credentials.operators_only.title") }}</AlertTitle>
        <AlertDescription>{{ t("credentials.operators_only.description") }}</AlertDescription>
      </Alert>
      <template v-else>
      <Tabs v-model="tab" class="gap-4">
        <TabsList>
          <TabsTrigger value="issued">
            <Icon name="lucide:list" />
            {{ t("credentials.tabs.issued") }}
            <Badge
              v-if="issuedEntries.length"
              variant="secondary"
              class="ml-1 h-5 px-1.5"
            >
              {{ issuedEntries.length }}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="issue">
            <Icon name="lucide:stamp" />
            {{ t("credentials.tabs.issue") }}
          </TabsTrigger>
        </TabsList>

        <!-- Keep the form mounted so a half-filled draft survives a tab switch -->
        <TabsContent value="issue" force-mount class="data-[state=inactive]:hidden">
          <AppCredentialsIssueForm
            :issuer="issuer"
            :issuer-online="issuerState === 'online'"
            @issued="onIssued"
          />
        </TabsContent>

        <TabsContent value="issued">
          <AppCredentialsIssuedList
            :entries="issuedEntries"
            @issue="tab = 'issue'"
            @copy="copyText($event, t('credentials.result.copied'))"
            @revoke="toaster.show('info', t('credentials.issued.revoke_soon'))"
          />
        </TabsContent>
      </Tabs>

      <AppCredentialsIssuerHub
        :issuer="issuer"
        :issuer-state="issuerState"
        :issuer-error="issuerError"
        :witness-status="witnessStatus"
        :witness-checked="Boolean(config.public.dkmsWitnessUrl)"
        @retry="loadIssuer"
        @copy="copyText($event, t('credentials.hub.aid_copied'))"
      />
      </template>
    </div>
  </AppContent>
</template>

<script setup lang="ts">
import { StorageSerializers } from "@vueuse/core";
import {
  CredentialIssuerError,
  canIssueCredentials,
} from "~/composables/issuer/credentialIssuerClient";
import {
  ISSUED_HISTORY_KEY,
  addIssuedEntry,
  entriesForIssuer,
  toIssuedEntry,
  type IssuedEntry,
} from "~/composables/issuer/issuedHistory";
import { useCredentialIssuer } from "~/composables/issuer/useCredentialIssuer";
import {
  checkWitness,
  type WitnessStatus,
} from "~/composables/issuer/witnessClient";
import type {
  IssueCredentialResponse,
  IssuerInfo,
} from "~/types/issuer.types";

const { t } = useI18n();
const config = useRuntimeConfig();
const toaster = useToaster();
const issuerClient = useCredentialIssuer();
const { role } = useAuthUser();

const tab = ref<"issued" | "issue">("issued");

// ── Issuer and witness status ─────────────────────────────────────────
const issuer = ref<IssuerInfo | null>(null);
const issuerError = ref<string | null>(null);
const witnessStatus = ref<WitnessStatus | "checking">("checking");
const issuerState = computed<"checking" | "online" | "offline">(() =>
  issuer.value ? "online" : issuerError.value ? "offline" : "checking",
);

const loadIssuer = async () => {
  issuer.value = null;
  issuerError.value = null;
  witnessStatus.value = "checking";
  try {
    issuer.value = await issuerClient.getIssuerInfo();
  } catch (e) {
    issuerError.value =
      e instanceof CredentialIssuerError ? e.message : String(e);
    return;
  }
  if (!config.public.dkmsWitnessUrl) return;
  witnessStatus.value = await checkWitness({
    witnessUrl: config.public.dkmsWitnessUrl,
    aid: issuer.value.issuer_aid,
  });
};
onMounted(() => {
  if (canIssueCredentials(role.value)) loadIssuer();
});

// ── Issued history (this browser only, until the issuer can list) ────
const history = useLocalStorage<IssuedEntry[]>(ISSUED_HISTORY_KEY, [], {
  serializer: StorageSerializers.object,
});
const issuedEntries = computed(() =>
  issuer.value ? entriesForIssuer(history.value, issuer.value.issuer_aid) : [],
);

const onIssued = (credential: IssueCredentialResponse) => {
  history.value = addIssuedEntry(history.value, toIssuedEntry(credential));
};

const { copy } = useClipboard();
const copyText = async (text: string, message: string) => {
  await copy(text);
  toaster.show("info", message);
};
</script>
