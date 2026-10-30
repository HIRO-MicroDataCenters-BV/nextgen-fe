<template>
  <!-- Columns follow the content width (container query), not the window:
       the sidebar takes part of the window (the page sets @container). -->
  <div class="grid items-start gap-8 @3xl:grid-cols-[minmax(0,1fr)_340px]">
    <Card>
      <CardHeader>
        <CardTitle>{{ t("credentials.form.title") }}</CardTitle>
        <CardDescription>
          {{ t("credentials.form.description") }}
        </CardDescription>
      </CardHeader>
      <CardContent class="@container">
        <!-- novalidate: our own messages, not the browser's email popup -->
        <form class="flex flex-col gap-6" novalidate @submit.prevent="onSubmit">
          <section class="flex flex-col gap-4">
            <h3 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {{ t("credentials.form.section_who") }}
            </h3>
            <Field :data-invalid="!!errors.subjectAid">
              <FieldLabel for="subject-aid">
                {{ t("credentials.form.subject_aid") }}
                <span class="text-red-500" aria-hidden="true">*</span>
              </FieldLabel>
              <Input
                id="subject-aid"
                v-model="form.subjectAid"
                class="font-mono"
                :placeholder="t('credentials.form.aid_placeholder')"
                autocomplete="off"
                spellcheck="false"
              />
              <FieldDescription>
                {{ t("credentials.form.subject_aid_hint") }}
              </FieldDescription>
              <FieldError v-if="errors.subjectAid">
                {{ errors.subjectAid }}
              </FieldError>
            </Field>

            <!-- ds-login puts name and email in the login ticket (JWT) -->
            <div class="grid gap-4 @md:grid-cols-2">
              <Field :data-invalid="!!errors.name">
                <FieldLabel for="holder-name">
                  {{ t("credentials.form.name") }}
                  <span class="text-red-500" aria-hidden="true">*</span>
                </FieldLabel>
                <Input
                  id="holder-name"
                  v-model="form.name"
                  placeholder="Rahul Sharma"
                  autocomplete="off"
                />
                <FieldError v-if="errors.name">{{ errors.name }}</FieldError>
              </Field>

              <Field :data-invalid="!!errors.email">
                <FieldLabel for="holder-email">
                  {{ t("credentials.form.email") }}
                  <span class="text-red-500" aria-hidden="true">*</span>
                </FieldLabel>
                <Input
                  id="holder-email"
                  v-model="form.email"
                  type="email"
                  placeholder="name@institute.org"
                  autocomplete="off"
                />
                <FieldError v-if="errors.email">{{ errors.email }}</FieldError>
              </Field>
            </div>
          </section>

          <Separator />

          <section class="flex flex-col gap-4">
            <h3 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {{ t("credentials.form.section_what") }}
            </h3>
            <Field>
              <FieldLabel>
                {{ t("credentials.form.role") }}
                <span class="text-red-500" aria-hidden="true">*</span>
              </FieldLabel>
              <div class="grid gap-2 @md:grid-cols-2 @2xl:grid-cols-4" role="radiogroup">
                <button
                  v-for="role in roleOptions"
                  :key="role.value"
                  type="button"
                  role="radio"
                  :aria-checked="form.role === role.value"
                  class="flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                  :class="
                    form.role === role.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : ''
                  "
                  @click="form.role = role.value"
                >
                  <Icon :name="role.icon" class="size-4 text-primary" />
                  <span class="text-sm font-medium">{{ role.label }}</span>
                  <span class="text-xs text-muted-foreground">
                    {{ role.hint }}
                  </span>
                </button>
              </div>

              <FieldError v-if="errors.role" class="text-destructive">
                {{ errors.role }}
              </FieldError>
            </Field>

          </section>

          <Separator />

          <!-- Technical detail most operators never change -->
          <Collapsible v-model:open="advancedOpen">
            <CollapsibleTrigger
              class="flex w-full items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground"
              type="button"
            >
              {{ t("credentials.form.section_advanced") }}
              <Icon
                name="lucide:chevron-down"
                class="size-4 transition-transform"
                :class="advancedOpen ? 'rotate-180' : ''"
              />
            </CollapsibleTrigger>
            <CollapsibleContent class="pt-4">
              <Field :data-invalid="!!errors.schemaSaid">
                <FieldLabel for="schema-said">
                  {{ t("credentials.form.schema_said") }}
                  <span class="text-red-500" aria-hidden="true">*</span>
                </FieldLabel>
                <Input
                  id="schema-said"
                  v-model="form.schemaSaid"
                  class="font-mono"
                  autocomplete="off"
                  spellcheck="false"
                />
                <FieldDescription>
                  {{ t("credentials.form.schema_said_hint") }}
                </FieldDescription>
                <FieldError v-if="errors.schemaSaid">
                  {{ errors.schemaSaid }}
                </FieldError>
              </Field>
            </CollapsibleContent>
          </Collapsible>

          <div class="flex items-center justify-end gap-2">
            <span class="mr-auto text-xs text-muted-foreground">
              <span class="text-red-500" aria-hidden="true">*</span>
              {{ t("credentials.form.required_note") }}
            </span>
            <Button
              v-if="issued"
              type="button"
              variant="ghost"
              @click="startOver"
            >
              {{ t("credentials.form.new") }}
            </Button>
            <Button
              type="submit"
              :disabled="submitting || !issuerOnline"
            >
              <Spinner v-if="submitting" />
              <Icon v-else name="lucide:stamp" />
              {{ t("credentials.form.submit") }}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <!-- Live preview, styled as a notarised document: a draft while typing,
         sealed by the issuer once signed -->
    <aside class="flex flex-col gap-3 @3xl:sticky @3xl:top-20">
      <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {{ issued ? t("credentials.preview.issued_label") : t("credentials.preview.label") }}
      </span>

      <article
        class="overflow-hidden rounded-md border bg-card shadow-sm transition-colors"
        :class="issued ? 'border-emerald-500/60' : 'border-dashed border-muted-foreground/40'"
        data-testid="credential-preview"
      >
        <!-- Top band: grey while draft, green once sealed -->
        <div
          class="h-1.5 transition-colors"
          :class="issued ? 'bg-emerald-500' : 'bg-muted-foreground/25'"
        />

        <div class="flex flex-col gap-4 px-5 pb-5 pt-4">
          <div class="flex items-center justify-between text-xs">
            <span class="text-muted-foreground">
              {{ t("credentials.preview.kind") }}
            </span>
            <span
              class="flex items-center gap-1"
              :class="issued ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'"
            >
              <Icon
                :name="issued ? 'lucide:badge-check' : 'lucide:pencil-line'"
                class="size-3.5"
              />
              {{ issued ? t("credentials.preview.signed") : t("credentials.preview.draft") }}
            </span>
          </div>

          <div>
            <div class="font-serif text-2xl leading-tight">
              {{ previewRoleLabel }}
            </div>
            <div class="mt-1 text-sm text-muted-foreground">
              {{ t("credentials.preview.at") }}
              <span class="text-foreground">{{ previewInstitute }}</span>
              <template v-if="issued">
                · {{ t("credentials.preview.for") }}
                <span class="text-foreground">{{ previewName }}</span>
              </template>
            </div>
          </div>

          <!-- The seal -->
          <div
            class="flex items-center gap-3 rounded-md border p-3 transition-colors"
            :class="issued ? 'border-emerald-500/50' : 'border-dashed'"
          >
            <div
              class="flex size-11 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors"
              :class="
                issued
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-dashed border-muted-foreground/50 text-muted-foreground/60'
              "
            >
              <Icon name="lucide:stamp" class="size-5" />
            </div>

            <div v-if="issued" class="min-w-0 text-xs leading-relaxed">
              <div class="text-sm">
                {{ t("credentials.preview.sealed_by", { issuer: issuer?.issuer_name ?? "—" }) }}
              </div>
              <div class="flex flex-wrap items-center gap-x-1 text-muted-foreground">
                {{ formatDate(issuedAtOf(issued)) }} ·
                <button
                  type="button"
                  class="inline-flex items-center gap-1 font-mono hover:text-foreground"
                  :title="issued.said"
                  @click="copyText(issued.said, t('credentials.result.said_copied'))"
                >
                  {{ shortId(issued.said) }}
                  <Icon name="lucide:copy" class="size-3" />
                </button>
              </div>
            </div>
            <div v-else class="min-w-0 text-xs leading-relaxed text-muted-foreground">
              {{ t("credentials.preview.seal_pending", { issuer: issuer?.issuer_name ?? "—" }) }}
              <div class="mt-0.5">
                {{ t("credentials.preview.holder") }}:
                <span v-if="previewName" class="text-foreground">{{ previewName }} ·</span>
                <span
                  v-if="previewSubject"
                  class="font-mono text-foreground"
                  :title="previewSubject"
                >
                  {{ shortId(previewSubject) }}
                </span>
                <span
                  v-else
                  class="inline-block min-w-16 border-b border-dashed border-muted-foreground/50 text-muted-foreground/70"
                >
                  AID
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>

      <!-- What to do with the sealed document -->
      <div v-if="issued" class="flex flex-col gap-2">
        <div class="flex gap-2">
          <Button size="sm" class="flex-1" @click="copyText(grantJson, t('credentials.result.copied'))">
            <Icon name="lucide:copy" />
            {{ t("credentials.result.copy") }}
          </Button>
          <Button size="sm" variant="outline" class="flex-1" @click="downloadGrantFile(issued.said, issued.grant)">
            <Icon name="lucide:download" />
            {{ t("credentials.result.download") }}
          </Button>
        </div>
        <details class="text-xs">
          <summary class="cursor-pointer text-muted-foreground hover:text-foreground">
            {{ t("credentials.result.grant_json") }}
          </summary>
          <pre class="mt-2 max-h-72 overflow-auto rounded-md bg-muted p-3">{{ grantJson }}</pre>
        </details>
      </div>
      <p v-else class="text-xs text-muted-foreground">
        {{ t("credentials.preview.hint") }}
      </p>
    </aside>
  </div>
