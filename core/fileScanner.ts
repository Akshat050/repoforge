/**
 * RepoForge File Scanner
 * Recursively scans a repository and builds a file tree
 */

import * as fs from 'fs';
import * as path from 'path';
import type { FileEntry, RepoMap } from './types.js';


const SKIP_DIRECTORIES = new Set(['node_modules', 'dist', '.git']);

export function scanRepo(root: string): RepoMap {
  const entries: FileEntry[] = [];
  let totalFiles = 0;
  let totalDirectories = 0;

  function walkDirectory(currentPath: string): void {
    let items: string[];
    
    try {
      items = fs.readdirSync(currentPath);
    } catch (error) {
      return;
    }

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      let stats: fs.Stats;

      try {
        stats = fs.lstatSync(fullPath);
      } catch (error) {
        continue;
      }

      const relativePath = path.relative(root, fullPath).replace(/\\/g, '/');
      
      if (stats.isSymbolicLink()) {
        const entry: FileEntry = {
          path: relativePath,
          kind: 'symlink'
        };
        entries.push(entry);
      } else if (stats.isDirectory()) {
        if (SKIP_DIRECTORIES.has(item)) {
          continue;
        }

        const entry: FileEntry = {
          path: relativePath,
          kind: 'directory'
        };
        entries.push(entry);
        totalDirectories++;

        walkDirectory(fullPath);
      } else if (stats.isFile()) {
        const entry: FileEntry = {
          path: relativePath,
          kind: 'file',
          size: stats.size
        };
        entries.push(entry);
        totalFiles++;
      }
    }
  }

  walkDirectory(root);

  return {
    root,
    entries,
    totalFiles,
    totalDirectories
  };
}
