const STOPWORDS = new Set(['OF', 'THE', 'AND', 'PARTY']);
const ABBREV_RE = /^[A-Z0-9()&./-]{2,6}$/;
const MAX_ABBREV = 3;
const MIN_FONT = 7;
const FONT_RATIO = 0.34;

// Election-symbol-less parties fall back to a mono abbreviation box: the code itself when it is
// already an abbreviation (BJP, JD(U), IND), else the initials of the significant full-name words.
function abbreviate(code: string, full?: string): string {
  if (ABBREV_RE.test(code)) return code;
  const words = (full || code)
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((w) => w && !STOPWORDS.has(w));
  return (
    words
      .map((w) => w[0])
      .join('')
      .slice(0, MAX_ABBREV) || code.slice(0, MAX_ABBREV).toUpperCase()
  );
}

export function PartySymbol({
  code,
  full,
  src,
  size = 20,
}: {
  code: string;
  full?: string;
  src?: string | null;
  size?: number;
}) {
  const dim = { width: size, height: size };
  if (src)
    return (
      <img
        src={src}
        alt={`${full ?? code} election symbol`}
        title={full ?? code}
        loading='lazy'
        decoding='async'
        className='shrink-0 object-contain'
        style={dim}
      />
    );
  return (
    <span
      aria-hidden
      title={full ?? code}
      className='border-border text-ink-soft inline-grid shrink-0 place-items-center border font-mono leading-none'
      style={{ ...dim, fontSize: Math.max(MIN_FONT, Math.round(size * FONT_RATIO)) }}
    >
      {abbreviate(code, full)}
    </span>
  );
}
