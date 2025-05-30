export function encodeId(id: string): string {
  try {
    new URL(id);
    const encoded = btoa(encodeURIComponent(id))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    return encoded;
  } catch (error) {
    throw new Error(`Wrong format for encoding: ${id}`);
  }
}
export function decodeId(hash: string): string {
  try {
    let base64 = hash.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const decoded = decodeURIComponent(atob(base64));
    new URL(decoded);

    return decoded;
  } catch (error) {
    throw new Error(`Wrong format for decoding: ${hash}`);
  }
}

export function isValidId(id: string): boolean {
  try {
    new URL(id);
    return true;
  } catch {
    return false;
  }
}

export function isValidHash(hash: string): boolean {
  try {
    decodeId(hash);
    return true;
  } catch {
    return false;
  }
}

export function convertId(input: string): string {
  if (isValidId(input)) {
    return encodeId(input);
  } else if (isValidHash(input)) {
    return decodeId(input);
  } else {
    throw new Error(`Wrong format: ${input}`);
  }
}
