/**
 * How history entries are presented on the admin page. Plain functions, no Vue.
 */
import type { AuditEventRecord, ContractStatus } from "~/types/admin.types";

export type EventKind = "registered" | "changed" | "refused" | "other";

/** How loudly an event should read: refused attempts must catch the eye. */
export type EventTone = "neutral" | "success" | "warning" | "danger";

export interface EventDescription {
  kind: EventKind;
  tone: EventTone;
  icon: string;
  from: ContractStatus | null;
  to: ContractStatus | null;
}

const CHANGE_LOOK: Record<ContractStatus, { tone: EventTone; icon: string }> = {
  revoked: { tone: "danger", icon: "lucide:ban" },
  completed: { tone: "neutral", icon: "lucide:check" },
  cancelled: { tone: "neutral", icon: "lucide:x" },
  // The state machine never allows a move back to active, but the ledger is
  // the record of what happened, and this must not break if one ever appears.
  active: { tone: "success", icon: "lucide:rotate-ccw" },
};

export function describeEvent(
  event: Pick<AuditEventRecord, "event_type" | "from_status" | "to_status">,
): EventDescription {
  const { from_status: from, to_status: to } = event;
  switch (event.event_type) {
    case "contract.registered":
      return { kind: "registered", tone: "neutral", icon: "lucide:file-plus", from, to };
    case "contract.status_changed":
      return {
        kind: "changed",
        ...(to ? CHANGE_LOOK[to] : { tone: "neutral", icon: "lucide:circle-dot" }),
        from,
        to,
      };
    case "contract.status_change_rejected":
      // Amber, not red: nothing was damaged — it was stopped. Still the entry
      // an operator most needs to notice.
      return { kind: "refused", tone: "warning", icon: "lucide:shield-alert", from, to };
    default:
      // Kinds this page does not know yet (data.accessed is planned) still
      // render, rather than disappearing from the history.
      return { kind: "other", tone: "neutral", icon: "lucide:circle-dot", from, to };
  }
}

/**
 * An actor is "source:identity" — dev-allowlist:rahul@..., later dex:rahul@...
 * The identity is what people read; the source says how far to trust it.
 */
export function splitActor(
  actor: string | null,
): { source: string; identity: string } | null {
  if (!actor) return null;
  const colon = actor.indexOf(":");
  // The Clearing House refuses actors without a source, but a history screen
  // should show what is stored rather than hide it.
  if (colon <= 0) return { source: "", identity: actor };
  return { source: actor.slice(0, colon), identity: actor.slice(colon + 1) };
}
