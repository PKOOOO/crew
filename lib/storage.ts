import type { SavedScript } from "@/types/chat";

const STORAGE_KEY = "waSimScripts";

const EMPTY: SavedScript[] = [];

/**
 * Cached snapshot so `getScripts()` returns a stable reference between writes
 * — required by useSyncExternalStore, which compares snapshots by identity.
 */
let cache: SavedScript[] | null = null;
const listeners = new Set<() => void>();

function isSavedScript(value: unknown): value is SavedScript {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<SavedScript>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.chatListItem === "object" &&
    candidate.chatListItem !== null &&
    Array.isArray(candidate.events)
  );
}

function read(): SavedScript[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(isSavedScript);
  } catch {
    return EMPTY;
  }
}

function write(scripts: SavedScript[]): void {
  cache = scripts;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
    } catch {
      // Quota or privacy mode — keep the in-memory copy and carry on.
    }
  }
  for (const listener of listeners) listener();
}

/** All saved scripts. Empty array when nothing has been saved yet. */
export function getScripts(): SavedScript[] {
  if (cache === null) cache = read();
  return cache;
}

/** Inserts or replaces a script by id. */
export function saveScript(script: SavedScript): void {
  const scripts = getScripts();
  const index = scripts.findIndex((item) => item.id === script.id);
  write(
    index === -1
      ? [...scripts, script]
      : scripts.map((item) => (item.id === script.id ? script : item)),
  );
}

/** Removes a script by id. */
export function deleteScript(id: string): void {
  write(getScripts().filter((script) => script.id !== id));
}

/* --------------------- useSyncExternalStore plumbing --------------------- */

export function subscribeToScripts(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Server render always starts from the sample data (no localStorage there). */
export function getServerScripts(): SavedScript[] {
  return EMPTY;
}
