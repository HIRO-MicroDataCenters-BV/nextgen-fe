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
              <span v-if="entry.institute" class="ml-1.5 text-xs text-muted-foreground">
                @{{ entry.institute }}
              </span>
            </TableCell>
            <TableCell>
              <span
                class="inline-flex items-center gap-1.5 text-sm"
                :class="stateTone[entry.state]"
                :title="revokedHint(entry)"
              >
                <Icon :name="stateIcon[entry.state]" class="size-4" />
                {{ t(`credentials.issued.state.${entry.state}`) }}
              </span>
            </TableCell>
            <TableCell class="text-muted-foreground">
              <div>{{ dayjs(entry.issuedAt).format("D MMM, HH:mm") }}</div>
              <div class="text-xs" :title="entry.issuedBy">
                {{ t("credentials.issued.by", { who: issuer(entry.issuedBy) }) }}
              </div>
            </TableCell>
            <TableCell class="font-mono text-xs" :title="entry.said">
              {{ shortId(entry.said) }}
            </TableCell>
            <TableCell>
              <div class="flex justify-end gap-1">
                <!-- A disabled button gets no hover, so the hint sits on a wrapper -->
                <span class="flex gap-1" :title="entry.hasGrant ? undefined : t('credentials.issued.no_grant')">
                  <Button
                    size="icon"
                    variant="ghost"
                    class="size-8"
                    :disabled="!entry.hasGrant"
                    :aria-label="t('credentials.result.copy')"
                    :title="entry.hasGrant ? t('credentials.result.copy') : undefined"
                    @click="emit('copy', entry)"
                  >
                    <Icon name="lucide:copy" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    class="size-8"
                    :disabled="!entry.hasGrant"
                    :aria-label="t('credentials.result.download')"
                    :title="entry.hasGrant ? t('credentials.result.download') : undefined"
                    @click="emit('download', entry)"
                  >
                    <Icon name="lucide:download" />
                  </Button>
                </span>
                <Button
                  v-if="entry.state !== 'revoked' && canRevoke(entry.role)"
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
              <span v-if="error" class="text-destructive">{{ error }}</span>
              <span v-else-if="loading">{{ t("credentials.issued.loading") }}</span>
              <span v-else-if="entries.length">{{ t("credentials.issued.no_match") }}</span>
              <span v-else>{{ t("credentials.issued.none") }}</span>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <p class="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon name="lucide:info" class="size-3.5" />
      {{ t("credentials.issued.source_note") }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { humanizeRole, shortId } from "~/composables/issuer/format";
import {
  countByState,
  filterIssued,
  type IssuedEntry,
  type StatusFilter,
} from "~/composables/issuer/issuedList";

const props = defineProps<{
  entries: IssuedEntry[];
  /** Whether the signed-in user may revoke a credential with this role. */
  canRevoke: (role: string) => boolean;
  loading?: boolean;
  error?: string | null;
}>();
const emit = defineEmits<{
  copy: [entry: IssuedEntry];
  download: [entry: IssuedEntry];
  revoke: [entry: IssuedEntry];
}>();

const { t, te } = useI18n();
const dayjs = useDayjs();

const roleLabel = (role: string) =>
  te(`credentials.roles.${role}.label`)
    ? t(`credentials.roles.${role}.label`)
    : humanizeRole(role);

const issuer = (who: string) => (who === "bootstrap" ? t("credentials.issued.bootstrap") : shortId(who));

const revokedHint = (entry: IssuedEntry) =>
  entry.state === "revoked"
    ? t("credentials.issued.revoked_hint", {
        when: entry.revokedAt ? dayjs(entry.revokedAt).format("D MMM, HH:mm") : "—",
        who: issuer(entry.revokedBy ?? ""),
        reason: entry.revokeReason || t("credentials.issued.no_reason"),
      })
    : undefined;

const stateTone: Record<IssuedEntry["state"], string> = {
  valid: "text-emerald-600 dark:text-emerald-400",
  revoked: "text-destructive",
};
const stateIcon: Record<IssuedEntry["state"], string> = {
  valid: "lucide:circle-check",
  revoked: "lucide:ban",
};

const filterOptions: StatusFilter[] = ["all", "valid", "revoked"];
const filter = ref<StatusFilter>("all");
const query = ref("");
const counts = computed(() => countByState(props.entries));
const filtered = computed(() => filterIssued(props.entries, filter.value, query.value));
</script>
