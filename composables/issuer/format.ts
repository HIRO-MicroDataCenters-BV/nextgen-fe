/** "EHnYLZTcuf7R…ye62h" → "EHnYLZ…e62h": long KERI ids are unreadable in full. */
export const shortId = (id: string) =>
  id.length > 14 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;

/**
 * File name for a holder's grant, matching their key file:
 * "HUS Researcher 2" → "hus-researcher-2.grant.json". Without a usable
 * name it falls back to "grant-<SAID>.json".
 */
export const grantFileName = (said: string, holderName?: string | null) => {
  const slug = (holderName ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug ? `${slug}.grant.json` : `grant-${said}.json`;
};

/** Save a grant as `<holder-name>.grant.json` (see `grantFileName`). */
export const downloadGrantFile = (said: string, grant: unknown, holderName?: string | null) => {
  const blob = new Blob([JSON.stringify(grant, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = grantFileName(said, holderName);
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