</template>

<script setup lang="ts">
import {
  CredentialIssuerError,
  grantClaims,
  isCesrIdentifier,
  issuableRoles,
  type CredentialRole,
} from "~/composables/issuer/credentialIssuerClient";
import {
  downloadGrantFile,
  humanizeRole,
  shortId,
} from "~/composables/issuer/format";
import { toIssuedEntry } from "~/composables/issuer/issuedHistory";
import { useCredentialIssuer } from "~/composables/issuer/useCredentialIssuer";
import type {
  IssueCredentialResponse,
  IssuerInfo,
} from "~/types/issuer.types";

// Placeholder schema until the issuer has a schema registry (it accepts any SAID).
// The OCA bundle the issuer is configured with on HUS (issuer.defaultOcaBundleSaid).
const DEFAULT_SCHEMA_SAID = "EA3UqX0yElhvuw-6fcAgr7gX58IOT8lK5VOqysjdR9hR";

// Same loose check most forms use: something@something.tld
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_ICONS: Record<CredentialRole, string> = {
  researcher: "lucide:flask-conical",
  data_provider: "lucide:database",
  operator: "lucide:user-check",
  site_admin: "lucide:shield",
};

defineProps<{
  issuer: IssuerInfo | null;
  issuerOnline: boolean;
}>();
const emit = defineEmits<{ issued: [credential: IssueCredentialResponse] }>();

