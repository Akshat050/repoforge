/**
 * RepoForge Code Analyzer
 * Analyzes actual code content for quality issues
 */

import * as fs from 'fs';
import * as path from 'path';
import type { RepoMap, Issue } from './types.js';

interface CodeMetrics {
  lines: number;
  functions: number;
  complexity: number;
  imports: number;
  exports: number;
}

function analyzeCodeFile(filePath: string, content: string): CodeMetrics {
  const lines = content.split('\n');
  
  // Count functions
  const functionMatches = content.match(/function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{/g);
  const functions = functionMatches ? functionMatches.length : 0;
  
  // Estimate complexity (if/else, loops, switches)
  const complexityPatterns = /\b(if|else|for|while|switch|catch|&&|\|\|)\b/g;
  const complexityMatches = content.match(complexityPatterns);
  const complexity = complexityMatches ? complexityMatches.length : 0;
  
  // Count imports/exports
  const imports = (content.match(/^import\s+/gm) || []).length;
  const exports = (content.match(/^export\s+/gm) || []).length;
  
  return {
    lines: lines.length,
    functions,
    complexity,
    imports,
    exports
  };
}

export function analyzeCode(repo: RepoMap): Issue[] {
  const issues: Issue[] = [];
  
  const codeFiles = repo.entries.filter(e => 
    e.kind === 'file' && 
    (e.path.endsWith('.ts') || e.path.endsWith('.tsx') || 
     e.path.endsWith('.js') || e.path.endsWith('.jsx')) &&
    !e.path.includes('node_modules') &&
    !e.path.includes('.next') &&
    !e.path.endsWith('.d.ts')
  );
  
  // Track all imports and exports for dead code detection
  const allImports = new Map<string, Set<string>>(); // file -> imported files
  const allExports = new Set<string>(); // files that export something
  const allImportedFiles = new Set<string>(); // files that are imported
  
  for (const file of codeFiles) {
    const fullPath = path.join(repo.root, file.path);
    
    let content: string;
    try {
      content = fs.readFileSync(fullPath, 'utf-8');
    } catch {
      continue;
    }
    
    const metrics = analyzeCodeFile(file.path, content);
    
    // Track imports and exports
    const imports = extractImports(content, file.path);
    if (imports.length > 0) {
      allImports.set(file.path, new Set(imports));
      imports.forEach(imp => allImportedFiles.add(imp));
    }
    
    if (metrics.exports > 0) {
      allExports.add(file.path);
    }
    
    // Check for God functions (too complex)
    if (metrics.complexity > 50) {
      issues.push({
        id: 'CURSE_HIGH_COMPLEXITY',
        type: 'curse',
        severity: metrics.complexity > 100 ? 'high' : 'medium',
        filePath: file.path,
        message: `File has high cyclomatic complexity (${metrics.complexity}). Consider breaking down complex logic into smaller functions.`
      });
    }
    
    // Check for too many imports (tight coupling)
    if (metrics.imports > 20) {
      issues.push({
        id: 'CURSE_TOO_MANY_IMPORTS',
        type: 'curse',
        severity: 'low',
        filePath: file.path,
        message: `File has ${metrics.imports} imports. High coupling detected - consider splitting responsibilities.`
      });
    }
    
    // Check for console.log in production code
    if (content.includes('console.log') && !file.path.includes('test')) {
      const logCount = (content.match(/console\.log/g) || []).length;
      issues.push({
        id: 'CURSE_CONSOLE_LOG',
        type: 'curse',
        severity: 'low',
        filePath: file.path,
        message: `Found ${logCount} console.log statement(s). Remove debug logs before production.`,
        suggestion: 'Use a proper logging library or remove console.log statements'
      });
    }
    
    // Check for TODO/FIXME comments
    const todoMatches = content.match(/\/\/\s*(TODO|FIXME|HACK|XXX):/gi);
    if (todoMatches && todoMatches.length > 3) {
      issues.push({
        id: 'CURSE_TOO_MANY_TODOS',
        type: 'curse',
        severity: 'low',
        filePath: file.path,
        message: `Found ${todoMatches.length} TODO/FIXME comments. Consider addressing technical debt.`
      });
    }
    
    // Check for any type usage (TypeScript)
    if (file.path.endsWith('.ts') || file.path.endsWith('.tsx')) {
      const anyCount = (content.match(/:\s*any\b/g) || []).length;
      if (anyCount > 5) {
        issues.push({
          id: 'CURSE_EXCESSIVE_ANY',
          type: 'curse',
          severity: 'medium',
          filePath: file.path,
          message: `Found ${anyCount} 'any' types. This defeats TypeScript's type safety.`,
          suggestion: 'Replace any with proper types or unknown'
        });
      }
    }
    
    // Check for empty catch blocks
    if (content.match(/catch\s*\([^)]*\)\s*{\s*}/)) {
      issues.push({
        id: 'CURSE_EMPTY_CATCH',
        type: 'curse',
        severity: 'medium',
        filePath: file.path,
        message: 'Empty catch block detected. Errors are being silently swallowed.',
        suggestion: 'Add proper error handling or at least log the error'
      });
    }
    
    // Check for hardcoded credentials patterns
    const credentialPatterns = [
      /password\s*=\s*["'][^"']+["']/i,
      /api[_-]?key\s*=\s*["'][^"']+["']/i,
      /secret\s*=\s*["'][^"']+["']/i,
      /token\s*=\s*["'][^"']+["']/i
    ];
    
    for (const pattern of credentialPatterns) {
      if (pattern.test(content)) {
        issues.push({
          id: 'CURSE_HARDCODED_CREDENTIALS',
          type: 'curse',
          severity: 'critical',
          filePath: file.path,
          message: 'Potential hardcoded credentials detected. This is a security risk!',
          suggestion: 'Use environment variables or a secrets manager'
        });
        break;
      }
    }
    
    // Check for unused variables/functions
    const unusedCode = detectUnusedCode(content);
    if (unusedCode.length > 0) {
      issues.push({
        id: 'ZOMBIE_UNUSED_CODE',
        type: 'zombie',
        severity: 'low',
        filePath: file.path,
        message: `Found ${unusedCode.length} potentially unused declarations: ${unusedCode.slice(0, 3).join(', ')}${unusedCode.length > 3 ? '...' : ''}`,
        suggestion: 'Remove unused code or mark as used'
      });
    }
    
    // Check for broken imports
    const brokenImports = detectBrokenImports(content, file.path, repo);
    if (brokenImports.length > 0) {
      issues.push({
        id: 'CURSE_BROKEN_IMPORTS',
        type: 'curse',
        severity: 'high',
        filePath: file.path,
        message: `Found ${brokenImports.length} broken import(s): ${brokenImports.slice(0, 2).join(', ')}`,
        suggestion: 'Fix import paths or install missing dependencies'
      });
    }
  }
  
  // Detect dead code files (exported but never imported)
  for (const file of codeFiles) {
    if (allExports.has(file.path) && !allImportedFiles.has(file.path)) {
      // Skip entry points
      if (file.path.includes('index.') || file.path.includes('main.') || 
          file.path.includes('app.') || file.path.includes('.test.') ||
          file.path.includes('.spec.')) {
        continue;
      }
      
      issues.push({
        id: 'ZOMBIE_DEAD_FILE',
        type: 'zombie',
        severity: 'medium',
        filePath: file.path,
        message: `File exports code but is never imported. This is dead code haunting your repo.`,
        suggestion: 'Remove file or add imports where needed'
      });
    }
  }
  
  return issues;
}

