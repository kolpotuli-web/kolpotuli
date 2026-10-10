import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteRoot = path.join(repoRoot, 'Kolpotuli');
let failures = 0;
let checks = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL ${message}`);
}

function pass(message) {
  checks += 1;
  console.log(`PASS ${message}`);
}

async function walk(folder) {
  const found = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const fullPath = path.join(folder, entry.name);
    if (entry.isDirectory()) found.push(...await walk(fullPath));
    else found.push(fullPath);
  }
  return found;
}

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)) {
    result[match[1].toLowerCase()] = match[3];
  }
  return result;
}

function isExternalUrl(value) {
  return /^(?:https?:|mailto:|tel:|data:|blob:|javascript:)/i.test(value)
    || value.startsWith('//');
}

function resolveLocalReference(value, ownerFile) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('#') || isExternalUrl(trimmed)) return null;

  const pathname = decodeURIComponent(trimmed.split(/[?#]/, 1)[0]);
  if (!pathname) return null;

  return path.resolve(path.dirname(ownerFile), pathname);
}

async function checkFileReference(value, ownerFile, description) {
  const target = resolveLocalReference(value, ownerFile);
  if (!target) return;

  const relativeTarget = path.relative(siteRoot, target);
  if (relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) {
    fail(`${description} escapes the site directory: ${value}`);
    return;
  }

  try {
    await stat(target);
    pass(`${description}: ${path.relative(repoRoot, target)}`);
  } catch {
    fail(`${description} points to a missing file: ${path.relative(repoRoot, ownerFile)} → ${value}`);
  }
}

function checkJavaScript(source, label) {
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '--check'],
    { input: source, encoding: 'utf8' }
  );

  if (result.status === 0) {
    pass(`JavaScript syntax: ${label}`);
  } else {
    fail(`JavaScript syntax: ${label}\n${result.stderr || result.stdout}`);
  }
}

function checkBalancedDelimiters(source, label) {
  const clean = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g, '');

  const opening = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  for (const char of clean) {
    if ('([{'.includes(char)) opening.push(char);
    if (')]}'.includes(char)) {
      if (opening.pop() !== pairs[char]) {
        fail(`Unbalanced delimiters in ${label}`);
        return;
      }
    }
  }

  if (opening.length) fail(`Unbalanced delimiters in ${label}`);
  else pass(`Balanced delimiters: ${label}`);
}

async function checkModuleImports(source, ownerFile, label) {
  const importValues = new Set();
  const patterns = [
    /\b(?:import|export)\s+(?:[^;]*?\s+from\s*)?(["'])([^"']+)\1/g,
    /\bimport\s*\(\s*(["'])([^"']+)\1\s*\)/g
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) importValues.add(match[2]);
  }

  for (const specifier of importValues) {
    if (!specifier.startsWith('.')) continue;
    await checkFileReference(specifier, ownerFile, `Module import in ${label}`);
  }
}

async function main() {
  const allFiles = await walk(siteRoot);
  const htmlFiles = allFiles.filter(file => file.endsWith('.html'));
  const jsFiles = allFiles.filter(file => file.endsWith('.js'));
  const cssFiles = allFiles.filter(file => file.endsWith('.css'));

  if (!htmlFiles.includes(path.join(siteRoot, 'index.html'))) {
    fail('Kolpotuli/index.html is missing');
  } else {
    pass('Homepage exists');
  }

  for (const pageName of ['admin.html', 'profile.html', 'read.html']) {
    if (htmlFiles.includes(path.join(siteRoot, pageName))) pass(`Page exists: ${pageName}`);
    else fail(`Required page is missing: ${pageName}`);
  }

  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    const cleanHtml = html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '');

    const ids = new Set();
    for (const tag of cleanHtml.match(/<[a-z][^>]*>/gi) || []) {
      const id = attributes(tag).id;
      if (!id) continue;
      if (ids.has(id)) fail(`Duplicate id "${id}" in ${path.relative(repoRoot, file)}`);
      else ids.add(id);
    }
    if (![...cleanHtml.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)].length || ids.size) {
      pass(`HTML IDs checked: ${path.relative(repoRoot, file)}`);
    }

    if (/\bon[a-z]+\s*=\s*(["'])/i.test(cleanHtml)) {
      fail(`Inline event handler found in ${path.relative(repoRoot, file)}; use an event listener instead`);
    }

    for (const tag of cleanHtml.match(/<(?:a|link|script|img|source|iframe|audio|video)\b[^>]*>/gi) || []) {
      const attrs = attributes(tag);
      for (const name of ['href', 'src']) {
        if (attrs[name]) await checkFileReference(attrs[name], file, `${name} in ${path.relative(repoRoot, file)}`);
      }
    }

    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
      const attrs = attributes(`<script ${match[1]}>`);
      if (!attrs.src && attrs.type === 'module' && match[2].trim()) {
        const label = `${path.relative(repoRoot, file)} inline module`;
        checkJavaScript(match[2], label);
        await checkModuleImports(match[2], file, label);
      }
    }

    for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) {
      checkBalancedDelimiters(match[1], `${path.relative(repoRoot, file)} inline CSS`);
    }
  }

  for (const file of jsFiles) {
    const source = await readFile(file, 'utf8');
    checkJavaScript(source, path.relative(repoRoot, file));
    await checkModuleImports(source, file, path.relative(repoRoot, file));
  }

  for (const file of cssFiles) {
    const css = await readFile(file, 'utf8');
    checkBalancedDelimiters(css, path.relative(repoRoot, file));

    for (const match of css.matchAll(/url\(\s*(?:(["'])(.*?)\1|([^)]*?))\s*\)/gi)) {
      const value = (match[2] ?? match[3] ?? '').trim();
      await checkFileReference(value, file, `CSS asset in ${path.relative(repoRoot, file)}`);
    }
  }

  console.log(`\nChecked ${checks} items; ${failures} failure(s).`);
  if (failures) process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
