/**
 * Time on the admin page: one format for dates, one clock for "how long ago".
 *
 * Shared so the table, the panel and the Expired badge agree on what "now" is.
 * The clock ticks every 30 s, so "in 5 minutes" counts down and a contract
 * turns Expired on screen without a reload.
 */
export function useAdminTime() {
  const dayjs = useDayjs();
  const now = ref(Date.now());
  const nowSeconds = computed(() => Math.floor(now.value / 1000));

  /**
   * Moves the clock to this instant. Call it when fresh data arrives: between
   * ticks the clock can be up to 30 s behind, and a record newer than the
   * clock would read "in a few seconds" instead of "a few seconds ago".
   */
  function tick(): void {
    now.value = Date.now();
  }

  useIntervalFn(tick, 30_000);

  /** "Sep, 11 2026 15:02" — the catalog's date format, plus the time. */
  function formatTime(seconds: number): string {
    return dayjs.unix(seconds).format("MMM, DD YYYY HH:mm");
  }

  /** "in 23 hours", "2 days ago", "3 months ago". */
  function fromNow(seconds: number): string {
    return dayjs.unix(seconds).from(dayjs.unix(nowSeconds.value));
  }

  /** For <time datetime>, so the moment is machine-readable too. */
  function isoTime(seconds: number): string {
    return dayjs.unix(seconds).toISOString();
  }

  return { nowSeconds, tick, formatTime, fromNow, isoTime };
}
