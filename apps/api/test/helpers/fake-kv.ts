/**
 * Fake KVNamespace para tests.
 *
 * Implementa la porción del contrato de Cloudflare KV que consume el
 * middleware de permisos: `get<T>(key, "json")`, `put(key, value, opts)`
 * con `expirationTtl`, `delete(key)` y `list({ prefix })`.
 */

interface Entry {
  value: string;
  expiresAt?: number;
}

export interface FakeKV extends KVNamespace {
  clear: () => void;
  _size: () => number;
}

export function createFakeKV(): FakeKV {
  const store = new Map<string, Entry>();

  const isExpired = (e: Entry): boolean =>
    e.expiresAt !== undefined && e.expiresAt <= Date.now();

  const kv = {
    async get(key: string, options?: unknown) {
      const entry = store.get(key);
      if (!entry) return null;
      if (isExpired(entry)) {
        store.delete(key);
        return null;
      }
      const type =
        typeof options === "string"
          ? options
          : (options as { type?: string } | undefined)?.type;
      if (type === "json") return JSON.parse(entry.value);
      return entry.value;
    },
    async put(
      key: string,
      value: string,
      options?: { expirationTtl?: number }
    ) {
      const ttl = options?.expirationTtl;
      store.set(key, {
        value,
        expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
      });
    },
    async delete(key: string) {
      store.delete(key);
    },
    async list(options?: { prefix?: string }) {
      const prefix = options?.prefix ?? "";
      const keys = Array.from(store.keys())
        .filter((k) => k.startsWith(prefix))
        .map((name) => ({ name }));
      return {
        keys,
        list_complete: true as const,
        cacheStatus: null,
      };
    },
    async getWithMetadata() {
      return { value: null, metadata: null, cacheStatus: null };
    },
    clear() {
      store.clear();
    },
    _size() {
      return store.size;
    },
  };

  return kv as unknown as FakeKV;
}
