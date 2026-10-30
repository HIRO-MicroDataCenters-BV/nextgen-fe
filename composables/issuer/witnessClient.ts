/**
 * Asks a DKMS witness whether it holds an identifier's key event log (KEL).
 *
 * ds-login verifies a credential by fetching the issuer's KEL from a witness.
 * If no witness has it, every credential from that issuer is rejected at login,
 * however valid its signature. A keriox witness answers GET /oobi/<aid> with
 * 200 and an empty body for an identifier it does not know.
 */

export type WitnessStatus = "published" | "missing" | "unknown";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export async function checkWitness(options: {
  witnessUrl: string;
  aid: string;
  fetch?: FetchLike;
  timeoutMs?: number;
}): Promise<WitnessStatus> {
  const witnessUrl = options.witnessUrl.replace(/\/+$/, "");
  if (!witnessUrl || !options.aid) return "unknown";
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init));

  try {
    const response = await doFetch(`${witnessUrl}/oobi/${options.aid}`, {
      signal: AbortSignal.timeout(options.timeoutMs ?? 5000),
    });
    if (response.status === 404) return "missing";
    if (!response.ok) return "unknown";
    // The KEL is a CESR stream whose events name the identifier ("i").
    const body = await response.text();
    return body.includes(options.aid) ? "published" : "missing";
  } catch {
    return "unknown";
  }
}
