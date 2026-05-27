#!/usr/bin/env node
'use strict';

const { readFileSync, writeFileSync, existsSync } = require('node:fs');
const { join, resolve, dirname } = require('node:path');
const { createInterface } = require('node:readline');
const https = require('node:https');

const STACKS = [
  'nextjs-15-postgres-prisma',
  'rails-8-sidekiq-postgres',
  'fastapi-celery-postgres',
  'django-5-celery-postgres',
  'nestjs-10-prisma-redis',
  'go-chi-postgres',
  'bun-hono-sqlite',
  'rust-axum-postgres',
  'phoenix-ecto-postgres',
  'sveltekit-drizzle-postgres',
  'astro-drizzle-postgres',
  'dotnet-9-aspnetcore-efcore',
  'laravel-11-horizon-postgres',
  'swiftui-swiftdata-xctest',
  'flutter-riverpod-drift',
];

const REMOTE_BASE = 'https://raw.githubusercontent.com/agentr-labs/awesome-agents-md/main/stacks';

function fetch(url, redirects = 5) {
  return new Promise((resolveP, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
          res.resume();
          return fetch(res.headers.location, redirects - 1).then(resolveP, reject);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`${url}: HTTP ${res.statusCode}`));
        }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolveP(body));
      })
      .on('error', reject);
  });
}

function resolveSlug(input) {
  if (STACKS.includes(input)) return input;
  const tokens = input.split(/[-_]/).filter(Boolean);
  const matches = STACKS.filter(s => tokens.every(t => s.includes(t.toLowerCase())));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    throw new Error(`ambiguous slug '${input}' matches: ${matches.join(', ')}`);
  }
  throw new Error(`no stack matches '${input}'.\nAvailable:\n  ${STACKS.join('\n  ')}`);
}

function localStacksDir() {
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, 'stacks');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  const cwdCandidate = join(process.cwd(), 'stacks');
  if (existsSync(cwdCandidate)) return cwdCandidate;
  return null;
}

async function getContent(slug) {
  const localDir = localStacksDir();
  if (localDir) {
    const localPath = join(localDir, slug, 'AGENTS.md');
    if (existsSync(localPath)) {
      return { content: readFileSync(localPath, 'utf8'), source: localPath };
    }
  }
  const url = `${REMOTE_BASE}/${slug}/AGENTS.md`;
  return { content: await fetch(url), source: url };
}

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolveP) => {
    rl.question(question, (ans) => {
      rl.close();
      resolveP(ans.trim());
    });
  });
}

async function chooseInteractively() {
  console.log('Available stacks:');
  STACKS.forEach((s, i) => console.log(`  ${String(i + 1).padStart(2)}. ${s}`));
  const ans = await prompt('\nPick a number, or type a slug: ');
  const n = parseInt(ans, 10);
  if (!Number.isNaN(n) && n >= 1 && n <= STACKS.length) return STACKS[n - 1];
  if (!ans) {
    throw new Error('no choice made');
  }
  return resolveSlug(ans);
}

function printHelp() {
  console.log('Usage:  agents-md-pick [<slug>]');
  console.log('        agents-md-pick --list');
  console.log('        agents-md-pick --dry-run [<slug>]');
  console.log('');
  console.log('Drops a battle-tested AGENTS.md for the chosen stack into the current directory.');
  console.log('Run with no arguments for an interactive picker.');
  console.log('');
  console.log('Slugs accept substring matching: e.g. "nextjs-postgres-prisma" resolves to');
  console.log('"nextjs-15-postgres-prisma" when the match is unambiguous.');
  console.log('');
  console.log('Stacks:');
  STACKS.forEach(s => console.log(`  ${s}`));
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const positional = args.filter(a => !a.startsWith('-'));

  if (args.includes('-h') || args.includes('--help')) {
    printHelp();
    return;
  }
  if (args.includes('-l') || args.includes('--list')) {
    STACKS.forEach(s => console.log(s));
    return;
  }

  let slug;
  if (positional.length === 0) {
    slug = await chooseInteractively();
  } else {
    slug = resolveSlug(positional[0]);
  }

  const target = resolve(process.cwd(), 'AGENTS.md');
  if (existsSync(target) && !dryRun) {
    const ans = await prompt(`AGENTS.md already exists at ${target}. Overwrite? [y/N]: `);
    if (ans.toLowerCase() !== 'y' && ans.toLowerCase() !== 'yes') {
      console.log('aborted.');
      process.exit(0);
    }
  }

  console.log(`Resolving stack '${slug}'...`);
  const { content, source } = await getContent(slug);
  console.log(`Source: ${source}`);

  if (dryRun) {
    console.log(`Would write ${content.split('\n').length} lines to ${target}`);
    return;
  }

  writeFileSync(target, content);
  console.log(`Wrote ${target} (${content.split('\n').length} lines)`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Skim the file. Adjust the ## Stack versions to match yours.');
  console.log('  2. For Claude Code:  ln -s AGENTS.md CLAUDE.md');
  console.log('  3. For Aider:        ln -s AGENTS.md CONVENTIONS.md');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
