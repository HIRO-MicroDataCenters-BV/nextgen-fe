<template>
  <div class="flex flex-col gap-6">
    <!-- Empty: an invitation, not an apology -->
    <div
      v-if="!entries.length"
      class="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center"
    >
      <div
        class="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"
      >
        <Icon name="lucide:stamp" class="size-6" />
      </div>
      <div class="font-medium">{{ t("credentials.issued.empty_title") }}</div>
      <p class="max-w-sm text-sm text-muted-foreground">
        {{ t("credentials.issued.empty_body") }}
      </p>
      <Button @click="emit('issue')">
        <Icon name="lucide:plus" />
        {{ t("credentials.form.submit") }}
      </Button>
    </div>

    <template v-else>
      <div class="grid gap-3 @xl:grid-cols-3">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-lg bg-muted/60 px-4 py-3"
        >
          <div class="text-xs text-muted-foreground">{{ stat.label }}</div>
          <div class="text-2xl font-semibold">{{ stat.value }}</div>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border bg-card">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div class="relative w-full max-w-xs">
            <Icon
              name="lucide:search"
              class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              v-model="query"
              class="h-8 pl-8"
              :placeholder="t('credentials.issued.search')"
            />
          </div>
          <Button size="sm" @click="emit('issue')">
            <Icon name="lucide:plus" />
            {{ t("credentials.form.submit") }}
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t("credentials.issued.col_holder") }}</TableHead>
              <TableHead>{{ t("credentials.form.name") }}</TableHead>
              <TableHead>{{ t("credentials.form.role") }}</TableHead>
              <TableHead>{{ t("credentials.form.institute") }}</TableHead>
              <TableHead>{{ t("credentials.result.issued_at") }}</TableHead>
              <TableHead>SAID</TableHead>
              <TableHead class="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="entry in filtered" :key="entry.said">
              <TableCell class="font-mono text-xs" :title="entry.subjectAid">
                {{ shortId(entry.subjectAid) }}
              </TableCell>
              <TableCell>
                <div>{{ entry.name || "—" }}</div>
                <div v-if="entry.email" class="text-xs text-muted-foreground">
                  {{ entry.email }}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{{ roleLabel(entry.role) }}</Badge>
              </TableCell>
              <TableCell>{{ instituteOf(entry) }}</TableCell>
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
                    size="icon"
                    variant="ghost"
                    class="size-8 text-muted-foreground"
                    :aria-label="t('credentials.issued.revoke')"
                    :title="t('credentials.issued.revoke_soon')"
                    @click="emit('revoke')"
                  >
                    <Icon name="lucide:ban" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="!filtered.length">
              <TableCell colspan="7" class="py-8 text-center text-muted-foreground">
                {{ t("credentials.issued.no_match") }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <p class="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon name="lucide:info" class="size-3.5" />
        {{ t("credentials.issued.local_note") }}
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  downloadGrantFile,
  humanizeRole,
  shortId,
} from "~/composables/issuer/format";
import {
  summarizeIssued,
  type IssuedEntry,
} from "~/composables/issuer/issuedHistory";

const props = defineProps<{ entries: IssuedEntry[] }>();
const emit = defineEmits<{ issue: []; copy: [text: string]; revoke: [] }>();

const { t, te } = useI18n();
const dayjs = useDayjs();

const roleLabel = (role: string) =>
  te(`credentials.roles.${role}.label`)
    ? t(`credentials.roles.${role}.label`)
    : humanizeRole(role);

// Older entries stored the institute as "org".
const instituteOf = (entry: IssuedEntry) => entry.institute ?? entry.org ?? "";

const stats = computed(() => {
  const summary = summarizeIssued(props.entries);
  return [
    { label: t("credentials.issued.stat_total"), value: summary.total },
    { label: t("credentials.issued.stat_today"), value: summary.today },
    { label: t("credentials.issued.stat_holders"), value: summary.holders },
  ];
});

const query = ref("");
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.entries;
  return props.entries.filter((entry) =>
    [
      entry.subjectAid,
      entry.said,
      entry.role,
      instituteOf(entry),
      entry.name ?? "",
      entry.email ?? "",
    ].some((value) => value.toLowerCase().includes(q)),
  );
});
</script>
