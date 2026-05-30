export const SRC = {
  eci: { label: 'Election Commission of India', url: 'https://results.eci.gov.in/' },
  prs: { label: 'PRS Legislative Research', url: 'https://prsindia.org/mptrack' },
  sansad: { label: 'Lok Sabha Secretariat', url: 'https://sansad.in/ls/members' },
  myneta: { label: 'ADR / MyNeta — sworn affidavit', url: 'https://myneta.info/LokSabha2024/' },
  mplads: { label: 'MPLADS eSAKSHI (MoSPI)', url: 'https://mplads.mospi.gov.in/' },
  bonds: { label: 'ECI / SBI electoral-bond disclosure', url: 'https://www.eci.gov.in/' },
  wikipedia: { label: 'Wikipedia (CC BY-SA)', url: 'https://en.wikipedia.org/' },
} as const;

export type SrcKey = keyof typeof SRC;

export const SRC_KEYS = Object.keys(SRC) as SrcKey[];
