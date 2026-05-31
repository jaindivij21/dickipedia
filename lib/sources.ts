import sourcesJson from '@/data/config/sources.json';

export type SrcKey =
  | 'eci'
  | 'prs'
  | 'sansad'
  | 'myneta'
  | 'mplads'
  | 'bonds'
  | 'wikipedia'
  | 'news';

export interface Source {
  label: string;
  url: string;
}

export const SRC = sourcesJson as Record<SrcKey, Source>;

export const SRC_KEYS = Object.keys(SRC) as SrcKey[];
