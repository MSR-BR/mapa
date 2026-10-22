/* eslint-disable @typescript-eslint/no-require-imports -- This adapter is loaded synchronously by the CommonJS Next ESLint plugin. */
// Only the globSync(pattern, { onlyDirectories: true }) contract used by
// @next/eslint-plugin-next 16.4.2 get-root-dirs is supported. This is NOT a
// general fast-glob replacement. Reject upstream API changes instead of silently
// changing which Next projects ESLint checks.
const { globSync: scan } = require('glob');
const { statSync } = require('node:fs');
const { isAbsolute, relative } = require('node:path');

exports.globSync = function globSync(pattern, options) {
  if (typeof pattern !== 'string' || options?.onlyDirectories !== true ||
      Object.keys(options).some((key) => key !== 'onlyDirectories')) {
    throw new TypeError('Unsupported Next root directory glob contract');
  }
  // Root patterns are local ESLint configuration, but bound parser work anyway.
  // Ordinary paths, brace alternatives and extglobs remain supported.
  if (pattern.length > 4096) throw new RangeError('Next root directory pattern is too long');
  let nesting = 0;
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '\\') { i++; continue; }
    if (pattern[i] === '{' || pattern[i] === '(') {
      if (++nesting > 32) throw new RangeError('Next root directory pattern is too deeply nested');
    } else if (pattern[i] === '}' || pattern[i] === ')') nesting = Math.max(0, nesting - 1);
  }
  // fast-glob's standalone negative pattern has no positive set to search.
  if (pattern.startsWith('!') && !pattern.startsWith('!(')) return [];
  return scan(pattern, { dot: false, follow: true, nodir: false })
    .filter((path) => {
      try { return statSync(path).isDirectory(); }
      catch (error) {
        if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
        throw error;
      }
    })
    .map((path) => {
      const result = !isAbsolute(pattern) && isAbsolute(path) ? relative(process.cwd(), path) || '.' : path;
      return result.length > 1 ? result.replace(/\/$/, '') : result;
    });
};
