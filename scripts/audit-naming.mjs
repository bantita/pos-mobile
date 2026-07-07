import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const SOURCE_ROOT = path.resolve('src');
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const redundantDeclaration = /\b(?:const|function|class|interface|type)\s+Web[A-Z][A-Za-z0-9_]*/g;
const violations = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(absolutePath);
      continue;
    }

    if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) continue;

    if (/^Web[A-Z]/.test(entry.name)) {
      violations.push(`${path.relative(process.cwd(), absolutePath)}: redundant Web filename prefix`);
    }

    const source = await readFile(absolutePath, 'utf8');
    for (const match of source.matchAll(redundantDeclaration)) {
      const line = source.slice(0, match.index).split('\n').length;
      violations.push(
        `${path.relative(process.cwd(), absolutePath)}:${line}: redundant declaration ${match[0]}`,
      );
    }
  }
}

await walk(SOURCE_ROOT);

if (violations.length > 0) {
  console.error('[naming] Redundant platform prefixes found:');
  violations.forEach((violation) => console.error(`- ${violation}`));
  process.exitCode = 1;
} else {
  console.log('[naming] No redundant Web filename or declaration prefixes found.');
}