const { t } = useI18n();
const dayjs = useDayjs();
const toaster = useToaster();
const issuerClient = useCredentialIssuer();

const formatDate = (iso: string) => dayjs(iso).format("D MMM YYYY, HH:mm");

// ── Form ──────────────────────────────────────────────────────────────
// Only the roles this user may issue (the issuer enforces the same rule):
// a site admin any role, an operator data providers and researchers.
const { authUser } = useAuthUser();
const allowedRoles = computed(() => issuableRoles(authUser.value?.role));
const roleOptions = computed(() =>
  allowedRoles.value.map((value) => ({
    value: value as string,
    icon: ROLE_ICONS[value],
    label: t(`credentials.roles.${value}.label`),
    hint: t(`credentials.roles.${value}.hint`),
  })),
);
/** The site credentials are issued for: the issuer stamps it; it is the signed-in user's site. */
const site = computed(() => authUser.value?.institute ?? "");

const form = reactive({
  subjectAid: "",
  schemaSaid: DEFAULT_SCHEMA_SAID,
  role: (issuableRoles(authUser.value?.role)[0] ?? "researcher") as string,
  name: "",
  email: "",
});
const errors = reactive<{
  subjectAid?: string;
  role?: string;
  schemaSaid?: string;
  name?: string;
  email?: string;
}>({});
const advancedOpen = ref(false);

