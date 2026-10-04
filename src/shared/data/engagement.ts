/**
 * Lifehack reactions: «это сработало», polls, checklists. Two kinds of data:
 *   - the device's own state (my checklist, my vote, my «полезно») stays local even with a server;
 *   - community totals (how many found it useful, how people voted) are meaningful only on a server.
 * Without a server the totals are DEMO numbers from the seed plus this browser's own clicks (communityIsDemo).
 */
import { StorageKeys } from '../storage/keys';
import { readJSON, writeJSON } from '../storage/local-store';

export interface DeviceEngagement {
  checks: Record<string, unknown>;
  votes: Record<string, string>;
  useful: Record<string, boolean>;
}
export interface CommunityCounts {
  useful: Record<string, number>;
  polls: Record<string, Record<string, number>>;
}

export interface EngagementRepository {
  loadDevice(): DeviceEngagement;
  saveDevice(d: DeviceEngagement): void;
  loadCommunity(): CommunityCounts;
  saveCommunity(c: CommunityCounts): void;
  /** true while the totals aren't real (no server) */
  readonly communityIsDemo: boolean;
}

const obj = <T extends object>(v: unknown, fallback: T): T => (v && typeof v === 'object' && !Array.isArray(v) ? (v as T) : fallback);

/** Totals: what's stored wins; the demo seed fills missing items (as in the prototype). */
export function mergeCommunity(demo: CommunityCounts, stored: { useful?: unknown; polls?: unknown }): CommunityCounts {
  const useful = { ...obj<Record<string, number>>(stored.useful, { ...demo.useful }) };
  for (const [id, n] of Object.entries(demo.useful)) if (useful[id] == null) useful[id] = n;
  const polls = { ...obj<Record<string, Record<string, number>>>(stored.polls, {}) };
  for (const [id, c] of Object.entries(demo.polls)) if (!polls[id]) polls[id] = { ...c };
  return { useful, polls };
}

export function createLocalEngagementRepository(demo: () => CommunityCounts): EngagementRepository {
  return {
    communityIsDemo: true,
    loadDevice: () => ({
      checks: obj(readJSON(StorageKeys.lifehackChecks, {}), {}),
      votes: obj(readJSON(StorageKeys.lifehackPollVotes, {}), {}),
      useful: obj(readJSON(StorageKeys.lifehackUsefulMine, {}), {}),
    }),
    saveDevice: (d) => {
      writeJSON(StorageKeys.lifehackChecks, d.checks);
      writeJSON(StorageKeys.lifehackPollVotes, d.votes);
      writeJSON(StorageKeys.lifehackUsefulMine, d.useful);
    },
    loadCommunity: () => mergeCommunity(demo(), {
      useful: readJSON<unknown>(StorageKeys.lifehackUsefulCounts, null),
      polls: readJSON<unknown>(StorageKeys.lifehackPollCounts, null),
    }),
    saveCommunity: (c) => {
      writeJSON(StorageKeys.lifehackPollCounts, c.polls);
      writeJSON(StorageKeys.lifehackUsefulCounts, c.useful);
    },
  };
}
