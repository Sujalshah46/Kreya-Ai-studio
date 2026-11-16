export function readPreviewPreferences<T extends object>(key: string, fallback: T): T {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(key) ?? 'null');
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      const record = stored as Record<string, unknown>;
      return Object.fromEntries(Object.entries(fallback).map(([name, value]) => [
        name,
        typeof record[name] === typeof value && record[name] !== null ? record[name] : value
      ])) as T;
    }
  } catch {
    // Browsers can deny access to local storage.
  }
  return fallback;
}

export function savePreviewPreferences<T extends object>(key: string, value: T): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
