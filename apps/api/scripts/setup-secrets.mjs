#!/usr/bin/env node
/**
 * Sube los secretos locales (.dev.vars.prod) a Cloudflare Workers (prod).
 *
 * Uso:
 *   node ./scripts/setup-secrets.mjs
 *
 * Requisitos:
 *   - Tener wrangler autenticado (`npx wrangler whoami`).
 *   - Tener el archivo `apps/api/.dev.vars.prod` con los valores reales.
 *
 * Seguridad:
 *   - Este script NO commitea secretos.
 *   - Genera un archivo temporal `secrets.json` y lo elimina al finalizar.
 */

import { readFile, writeFile, unlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.resolve(__dirname, '../.dev.vars.prod');
const secretsFile = path.resolve(__dirname, '../secrets.json');

const SKIP_KEYS = ['CF_ACCOUNT_ID'];

async function readDotEnv(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const secrets = {};

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const index = line.indexOf('=');
    if (index === -1) continue;

    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();

    // Remove optional surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && value && !SKIP_KEYS.includes(key)) {
      secrets[key] = value;
    }
  }

  return secrets;
}

function runWranglerBulk() {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'npx',
      ['wrangler', 'secret', 'bulk', secretsFile, '--env', 'prod'],
      {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit',
      },
    );

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`wrangler secret bulk exited with code ${code}`));
      }
    });
  });
}

async function main() {
  console.log('Reading secrets from', envFile);
  const secrets = await readDotEnv(envFile);
  const keys = Object.keys(secrets);

  if (keys.length === 0) {
    console.error('No secrets found in .dev.vars.prod. Nothing to upload.');
    process.exit(1);
  }

  console.log('\nThe following secrets will be uploaded to Cloudflare (prod):');
  for (const key of keys) {
    console.log(`  - ${key}`);
  }

  console.log('\nDo you want to continue? (yes/no)');
  process.stdin.setEncoding('utf-8');

  const answer = await new Promise((resolve) => {
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim().toLowerCase());
    });
  });

  if (answer !== 'yes' && answer !== 'y') {
    console.log('Aborted.');
    process.exit(0);
  }

  await writeFile(secretsFile, JSON.stringify(secrets, null, 2));

  try {
    await runWranglerBulk();
    console.log('\nSecrets uploaded successfully.');
  } finally {
    await unlink(secretsFile);
    console.log('Temporary secrets.json removed.');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
