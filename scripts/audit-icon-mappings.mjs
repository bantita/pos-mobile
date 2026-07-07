import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const adapterPath = path.join(root, 'src', 'shared', 'icons', 'lucideAdapter.tsx');
const srcRoot = path.join(root, 'src');
const lucideTypesPath = path.join(root, 'node_modules', 'lucide-react-native', 'dist', 'lucide-react-native.d.ts');

const adapterSource = fs.readFileSync(adapterPath, 'utf8');
const lucideTypes = fs.readFileSync(lucideTypesPath, 'utf8');
const objectMatch = adapterSource.match(/const explicitIcons:[\s\S]*?=\s*\{([\s\S]*?)\n\};/u);

if (!objectMatch) {
  console.error('[icons] explicitIcons registry was not found.');
  process.exit(1);
}

const explicitNames = new Map();
for (const match of objectMatch[1].matchAll(/^\s*(?:'([^']+)'|([A-Za-z_$][\w$]*))\s*:\s*'([^']+)'/gmu)) {
  explicitNames.set(match[1] ?? match[2], match[3]);
}

const lucideRegistry = new Set(
  [...lucideTypes.matchAll(/^declare const ([A-Za-z][A-Za-z0-9]*):/gmu)].map((match) => match[1]),
);
const staticIconNames = new Set();

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!/\.(tsx|ts|jsx|js)$/u.test(entry.name)) continue;
    const source = fs.readFileSync(fullPath, 'utf8');
    for (const match of source.matchAll(/<Ionicons\b[^>]*\bname=(["'])([^"']+)\1/gmu)) {
      staticIconNames.add(match[2]);
    }
  }
}

function toPascalCase(name) {
  return name
    .replace(/-outline$/u, '')
    .split(/[-_\s]+/u)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

walk(srcRoot);

const invalidMappings = [];
for (const [ionName, lucideName] of explicitNames) {
  if (!lucideRegistry.has(lucideName)) {
    invalidMappings.push(`${ionName} -> ${lucideName}`);
  }
}

const unresolved = [...staticIconNames].filter((name) => {
  const explicit = explicitNames.get(name);
  if (explicit) return !lucideRegistry.has(explicit);
  return !lucideRegistry.has(toPascalCase(name));
});

if (invalidMappings.length > 0 || unresolved.length > 0) {
  if (invalidMappings.length > 0) {
    console.error(`[icons] Invalid Lucide mapping(s): ${invalidMappings.join(', ')}`);
  }
  if (unresolved.length > 0) {
    console.error(`[icons] Static Ionicons name(s) without Lucide mapping: ${unresolved.join(', ')}`);
  }
  process.exit(1);
}

console.log(`[icons] ${staticIconNames.size} static Ionicons names checked, ${explicitNames.size} explicit mappings valid.`);
