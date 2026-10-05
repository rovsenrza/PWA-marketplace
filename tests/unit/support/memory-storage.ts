/* fake Storage: the quota overflows on one key */
export function memoryStorage(failKey?: string): Storage & { dump: Record<string, string> } {
  const dump: Record<string, string> = {};
  return {
    dump,
    get length() { return Object.keys(dump).length; },
    clear: () => { for (const k of Object.keys(dump)) delete dump[k]; },
    key: (i) => Object.keys(dump)[i] ?? null,
    getItem: (k) => (k in dump ? dump[k] : null),
    removeItem: (k) => { delete dump[k]; },
    setItem: (k, v) => {
      if (k === failKey) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; }
      dump[k] = String(v);
    },
  } as Storage & { dump: Record<string, string> };
}
