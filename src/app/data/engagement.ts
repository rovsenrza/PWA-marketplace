/**
 * Lifehack reactions in the app. Legacy lifehacks.js works with the old globals
 * (lhCheckState, lhPollVotes, lhUsefulMine: the device; lhPollCounts, lhUsefulCounts: totals);
 * these are accessors onto the store. persistLhEngage / loadLhEngageState are the old names.
 */
import { createLocalEngagementRepository, type CommunityCounts, type DeviceEngagement } from '../../shared/data/engagement';

const repo = createLocalEngagementRepository(() => (window as unknown as { SEED: { demoCommunity: () => CommunityCounts } }).SEED.demoCommunity());

let device: DeviceEngagement = { checks: {}, votes: {}, useful: {} };
let community: CommunityCounts = { useful: {}, polls: {} };

export function loadLhEngageState(): void {
  device = repo.loadDevice();
  community = repo.loadCommunity();
}

export function persistLhEngage(): void {
  repo.saveDevice(device);
  repo.saveCommunity(community);
}

export const communityIsDemo = repo.communityIsDemo;

export function installEngagementAccessors(): void {
  const def = (name: string, get: () => unknown, set: (v: never) => void) =>
    Object.defineProperty(window, name, { configurable: true, get, set });
  def('lhCheckState', () => device.checks, (v) => { device.checks = v; });
  def('lhPollVotes', () => device.votes, (v) => { device.votes = v; });
  def('lhUsefulMine', () => device.useful, (v) => { device.useful = v; });
  def('lhPollCounts', () => community.polls, (v) => { community.polls = v; });
  def('lhUsefulCounts', () => community.useful, (v) => { community.useful = v; });
  /* до window.onload legacy видит стартовые демо-итоги, как раньше */
  loadLhEngageState();
}
