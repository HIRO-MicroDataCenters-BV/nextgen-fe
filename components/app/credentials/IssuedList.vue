<template>
  <div class="flex flex-col gap-3">
    <div class="overflow-hidden rounded-xl border bg-card">
      <div class="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <div class="relative w-full max-w-xs">
          <Icon
            name="lucide:search"
            class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="issued-search"
            v-model="query"
            class="h-8 pl-8"
            :placeholder="t('credentials.issued.search')"
          />
        </div>
        <div
          class="flex items-center gap-1"
          role="group"
          :aria-label="t('credentials.issued.filter_label')"
        >
          <Button
            v-for="option in filterOptions"
            :key="option"
            size="sm"
            :variant="filter === option ? 'secondary' : 'ghost'"
            :aria-pressed="filter === option"
            @click="filter = option"
          >
            {{ t(`credentials.issued.filter.${option}`) }}
            <span class="text-xs tabular-nums text-muted-foreground">
              {{ counts[option] }}
            </span>
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{{ t("credentials.issued.col_holder") }}</TableHead>
            <TableHead>{{ t("credentials.form.role") }}</TableHead>
            <TableHead>{{ t("credentials.issued.col_status") }}</TableHead>
            <TableHead>{{ t("credentials.result.issued_at") }}</TableHead>
            <TableHead>SAID</TableHead>
            <TableHead class="w-px" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="entry in filtered" :key="entry.said">
            <TableCell>
              <div>{{ entry.name || "—" }}</div>
              <div
                class="font-mono text-xs text-muted-foreground"
                :title="entry.subjectAid"
              >
                {{ shortId(entry.subjectAid) }}
                <span v-if="entry.email" class="font-sans">· {{ entry.email }}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{{ roleLabel(entry.role) }}</Badge>
              <span class="ml-1.5 text-xs text-muted-foreground">
                @{{ instituteOf(entry) }}
              </span>
            </TableCell>
            <TableCell>
              <span
                class="inline-flex items-center gap-1.5 text-sm"
                :class="stateTone[stateOf(entry)]"
              >
                <Icon :name="stateIcon[stateOf(entry)]" class="size-4" />
                {{ t(`credentials.issued.state.${stateOf(entry)}`) }}
              </span>
            </TableCell>
            <TableCell class="text-muted-foreground">
              {{ dayjs(entry.issuedAt).format("D MMM, HH:mm") }}
            </TableCell>
            <TableCell class="font-mono text-xs" :title="entry.said">
              {{ shortId(entry.said) }}
            </TableCell>
            <TableCell>
              <div class="flex justify-end gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  class="size-8"
                  :aria-label="t('credentials.result.copy')"
                  :title="t('credentials.result.copy')"
                  @click="emit('copy', JSON.stringify(entry.grant, null, 2))"
                >
                  <Icon name="lucide:copy" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  class="size-8"
                  :aria-label="t('credentials.result.download')"
                  :title="t('credentials.result.download')"
                  @click="downloadGrantFile(entry.said, entry.grant)"
                >
                  <Icon name="lucide:download" />
                </Button>
                <Button
                  v-if="stateOf(entry) !== 'revoked' && canRevoke(entry.role)"
                  size="icon"
                  variant="ghost"
                  class="size-8 text-destructive hover:text-destructive"
                  :aria-label="t('credentials.issued.revoke')"
                  :title="t('credentials.issued.revoke')"
                  @click="emit('revoke', entry)"
                >
                  <Icon name="lucide:ban" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-if="!filtered.length">
            <TableCell colspan="6" class="py-8 text-center text-muted-foreground">
              {{ entries.length ? t("credentials.issued.no_match") : t("credentials.issued.none") }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <p class="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon name="lucide:info" class="size-3.5" />
      {{ t("credentials.issued.local_note") }}
    </p>
  </div>
</template>

<script setup lang="ts">
import {
  downloadGrantFile,
  humanizeRole,
  shortId,
} from "~/composables/issuer/format";
import {
  countByState,
  filterIssued,
  type CredentialState,
  type IssuedEntry,
  type StatusFilter,
} from "~/composables/issuer/issuedHistory";

const props = defineProps<{
  entries: IssuedEntry[];
  /** Revocation state per credential SAID, from the issuer. */
  states: Record<string, CredentialState>;
  /** Whether the signed-in user may revoke a credential with this role. */
  canRevoke: (role: string) => boolean;
}>();
const emit = defineEmits<{
  copy: [text: string];
  revoke: [entry: IssuedEntry];
}>();

const { t, te } = useI18n();
const dayjs = useDayjs();

const roleLabel = (role: string) =>
  te(`credentials.roles.${role}.label`)
    ? t(`credentials.roles.${role}.label`)
    : humanizeRole(role);

// Older entries stored the institute as "org".
const instituteOf = (entry: IssuedEntry) => entry.institute ?? entry.org ?? "";

const stateOf = (entry: IssuedEntry): CredentialState =>
  props.states[entry.said] ?? "checking";
const stateTone: Record<CredentialState, string> = {
  valid: "text-emerald-600 dark:text-emerald-400",
  revoked: "text-destructive",
  checking: "text-muted-foreground",
  unknown: "text-amber-600 dark:text-amber-400",
};
const stateIcon: Record<CredentialState, string> = {
  valid: "lucide:circle-check",
  revoked: "lucide:ban",
  checking: "lucide:loader-circle",
  unknown: "lucide:circle-help",
};

const filterOptions: StatusFilter[] = ["all", "valid", "revoked"];
const filter = ref<StatusFilter>("all");
const query = ref("");
const counts = computed(() => countByState(props.entries, props.states));
const filtered = computed(() =>
  filterIssued(props.entries, props.states, filter.value, query.value),
);
</script>
