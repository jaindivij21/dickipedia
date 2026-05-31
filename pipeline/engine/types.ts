export type Cadence = 'monthly' | 'semiannual';
export type Volume = 'mp';

export interface SourceDef {
  name: string;
  volume: Volume;
  cadence: Cadence;
  feedsScore: boolean;
  run: () => Promise<void>;
  stampAs?: string;
  note?: string;
}

export interface StageDef {
  name: string;
  run: () => Promise<void>;
}

export interface RunResult {
  ok: string[];
  failed: string[];
}
