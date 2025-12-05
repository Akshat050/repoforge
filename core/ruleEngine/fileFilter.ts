/**
 * File Filter Utilities
 * Handles binary file detection and directory exclusion for rule engine
 */

import * as fs from 'fs';
import * as path from 'path';

// Binary file extensions to skip
const BINARY_EXTENSIONS = new Set([
  // Images
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.bmp', '.webp', '.tiff', '.tif',
  // Fonts
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  // Archives
  '.zip', '.tar', '.gz', '.rar', '.7z', '.bz2', '.xz',
  // Executables and libraries
  '.exe', '.dll', '.so', '.dylib', '.bin',
  // Documents
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  // Media
  '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.wav', '.ogg',
  // Other binary formats
  '.class', '.jar', '.war', '.ear', '.pyc', '.pyo', '.o', '.a'
]);

// Directories to skip
const SKIP_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'out',
  'coverage',
  '.git',
  '.svn',
  '.hg',
  '__pycache__',
  '.pytest_cache',
  '.mypy_cache',
  'vendor',
  'target',
  'bin',
  'obj'
]);

/**
 * Check if a file is binary based on its extension
 */
export function isBinaryByExtension(filePath: string): boolean {
  // Normalize the path to handle edge cases
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Get the basename to handle edge cases like "/.pdf"
  const basename = path.basename(normalizedPath);
  
  // Check if the entire basename is an extension (like ".pdf" or ".jpg")
  if (basename.startsWith('.') && basename.lastIndexOf('.') === 0) {
    const ext = basename.toLowerCase();
    if (BINARY_EXTENSIONS.has(ext)) {
      return true;
    }
  }
  
  // Normal extension check
  const ext = path.extname(normalizedPath).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

/**
 * Check if a file path contains any excluded directories
 */
export function containsSkipDirectory(filePath: string): boolean {
  // Normalize the path to handle edge cases
  const normalizedPath = filePath.replace(/\\/g, '/');
  const pathParts = normalizedPath.split('/').filter(part => part.length > 0);
  return pathParts.some(part => SKIP_DIRECTORIES.has(part));
}

/**
 * Check if a file is binary by reading its content
 * Detects null bytes which are common in binary files
 */
export function isBinaryByContent(filePath: string): boolean {
  try {
    const buffer = fs.readFileSync(filePath);
    
    // Check first 8000 bytes for null bytes
    const bytesToCheck = Math.min(buffer.length, 8000);
    for (let i = 0; i < bytesToCheck; i++) {
      if (buffer[i] === 0) {
        return true; // Found null byte, likely binary
      }
    }
    
    return false;
  } catch (error) {
    // If we can't read the file, assume it's not processable
    return true;
  }
}

/**
 * Check if a file should be excluded from processing
 * Combines extension check, directory check, and content check
 */
export function shouldExcludeFile(filePath: string, fullPath?: string): boolean {
  // Check extension first (fast)
  if (isBinaryByExtension(filePath)) {
    return true;
  }
  
  // Check if path contains excluded directories
  if (containsSkipDirectory(filePath)) {
    return true;
  }
  
  // If full path provided, check content (slower, but more accurate)
  if (fullPath) {
    if (isBinaryByContent(fullPath)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get the set of binary extensions (for testing)
 */
export function getBinaryExtensions(): Set<string> {
  return new Set(BINARY_EXTENSIONS);
}

/**
 * Get the set of skip directories (for testing)
 */
export function getSkipDirectories(): Set<string> {
  return new Set(SKIP_DIRECTORIES);
}
