/**
 * Generates src/types/database.ts from a linked Supabase project or local DB.
 *
 * Usage:
 *   npx tsx scripts/generate-types.ts --local
 *   npx tsx scripts/generate-types.ts
 *
 * Remote: set EXPO_PUBLIC_SUPABASE_URL (https://<project-ref>.supabase.co) and
 * SUPABASE_ACCESS_TOKEN for the Supabase CLI.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');
const outPath = resolve(root, 'src/types/database.ts');
const useLocal = process.argv.includes('--local');

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) {
    return {};
  }
  const env: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const envPath = resolve(root, '.env');
const env = { ...process.env, ...loadEnvFile(envPath) } as NodeJS.ProcessEnv;

let command: string;
if (useLocal) {
  command = 'npx supabase gen types typescript --local';
} else {
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  if (!url) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL in .env or environment.');
    process.exit(1);
  }
  const match = url.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
  if (!match) {
    console.error(
      'EXPO_PUBLIC_SUPABASE_URL must look like https://<project-ref>.supabase.co',
    );
    process.exit(1);
  }
  const projectRef = match[1];
  command = `npx supabase gen types typescript --project-id ${projectRef}`;
}

const banner = `/**
 * Supabase-generated database types.
 * Regenerate: npx tsx scripts/generate-types.ts [--local]
 */

`;

try {
  const output = execSync(command, {
    cwd: root,
    encoding: 'utf-8',
    env,
    maxBuffer: 50 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  writeFileSync(outPath, banner + output.trimEnd() + '\n', 'utf-8');
  console.log(`Wrote ${outPath}`);
} catch (err) {
  console.error('supabase gen types failed:', err);
  process.exit(1);
}
