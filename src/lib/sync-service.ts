import type { Script } from '@/types/script';

export interface SyncService {
  isEnabled(): boolean;
  pushScripts(scripts: Script[]): Promise<void>;
  pullScripts(): Promise<Script[]>;
}

export const offlineOnlySyncService: SyncService = {
  isEnabled: () => false,
  async pushScripts() {
    // TODO: Implement authenticated sync only after privacy, conflict handling,
    // account deletion, and Play Data Safety disclosures are finalised.
  },
  async pullScripts() {
    return [];
  },
};
