/**
 * localStorage access that never throws. Browsers refuse storage access when the user
 * blocks site data (SecurityError) and refuse writes when storage is full; the site keeps
 * working either way, it just doesn't remember things between visits.
 */

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage blocked or full: the value just isn't remembered.
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage blocked: nothing can have been stored.
  }
}
