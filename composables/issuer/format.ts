/** "EHnYLZTcuf7R…ye62h" → "EHnYLZ…e62h": long KERI ids are unreadable in full. */
export const shortId = (id: string) =>
  id.length > 14 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;

/** Save a grant as `grant-<SAID>.json`. */
export const downloadGrantFile = (said: string, grant: unknown) => {
  const blob = new Blob([JSON.stringify(grant, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `grant-${said}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * A role name the issuer and policy engine can carry: starts with a letter,
 * then lowercase letters, digits, "-" or "_" (2–64 characters), e.g.
 * "data_steward". The policy engine itself only allows "_".
 */
export const isValidRoleName = (role: string): boolean =>
  /^[a-z][a-z0-9_-]{1,63}$/.test(role);

/** "data_steward" / "data-steward" → "Data steward" */
export const humanizeRole = (role: string): string => {
  const words = role.replace(/[-_]+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : role;
};
