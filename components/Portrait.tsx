'use client';
import { useState } from 'react';

const HONORIFIC = /^(Shri|Smt|Dr|Adv|Prof|Kumari|Km|Mr|Mrs|Ms|Md|Haji|Maulana|Col|Gen|Capt)\.?\s+/i;

// first-name + last-name initials, last resort when no portrait loads
export function nameInitials(name: string): string {
  const words = name.replace(HONORIFIC, '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (words[0][0] + last).toUpperCase();
}

// Renders the portrait; on a missing OR failed-to-load image it falls back to the initials box.
export function Portrait({
  src,
  name,
  imgClassName,
  fallbackClassName,
}: {
  src: string | null;
  name: string;
  imgClassName: string;
  fallbackClassName: string;
}) {
  const [failed, setFailed] = useState(false);
  if (src && !failed)
    return (
      <img
        src={src}
        alt={name}
        loading='lazy'
        decoding='async'
        onError={() => setFailed(true)}
        className={imgClassName}
      />
    );
  return (
    <span role='img' aria-label={name} className={fallbackClassName}>
      {nameInitials(name)}
    </span>
  );
}
