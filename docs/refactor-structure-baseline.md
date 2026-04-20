# Refactor Baseline Invariants

This document captures deterministic behavior targets before and during the component decomposition rollout.

## Heavy Modules Baseline

- `components/app/Table.vue`: route-query sync, server fetch, client search, selection/training payload.
- `components/JsonLdEditor/index.vue`: visual/code mode orchestration, extra metadata merge, parse/serialize.
- `components/app/Form.vue`: upload/delete file flow, dynamic options, discard guard.
- `composables/useApi.ts`: transport + toast/auth effects + payload normalization.
- `composables/useTableQueryState.ts`: state derivation and query serialization.
- `composables/useFilters.ts`: filter source state and active-filter derivation.

## Determinism Targets

- One URL sync write (`router.replace`) per logical table action.
- One network fetch per table pagination/filter action.
- Query roundtrip idempotency:
  - `buildQueryFromState(deriveStateFromQuery(q))` keeps semantic query equivalence.
- JSON-LD roundtrip safety:
  - `parse -> serialize -> parse` preserves user-entered semantic fields.
- No in-place mutation of API payload objects returned by schema validation.

## Rollout Gates

- Add unit tests for query derive/build and filter sanitation.
- Add transform tests for JSON-LD roundtrip and deterministic node IDs with custom id factory.
- Keep smoke checks on `my_catalog` and `marketplace` after each refactor PR.
