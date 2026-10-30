<template>
  <AppContent
    :title="t('credentials.title')"
    :description="t('credentials.subtitle')"
  >
    <!-- Same frame as Marketplace and My Catalog: the page name lives in the
         top bar breadcrumb. The issued list is the page; issuing opens a
         side panel. -->
    <div class="@container mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-8 py-4">
      <!-- Issuing needs a site_admin or operator token (issuer:write); others would only get 403s. -->
      <Alert v-if="!canIssueCredentials(role)">
        <Icon name="lucide:lock" />
        <AlertTitle>{{ t("credentials.operators_only.title") }}</AlertTitle>
        <AlertDescription>{{ t("credentials.operators_only.description") }}</AlertDescription>
      </Alert>
      <template v-else>
        <div class="flex flex-wrap items-center gap-3">
          <AppCredentialsIssuerHub
            class="min-w-0 flex-1"
            :issuer="issuer"
            :issuer-state="issuerState"
            :issuer-error="issuerError"
            :witness-status="witnessStatus"
            :witness-checked="Boolean(config.public.dkmsWitnessUrl)"
            @retry="loadIssuer"
            @copy="copyText($event, t('credentials.hub.aid_copied'))"
          />
          <!-- Issuing needs the issuer: off while it is being checked or offline.
               The wrapper carries the hint, as a disabled button gets no hover. -->
          <span :title="issuerState === 'online' ? undefined : t(`credentials.issue_unavailable.${issuerState}`)">
            <Button :disabled="issuerState !== 'online'" @click="issueOpen = true">
              <Icon name="lucide:plus" />
              {{ t("credentials.issue_button") }}
            </Button>
          </span>
        </div>

        <AppCredentialsIssuedList
          :entries="entries"
          :loading="listLoading"
          :error="listError"
          :can-revoke="canRevoke"
          @copy="copyGrant"
          @download="downloadGrant"
          @revoke="askRevoke"
        />
      </template>
    </div>

    <!-- Issue form in a side panel. Clicks outside don't close it, so a
         half-filled form isn't lost by accident. -->
    <Sheet v-model:open="issueOpen">
      <SheetContent
        side="right"
        class="w-full gap-0 overflow-y-auto sm:max-w-2xl"
        @interact-outside="(event: Event) => event.preventDefault()"
      >
        <SheetHeader class="sr-only">
          <SheetTitle>{{ t("credentials.form.title") }}</SheetTitle>
          <SheetDescription>{{ t("credentials.form.description") }}</SheetDescription>
        </SheetHeader>
        <div class="@container p-4 pt-12">
          <AppCredentialsIssueForm
            :issuer="issuer"
            :issuer-online="issuerState === 'online'"
            @issued="onIssued"
          />
        </div>
      </SheetContent>
    </Sheet>

    <AlertDialog :open="!!revokeTarget" @update:open="(open: boolean) => { if (!open) closeRevoke(); }">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t("credentials.revoke.title") }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{
              t("credentials.revoke.description", {
                name: revokeTarget?.name || shortId(revokeTarget?.subjectAid ?? ""),
                role: revokeTarget?.role ?? "",
              })
            }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Field>
          <FieldLabel for="revoke-reason">{{ t("credentials.revoke.reason") }}</FieldLabel>
          <Input
            id="revoke-reason"
            v-model="revokeReason"
            maxlength="500"
            :placeholder="t('credentials.revoke.reason_placeholder')"
          />
        </Field>
        <p v-if="revokeError" class="text-sm text-destructive">{{ revokeError }}</p>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="revoking">{{ t("credentials.revoke.cancel") }}</AlertDialogCancel>
          <Button variant="destructive" :disabled="revoking" @click="confirmRevoke">
            <Icon v-if="revoking" name="lucide:loader-circle" class="animate-spin" />
            {{ t("credentials.revoke.confirm") }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </AppContent>
</template>

<script setup lang="ts">
import {
  CredentialIssuerError,
  canIssueCredentials,
  issuableRoles,
} from "~/composables/issuer/credentialIssuerClient";
import { downloadGrantFile, shortId } from "~/composables/issuer/format";
import { fromSummary, type IssuedEntry } from "~/composables/issuer/issuedList";
import { useCredentialIssuer } from "~/composables/issuer/useCredentialIssuer";
import {
  checkWitness,
  type WitnessStatus,
} from "~/composables/issuer/witnessClient";
import type { IssuerInfo } from "~/types/issuer.types";

const { t } = useI18n();
const config = useRuntimeConfig();
const toaster = useToaster();
const issuerClient = useCredentialIssuer();
const { role } = useAuthUser();

const issueOpen = ref(false);

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
  loadList();
  if (!config.public.dkmsWitnessUrl) return;
  witnessStatus.value = await checkWitness({
    witnessUrl: config.public.dkmsWitnessUrl,
    aid: issuer.value.issuer_aid,
  });
};
onMounted(() => {
  if (canIssueCredentials(role.value)) loadIssuer();
});

// ── Issued credentials, from the issuer (everyone sees the same list) ─
const entries = ref<IssuedEntry[]>([]);
const listLoading = ref(false);
const listError = ref<string | null>(null);

const loadList = async () => {
  listLoading.value = true;
  listError.value = null;
  try {
    entries.value = (await issuerClient.listCredentials()).map(fromSummary);
  } catch (e) {
    listError.value = e instanceof CredentialIssuerError ? e.message : String(e);
  } finally {
    listLoading.value = false;
  }
};

const onIssued = () => loadList();

// The list leaves the grant out; fetch it when it is copied or downloaded.
const grantOf = async (entry: IssuedEntry) => {
  try {
    const { grant } = await issuerClient.getCredential(entry.said);
    if (grant) return grant;
    toaster.show("error", t("credentials.issued.no_grant"));
  } catch (e) {
    toaster.show("error", e instanceof CredentialIssuerError ? e.message : String(e));
  }
  return null;
};
const copyGrant = async (entry: IssuedEntry) => {
  const grant = await grantOf(entry);
  if (grant) await copyText(JSON.stringify(grant, null, 2), t("credentials.result.copied"));
};
const downloadGrant = async (entry: IssuedEntry) => {
  const grant = await grantOf(entry);
  if (grant) downloadGrantFile(entry.said, grant);
};

// The issuer lets each role revoke what it may issue.
const canRevoke = (credentialRole: string) =>
  (issuableRoles(role.value) as string[]).includes(credentialRole);

const revokeTarget = ref<IssuedEntry | null>(null);
const revokeReason = ref("");
const revokeError = ref<string | null>(null);
const revoking = ref(false);

const askRevoke = (entry: IssuedEntry) => {
  revokeTarget.value = entry;
  revokeReason.value = "";
  revokeError.value = null;
};
const closeRevoke = () => {
  if (!revoking.value) revokeTarget.value = null;
};
const confirmRevoke = async () => {
  const entry = revokeTarget.value;
  if (!entry) return;
  revoking.value = true;
  revokeError.value = null;
  try {
    await issuerClient.revokeCredential(entry.said, revokeReason.value.trim());
    toaster.show("info", t("credentials.revoke.done"));
    loadList();
    revoking.value = false;
    revokeTarget.value = null;
  } catch (e) {
    revokeError.value =
      e instanceof CredentialIssuerError ? e.message : String(e);
    revoking.value = false;
  }
};

const { copy } = useClipboard();
const copyText = async (text: string, message: string) => {
  await copy(text);
  toaster.show("info", message);
};
</script>
