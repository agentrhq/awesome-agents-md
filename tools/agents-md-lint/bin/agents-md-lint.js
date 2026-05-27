#!/usr/bin/env node
'use strict';

const { readFileSync, statSync, readdirSync, existsSync } = require('node:fs');
const { join, resolve, relative } = require('node:path');

const REQUIRED_H2S = [
  '## Stack',
  '## Run',
  '## Architecture',
  '## Conventions',
  '## Tests',
  '## Ops',
  '## External APIs',
  "## Don't",
  '## Vendor notes',
];
const MAX_LINES = 200;
const EM_DASH = '—';

function findAgentsMd(p) {
  if (!existsSync(p)) return [];
  const stat = statSync(p);
  if (stat.isFile()) return [p];
  if (!stat.isDirectory()) return [];
  const out = [];
  for (const entry of readdirSync(p, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const sub = join(p, entry.name);
    if (entry.isDirectory()) out.push(...findAgentsMd(sub));
    else if (entry.isFile() && entry.name === 'AGENTS.md') out.push(sub);
  }
  return out;
}

function lintFile(file) {
  const errors = [];
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');

  if (lines.length > MAX_LINES) {
    errors.push({ file, line: 1, message: `file is ${lines.length} lines, max is ${MAX_LINES}` });
  }

  const sectionOrder = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      const trimmed = line.trim();
      if (REQUIRED_H2S.includes(trimmed)) sectionOrder.push({ name: trimmed, line: i + 1 });
    }
    if (line.includes(EM_DASH)) {
      errors.push({ file, line: i + 1, message: 'em-dash found (use period, comma, or middle dot)' });
    }
  }

  for (const h of REQUIRED_H2S) {
    if (!sectionOrder.some(s => s.name === h)) {
      errors.push({ file, line: 1, message: `missing required section '${h}'` });
    }
  }

  const docOrder = sectionOrder.map(s => s.name);
  const expectedHere = REQUIRED_H2S.filter(h => docOrder.includes(h));
  for (let i = 0; i < docOrder.length; i++) {
    if (docOrder[i] !== expectedHere[i]) {
      errors.push({
        file,
        line: sectionOrder[i].line,
        message: `section '${docOrder[i]}' is out of order; expected '${expectedHere[i]}' here (required order: ${REQUIRED_H2S.join(' > ')})`,
      });
      break;
    }
  }

  return errors;
}

function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('-'));
  const flags = process.argv.slice(2).filter(a => a.startsWith('-'));

  if (flags.includes('-h') || flags.includes('--help')) {
    console.log('Usage: agents-md-lint [path ...]');
    console.log('');
    console.log('Lints an AGENTS.md (or all AGENTS.md files under a directory) against the');
    console.log('awesome-agents-md schema: 8 required H2 sections in order, 200-line cap, no em-dashes.');
    console.log('');
    console.log('Exit codes: 0 clean, 1 lint failed, 2 no files found.');
    return;
  }

  const targets = args.length > 0 ? args : ['.'];
  const files = [...new Set(targets.flatMap(t => findAgentsMd(resolve(t))))];

  if (files.length === 0) {
    console.error('agents-md-lint: no AGENTS.md found in target(s): ' + targets.join(', '));
    process.exit(2);
  }

  let totalErrors = 0;
  let cleanFiles = 0;
  for (const f of files) {
    const errors = lintFile(f);
    const rel = relative(process.cwd(), f) || f;
    if (errors.length === 0) {
      console.log(`ok  ${rel}`);
      cleanFiles++;
    } else {
      for (const e of errors) {
        console.error(`${relative(process.cwd(), e.file) || e.file}:${e.line}: ${e.message}`);
      }
      totalErrors += errors.length;
    }
  }

  console.error('');
  if (totalErrors > 0) {
    console.error(`${totalErrors} error(s); ${cleanFiles}/${files.length} file(s) clean`);
    process.exit(1);
  }
  console.error(`${files.length}/${files.length} file(s) clean`);
}

main();
