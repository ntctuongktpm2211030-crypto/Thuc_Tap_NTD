/**
 * Helper to execute a fetch request and verify response.ok before parsing JSON.
 * Throws an Error if the HTTP status is not ok (2xx).
 */
export async function fetchJson<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`HTTP Error ${res.status}: ${res.statusText} for ${url}`);
  }
  return res.json();
}
