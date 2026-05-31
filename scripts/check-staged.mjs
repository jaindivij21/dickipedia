import { execSync } from 'node:child_process';
import { statSync } from 'node:fs';

const MAX_BYTES = 2 * 1024 * 1024;
const SECRET_PATTERNS = [
  { re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/, label: 'private key' },
  { re: /AKIA[0-9A-Z]{16}/, label: 'AWS access key id' },
  { re: /\bghp_[A-Za-z0-9]{36}\b/, label: 'GitHub token' },
  { re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/, label: 'GitHub token' },
];

const sh = (cmd) => execSync(cmd, { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });
const errors = [];

const files = sh('git diff --cached --name-only --diff-filter=ACM')
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);

for (const f of files) {
  if (f.startsWith('data/')) continue;
  try {
    const { size } = statSync(f);
    if (size > MAX_BYTES)
      errors.push(
        `${f} is ${(size / 1048576).toFixed(1)}MB (> 2MB; large data belongs under data/)`,
      );
  } catch {
    /* file removed between stage and check */
  }
}

let current = '';
for (const line of sh('git diff --cached -U0').split('\n')) {
  if (line.startsWith('+++ b/')) {
    current = line.slice(6);
    continue;
  }
  if (current.startsWith('data/') || !line.startsWith('+') || line.startsWith('+++')) continue;
  for (const { re, label } of SECRET_PATTERNS)
    if (re.test(line)) errors.push(`possible ${label} in ${current}`);
}

if (errors.length) {
  console.error(`✖ pre-commit guard:\n - ${[...new Set(errors)].join('\n - ')}`);
  process.exit(1);
}
