<template>
  <p v-if="events.length === 0" class="text-sm text-muted-foreground">
    {{ t("admin.drawer.history_empty") }}
  </p>

  <ol v-else class="relative">
    <li
      v-for="(entry, index) in entries"
      :key="entry.event.seq"
      class="relative flex gap-3 pb-6 last:pb-0"
    >
      <!-- The line joining this marker to the next. -->
      <span
        v-if="index < entries.length - 1"
        class="absolute top-8 bottom-0 left-[15px] w-px bg-border"
        aria-hidden="true"
      />

      <span
        class="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border"
        :class="TONE_CLASS[entry.look.tone]"
        aria-hidden="true"
      >
        <Icon :name="entry.look.icon" mode="svg" class="size-4" />
      </span>

      <div class="min-w-0 flex-1 pt-1">
        <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p
            class="text-sm font-medium"
            :class="entry.look.kind === 'refused' && 'text-amber-700 dark:text-amber-300'"
          >
            {{ entry.title }}
          </p>
          <time
            class="text-xs whitespace-nowrap text-muted-foreground"
            :datetime="isoTime(entry.event.occurred_at)"
          >
            {{ formatTime(entry.event.occurred_at) }} · {{ fromNow(entry.event.occurred_at) }}
          </time>
        </div>

        <p v-if="entry.actor" class="mt-0.5 text-xs text-muted-foreground">
          {{ t("admin.event.by") }}
          <Tooltip v-if="entry.actor.source">
            <TooltipTrigger as-child>
              <span class="cursor-default font-medium text-foreground">
                {{ entry.actor.identity }}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {{ t("admin.event.identified_via", { source: entry.actor.source }) }}
            </TooltipContent>
          </Tooltip>
          <span v-else class="font-medium text-foreground">{{ entry.actor.identity }}</span>
          <span v-if="entry.actor.source" class="sr-only">
            ({{ t("admin.event.identified_via", { source: entry.actor.source }) }})
          </span>
        </p>
        <!-- A change nobody claimed is worth saying out loud; a registration is
             always the Generator's, so there it would only be noise. -->
        <p
          v-else-if="entry.look.kind !== 'registered'"
          class="mt-0.5 text-xs text-muted-foreground italic"
        >
          {{ t("admin.event.no_actor") }}
        </p>

        <blockquote
          v-if="entry.event.reason"
          class="mt-1.5 border-l-2 pl-3 text-sm text-muted-foreground italic"
        >
          {{ entry.event.reason }}
        </blockquote>
      </div>
    </li>
  </ol>
</template>

<script setup lang="ts">
import { useAdminTime } from "~/composables/admin/useAdminTime";
import type { AuditEventRecord } from "~/types/admin.types";
import { describeEvent, splitActor, type EventTone } from "~/utils/auditEvent";

const props = defineProps<{ events: AuditEventRecord[] }>();

const { t } = useI18n();
const { formatTime, fromNow, isoTime } = useAdminTime();

// Amber and emerald follow ToolCard.vue's pills; danger uses the theme's own
// destructive colour, as the Revoked badge does.
const TONE_CLASS: Record<EventTone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
};

const stateName = (status: string | null) =>
  status ? t(`admin.state.${status}`) : "";

const entries = computed(() =>
  props.events.map((event) => {
    const look = describeEvent(event);
    let title: string;
    switch (look.kind) {
      case "registered":
        title = t("admin.event.registered");
        break;
      case "changed":
        title = look.to ? t(`admin.event.changed_to.${look.to}`) : t("admin.event.changed");
        break;
      case "refused":
        title =
          look.from && look.to
            ? t("admin.event.refused", { from: stateName(look.from), to: stateName(look.to) })
            : t("admin.event.refused_plain");
        break;
      default:
        title = event.event_type;
    }
    return { event, look, title, actor: splitActor(event.actor) };
  }),
);
</script>
