#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '../index.html');
const [command, argument] = process.argv.slice(2);
try {
  const html = fs.readFileSync(file, 'utf8');
  const pattern = /const DATA=(\[[\s\S]*?\]);<\/script>/;
  const match = html.match(pattern);
  if (!match) throw new Error('Canonical DATA block not found');
  const records = JSON.parse(match[1]);
  if (command === 'get' && argument) {
    const record = records.find(c => c.name === argument);
    if (!record) throw new Error('No exact company name match');
    process.stdout.write(JSON.stringify(record, null, 2) + '\n');
  } else if (command === 'apply' && argument) {
    const record = JSON.parse(fs.readFileSync(argument, 'utf8'));
    if (!record || Array.isArray(record) || typeof record.name !== 'string' || !record.name.trim()) throw new Error('A company object with a nonempty name is required');
    const index = records.findIndex(c => c.name === record.name);
    if (index < 0 && records.some(c => c.name.toLowerCase() === record.name.toLowerCase())) throw new Error('Company identity already exists with different capitalization');
    if (index < 0 && record.status !== 'Secondary') throw new Error('New submissions must use status Secondary; propose curated changes separately');
    if (index < 0) records.push(record); else records[index] = record;
    const serialized = JSON.stringify(records).replace(/</g, '\\u003c');
    const updated = html.slice(0, match.index) + 'const DATA=' + serialized + ';</script>' + html.slice(match.index + match[0].length);
    fs.writeFileSync(file, updated);
    process.stderr.write('Saved ' + record.name + '. Run npm run verify and review the diff before submitting.\n');
  } else throw new Error('Usage: node scripts/company.cjs get "Exact company name" | apply record.json');
} catch (error) {
  process.stderr.write(error.message + '\n');
  process.exitCode = 1;
}