const validate = (): boolean => {
  errors.subjectAid = isCesrIdentifier(form.subjectAid)
    ? undefined
    : t("credentials.form.invalid_identifier");
  errors.schemaSaid = isCesrIdentifier(form.schemaSaid)
    ? undefined
    : t("credentials.form.invalid_identifier");
  errors.role = allowedRoles.value.includes(form.role as CredentialRole)
    ? undefined
    : t("credentials.form.invalid_role");
  errors.name = form.name.trim() ? undefined : t("validation.required");
  errors.email = !form.email.trim()
    ? t("validation.required")
    : EMAIL_PATTERN.test(form.email.trim())
      ? undefined
      : t("validation.email");
  // Open the hidden section if that is where the problem is.
  if (errors.schemaSaid) advancedOpen.value = true;
  return (
    !errors.subjectAid &&
    !errors.name &&
    !errors.email &&
    !errors.role &&
    !errors.schemaSaid
  );
};

// ── Issue ─────────────────────────────────────────────────────────────
const submitting = ref(false);
const issued = ref<IssueCredentialResponse | null>(null);

const onSubmit = async () => {
  if (!validate()) return;
  submitting.value = true;
  try {
    issued.value = await issuerClient.issueCredential({
      subject_aid: form.subjectAid.trim(),
      schema_said: form.schemaSaid.trim(),
      // The claims ds-login requires; the issuer adds `institute` (its site).
      attributes: {
        role: form.role,
        name: form.name.trim(),
        email: form.email.trim(),
      },
    });
    emit("issued", issued.value);
    toaster.show("info", t("credentials.result.toast"));
  } catch (e) {
    toaster.show(
      "error",
      e instanceof CredentialIssuerError ? e.message : String(e),
    );
  } finally {
    submitting.value = false;
  }
};

const startOver = () => {
  issued.value = null;
  form.subjectAid = "";
  form.name = "";
  form.email = "";
};

// Editing the form after issuing starts a new draft; the issued card would
// otherwise show values that were never signed.
watch(
  () => [
    form.subjectAid,
    form.name,
    form.email,
    form.role,
    form.schemaSaid,
  ],
  () => {
    if (issued.value && !submitting.value) issued.value = null;
  },
);

// ── Preview card ──────────────────────────────────────────────────────
// After issuing, show what was signed; before, what is being typed.
const issuedClaims = computed(() => (issued.value ? grantClaims(issued.value.grant) : {}));
const previewRole = computed(() => String(issuedClaims.value.role ?? form.role));
const previewRoleLabel = computed(
  () =>
    roleOptions.value.find((role) => role.value === previewRole.value)?.label ??
    humanizeRole(previewRole.value),
);
const previewInstitute = computed(() => String(issuedClaims.value.institute ?? site.value));
const previewName = computed(() => String(issuedClaims.value.name ?? form.name.trim()));
const issuedAtOf = (credential: IssueCredentialResponse) =>
  toIssuedEntry(credential).issuedAt;
const previewSubject = computed(
  () => issued.value?.subject_aid ?? form.subjectAid.trim(),
);

const grantJson = computed(() =>
  issued.value ? JSON.stringify(issued.value.grant, null, 2) : "",
);

const { copy } = useClipboard();
const copyText = async (text: string, message: string) => {
  await copy(text);
  toaster.show("info", message);
};
</script>
