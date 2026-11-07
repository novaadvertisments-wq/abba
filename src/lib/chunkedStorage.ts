// Stores long text (like a login session) in a store that only allows short
// values, by cutting it into pieces and joining them again when read.
// This file has no phone-specific code, so it can be tested on a computer.

export type KeyValueStore = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

const CHUNK = 1500;

export function createChunkedStorage(
  secure: KeyValueStore,
  // The old, unencrypted place. Anything found there is moved into the secure
  // store, so people who were already logged in stay logged in.
  legacy?: KeyValueStore,
  chunkSize = CHUNK,
): KeyValueStore {
  const countKey = (k: string) => `${k}.count`;
  const partKey = (k: string, i: number) => `${k}.${i}`;

  async function readCount(key: string): Promise<number> {
    const raw = await secure.getItem(countKey(key));
    const n = raw === null ? 0 : Number(raw);
    return Number.isInteger(n) && n > 0 && n < 1000 ? n : 0;
  }

  async function removeParts(key: string) {
    const n = await readCount(key);
    await secure.removeItem(countKey(key));
    for (let i = 0; i < n; i++) await secure.removeItem(partKey(key, i));
  }

  const store: KeyValueStore = {
    async getItem(key) {
      const n = await readCount(key);
      if (n === 0) {
        if (!legacy) return null;
        const old = await legacy.getItem(key);
        if (old === null) return null;
        await store.setItem(key, old);
        await legacy.removeItem(key);
        return old;
      }
      let value = "";
      for (let i = 0; i < n; i++) {
        const part = await secure.getItem(partKey(key, i));
        if (part === null) return null; // damaged: treat as logged out
        value += part;
      }
      return value;
    },

    async setItem(key, value) {
      await removeParts(key);
      const pieces = Math.max(1, Math.ceil(value.length / chunkSize));
      for (let i = 0; i < pieces; i++) {
        await secure.setItem(partKey(key, i), value.slice(i * chunkSize, (i + 1) * chunkSize));
      }
      // The count is written last, so a half-finished save is never read.
      await secure.setItem(countKey(key), String(pieces));
    },

    async removeItem(key) {
      await removeParts(key);
      if (legacy) await legacy.removeItem(key);
    },
  };
  return store;
}