function extractImports(content: string, currentFile: string): string[] {
  const imports: string[] = [];
  
  // Match ES6 imports
  const importRegex = /import\s+(?:[\w\s{},*]*\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath && !importPath.startsWith('.') && !importPath.startsWith('/')) {
      // External package, skip
      continue;
    }
    imports.push(resolveImportPath(importPath, currentFile));
  }
  
  // Match require statements
  const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
  while ((match = requireRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath && !importPath.startsWith('.') && !importPath.startsWith('/')) {
      continue;
    }
    imports.push(resolveImportPath(importPath, currentFile));
  }
  
  return imports;
}

function resolveImportPath(importPath: string, currentFile: string): string {
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const dir = path.dirname(currentFile);
    let resolved = path.join(dir, importPath).replace(/\\/g, '/');
    
    // Add common extensions if missing
    if (!path.extname(resolved)) {
      // Try common extensions
      return resolved;
    }
    
    return resolved;
  }
  return importPath;
}

function detectUnusedCode(content: string): string[] {
  const unused: string[] = [];
  
  // Find all declarations
  const declarations = new Set<string>();
  const usages = new Set<string>();
  
  // Match function declarations
  const funcRegex = /(?:function|const|let|var)\s+(\w+)/g;
  let match;
  
  while ((match = funcRegex.exec(content)) !== null) {
    const name = match[1];
    if (name && name !== 'exports' && name !== 'module') {
      declarations.add(name);
    }
  }
  
  // Match usages (simple heuristic)
  for (const name of declarations) {
    const usageRegex = new RegExp(`\\b${name}\\b`, 'g');
    const matches = content.match(usageRegex);
    if (matches && matches.length > 1) { // More than just declaration
      usages.add(name);
    }
  }
  
  // Find unused
  for (const name of declarations) {
    if (!usages.has(name) && !content.includes(`export`) || content.includes(`export.*${name}`)) {
      unused.push(name);
    }
  }
  
  return unused.slice(0, 5); // Limit to avoid noise
}

function detectBrokenImports(content: string, currentFile: string, repo: RepoMap): string[] {
  const broken: string[] = [];
  const allFiles = new Set(repo.entries.filter(e => e.kind === 'file').map(e => e.path));
  
  const imports = extractImports(content, currentFile);
  
  for (const imp of imports) {
    // Check if file exists (try common extensions)
    const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.json'];
    const indexVariants = ['/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
    
    let found = false;
    
    for (const ext of extensions) {
      if (allFiles.has(imp + ext)) {
        found = true;
        break;
      }
    }
    
    if (!found) {
      for (const variant of indexVariants) {
        if (allFiles.has(imp + variant)) {
          found = true;
          break;
        }
      }
    }
    
    if (!found && imp.startsWith('.')) {
      broken.push(imp);
    }
  }
  
  return broken;
}
