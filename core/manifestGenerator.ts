/**
 * RepoForge Manifest Generator
 * Creates machine-readable manifest describing entire repository
 */

import * as fs from 'fs';
import * as path from 'path';
import type { RepoMap, FileEntry } from './types.js';
import { detectProject, type ProjectProfile } from './projectDetector.js';

export interface RepoManifest {
  version: string;
  generated: string;
  repository: {
    root: string;
    name: string;
    totalFiles: number;
    totalDirectories: number;
    totalSize: number;
  };
  profile: ProjectProfile;
  structure: {
    directories: DirectoryNode[];
    entryPoints: string[];
    configFiles: string[];
  };
  dependencies: {
    production: Record<string, string>;
    development: Record<string, string>;
  };
  scripts: Record<string, string>;
  languages: LanguageStats[];
  modules: ModuleInfo[];
  exports: ExportInfo[];
  documentation: {
    readme: boolean;
    changelog: boolean;
    contributing: boolean;
    license: string | null;
  };
  quality: {
    testCoverage: number;
    hasLinting: boolean;
    hasFormatting: boolean;
    hasCI: boolean;
  };
}

export interface DirectoryNode {
  path: string;
  fileCount: number;
  purpose: string;
}

export interface LanguageStats {
  language: string;
  files: number;
  lines: number;
  percentage: number;
}

export interface ModuleInfo {
  path: string;
  type: 'component' | 'service' | 'model' | 'util' | 'route' | 'other';
  exports: string[];
  imports: string[];
  dependencies: string[];
}

export interface ExportInfo {
  file: string;
  name: string;
  type: 'function' | 'class' | 'const' | 'type' | 'interface' | 'default';
}

export function generateManifest(repo: RepoMap): RepoManifest {
  const profile = detectProject(repo);
  const repoName = path.basename(repo.root);
  
  // Calculate total size
  const totalSize = repo.entries
    .filter(e => e.kind === 'file' && e.size)
    .reduce((sum, e) => sum + (e.size || 0), 0);
  
  // Analyze structure
  const structure = analyzeStructure(repo);
  
  // Parse package.json if exists
  const packageInfo = parsePackageJson(repo.root);
  
  // Analyze languages
  const languages = analyzeLanguages(repo);
  
  // Analyze modules
  const modules = analyzeModules(repo);
  
  // Find exports
  const exports = findExports(repo);
  
  // Check documentation
  const documentation = checkDocumentation(repo);
  
  // Assess quality
  const quality = assessQuality(repo, profile);
  
  return {
    version: '1.0.0',
    generated: new Date().toISOString(),
    repository: {
      root: repo.root,
      name: repoName,
      totalFiles: repo.totalFiles,
      totalDirectories: repo.totalDirectories,
      totalSize
    },
    profile,
    structure,
    dependencies: packageInfo.dependencies,
    scripts: packageInfo.scripts,
    languages,
    modules,
    exports,
    documentation,
    quality
  };
}

function analyzeStructure(repo: RepoMap): {
  directories: DirectoryNode[];
  entryPoints: string[];
  configFiles: string[];
} {
  const directories: DirectoryNode[] = [];
  const entryPoints: string[] = [];
  const configFiles: string[] = [];
  
  // Group files by directory
  const dirMap = new Map<string, FileEntry[]>();
  
  for (const entry of repo.entries) {
    if (entry.kind === 'file') {
      const dir = path.dirname(entry.path);
      if (!dirMap.has(dir)) {
        dirMap.set(dir, []);
      }
      dirMap.get(dir)!.push(entry);
      
      // Detect entry points
      const fileName = path.basename(entry.path);
      if (['index.ts', 'index.js', 'main.ts', 'main.js', 'app.ts', 'app.js', 'server.ts', 'server.js'].includes(fileName)) {
        entryPoints.push(entry.path);
      }
      
      // Detect config files
      if (fileName.includes('config') || 
          ['tsconfig.json', 'package.json', '.eslintrc', '.prettierrc', 'jest.config.js', 
           'vite.config.js', 'webpack.config.js', 'next.config.js'].some(c => fileName.includes(c))) {
        configFiles.push(entry.path);
      }
    }
  }
  
  // Analyze each directory
  for (const [dirPath, files] of dirMap.entries()) {
    if (dirPath === '.' || dirPath.includes('node_modules')) continue;
    
    const purpose = inferDirectoryPurpose(dirPath, files);
    
    directories.push({
      path: dirPath,
      fileCount: files.length,
      purpose
    });
  }
  
  return { directories, entryPoints, configFiles };
}

function inferDirectoryPurpose(dirPath: string, files: FileEntry[]): string {
  const lower = dirPath.toLowerCase();
  
  if (lower.includes('component')) return 'UI Components';
  if (lower.includes('page')) return 'Pages/Routes';
  if (lower.includes('service')) return 'Business Logic Services';
  if (lower.includes('model')) return 'Data Models';
  if (lower.includes('util') || lower.includes('helper')) return 'Utility Functions';
  if (lower.includes('api') || lower.includes('route')) return 'API Routes';
  if (lower.includes('controller')) return 'Controllers';
  if (lower.includes('middleware')) return 'Middleware';
  if (lower.includes('config')) return 'Configuration';
  if (lower.includes('test')) return 'Tests';
  if (lower.includes('type')) return 'Type Definitions';
  if (lower.includes('hook')) return 'React Hooks';
  if (lower.includes('store')) return 'State Management';
  if (lower.includes('style')) return 'Styles';
  if (lower.includes('asset') || lower.includes('public')) return 'Static Assets';
  if (lower.includes('lib')) return 'Library Code';
  if (lower.includes('core')) return 'Core Functionality';
  if (lower === 'src') return 'Source Code';
  
  // Infer from file types
  const hasComponents = files.some(f => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'));
  const hasTests = files.some(f => f.path.includes('.test.') || f.path.includes('.spec.'));
  const hasTypes = files.some(f => f.path.endsWith('.d.ts'));
  
  if (hasComponents) return 'Components';
  if (hasTests) return 'Tests';
  if (hasTypes) return 'Type Definitions';
  
  return 'Mixed/Other';
}

function parsePackageJson(root: string): {
  dependencies: { production: Record<string, string>; development: Record<string, string> };
  scripts: Record<string, string>;
} {
  const packagePath = path.join(root, 'package.json');
  
  try {
    const content = fs.readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(content);
    
    return {
      dependencies: {
        production: pkg.dependencies || {},
        development: pkg.devDependencies || {}
      },
      scripts: pkg.scripts || {}
    };
  } catch {
    return {
      dependencies: { production: {}, development: {} },
      scripts: {}
    };
  }
}

function analyzeLanguages(repo: RepoMap): LanguageStats[] {
  const languageMap = new Map<string, { files: number; lines: number }>();
  
  const codeFiles = repo.entries.filter(e => e.kind === 'file' && !e.path.includes('node_modules'));
  
  for (const file of codeFiles) {
    const ext = path.extname(file.path);
    const language = getLanguageFromExtension(ext);
    
    if (!language) continue;
    
    if (!languageMap.has(language)) {
      languageMap.set(language, { files: 0, lines: 0 });
    }
    
    const stats = languageMap.get(language)!;
    stats.files++;
    
    // Count lines
    try {
      const content = fs.readFileSync(path.join(repo.root, file.path), 'utf-8');
      stats.lines += content.split('\n').length;
    } catch {
      // Skip if can't read
    }
  }
  
  const totalLines = Array.from(languageMap.values()).reduce((sum, s) => sum + s.lines, 0);
  
  const languages: LanguageStats[] = [];
  for (const [language, stats] of languageMap.entries()) {
    languages.push({
      language,
      files: stats.files,
      lines: stats.lines,
      percentage: totalLines > 0 ? Math.round((stats.lines / totalLines) * 100) : 0
    });
  }
  
  return languages.sort((a, b) => b.lines - a.lines);
}

function getLanguageFromExtension(ext: string): string | null {
  const map: Record<string, string> = {
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.py': 'Python',
    '.java': 'Java',
    '.go': 'Go',
    '.rs': 'Rust',
    '.cpp': 'C++',
    '.c': 'C',
    '.cs': 'C#',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.swift': 'Swift',
    '.kt': 'Kotlin',
    '.scala': 'Scala',
    '.html': 'HTML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.sass': 'Sass',
    '.less': 'Less',
    '.vue': 'Vue',
    '.svelte': 'Svelte',
    '.json': 'JSON',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.xml': 'XML',
    '.md': 'Markdown',
    '.sql': 'SQL',
    '.sh': 'Shell',
    '.bash': 'Bash'
  };
  
  return map[ext] || null;
}

function analyzeModules(repo: RepoMap): ModuleInfo[] {
  const modules: ModuleInfo[] = [];
  
  const codeFiles = repo.entries.filter(e => 
    e.kind === 'file' && 
    (e.path.endsWith('.ts') || e.path.endsWith('.tsx') || 
     e.path.endsWith('.js') || e.path.endsWith('.jsx')) &&
    !e.path.includes('node_modules') &&
    !e.path.endsWith('.d.ts')
  );
  
  for (const file of codeFiles.slice(0, 100)) { // Limit to avoid performance issues
    try {
      const content = fs.readFileSync(path.join(repo.root, file.path), 'utf-8');
      
      const moduleType = inferModuleType(file.path);
      const exports = extractExportNames(content);
      const imports = extractImportPaths(content);
      const dependencies = extractDependencies(content);
      
      modules.push({
        path: file.path,
        type: moduleType,
        exports,
        imports,
        dependencies
      });
    } catch {
      // Skip if can't read
    }
  }
  
  return modules;
}

function inferModuleType(filePath: string): ModuleInfo['type'] {
  const lower = filePath.toLowerCase();
  
  if (lower.includes('component')) return 'component';
  if (lower.includes('service')) return 'service';
  if (lower.includes('model')) return 'model';
  if (lower.includes('util') || lower.includes('helper')) return 'util';
  if (lower.includes('route') || lower.includes('api')) return 'route';
  
  return 'other';
}

function extractExportNames(content: string): string[] {
  const exports: string[] = [];
  
  // Match named exports
  const namedExportRegex = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
  let match;
  
  while ((match = namedExportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  // Match export { ... }
  const exportListRegex = /export\s+{\s*([^}]+)\s*}/g;
  while ((match = exportListRegex.exec(content)) !== null) {
    const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0].trim());
    exports.push(...names);
  }
  
  // Check for default export
  if (content.includes('export default')) {
    exports.push('default');
  }
  
  return [...new Set(exports)];
}

function extractImportPaths(content: string): string[] {
  const imports: string[] = [];
  
  const importRegex = /import\s+(?:[\w\s{},*]*\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return [...new Set(imports)];
}

function extractDependencies(content: string): string[] {
  const deps: string[] = [];
  
  const importRegex = /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const dep = match[1];
    // Only external dependencies (not relative paths)
    if (!dep.startsWith('.') && !dep.startsWith('/')) {
      // Extract package name (handle scoped packages)
      const pkgName = dep.startsWith('@') ? dep.split('/').slice(0, 2).join('/') : dep.split('/')[0];
      deps.push(pkgName);
    }
  }
  
  return [...new Set(deps)];
}

function findExports(repo: RepoMap): ExportInfo[] {
  const exports: ExportInfo[] = [];
  
  const codeFiles = repo.entries.filter(e => 
    e.kind === 'file' && 
    (e.path.endsWith('.ts') || e.path.endsWith('.tsx') || 
     e.path.endsWith('.js') || e.path.endsWith('.jsx')) &&
    !e.path.includes('node_modules') &&
    !e.path.endsWith('.d.ts')
  );
  
  for (const file of codeFiles.slice(0, 50)) { // Limit for performance
    try {
      const content = fs.readFileSync(path.join(repo.root, file.path), 'utf-8');
      const fileExports = parseExports(content, file.path);
      exports.push(...fileExports);
    } catch {
      // Skip
    }
  }
  
  return exports;
}

function parseExports(content: string, filePath: string): ExportInfo[] {
  const exports: ExportInfo[] = [];
  
  // Match export function
  const funcRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
  let match;
  while ((match = funcRegex.exec(content)) !== null) {
    exports.push({ file: filePath, name: match[1], type: 'function' });
  }
  
  // Match export class
  const classRegex = /export\s+class\s+(\w+)/g;
  while ((match = classRegex.exec(content)) !== null) {
    exports.push({ file: filePath, name: match[1], type: 'class' });
  }
  
  // Match export const/let/var
  const constRegex = /export\s+(?:const|let|var)\s+(\w+)/g;
  while ((match = constRegex.exec(content)) !== null) {
    exports.push({ file: filePath, name: match[1], type: 'const' });
  }
  
  // Match export type/interface
  const typeRegex = /export\s+(?:type|interface)\s+(\w+)/g;
  while ((match = typeRegex.exec(content)) !== null) {
    exports.push({ file: filePath, name: match[1], type: content.includes('interface') ? 'interface' : 'type' });
  }
  
  // Match export default
  if (content.includes('export default')) {
    exports.push({ file: filePath, name: 'default', type: 'default' });
  }
  
  return exports;
}

function checkDocumentation(repo: RepoMap): RepoManifest['documentation'] {
  const hasFile = (name: string) => repo.entries.some(e => 
    e.kind === 'file' && e.path.toLowerCase().includes(name.toLowerCase())
  );
  
  const readme = hasFile('readme');
  const changelog = hasFile('changelog');
  const contributing = hasFile('contributing');
  
  // Check for license
  let license: string | null = null;
  const licenseFile = repo.entries.find(e => 
    e.kind === 'file' && e.path.toLowerCase().includes('license')
  );
  
  if (licenseFile) {
    try {
      const content = fs.readFileSync(path.join(repo.root, licenseFile.path), 'utf-8');
      if (content.includes('MIT')) license = 'MIT';
      else if (content.includes('Apache')) license = 'Apache-2.0';
      else if (content.includes('GPL')) license = 'GPL';
      else if (content.includes('BSD')) license = 'BSD';
      else license = 'Custom';
    } catch {
      license = 'Unknown';
    }
  }
  
  return { readme, changelog, contributing, license };
}

function assessQuality(repo: RepoMap, profile: ProjectProfile): RepoManifest['quality'] {
  const hasFile = (pattern: string | RegExp) => repo.entries.some(e => {
    if (typeof pattern === 'string') {
      return e.kind === 'file' && e.path.includes(pattern);
    }
    return e.kind === 'file' && pattern.test(e.path);
  });
  
  // Estimate test coverage
  const codeFiles = repo.entries.filter(e => 
    e.kind === 'file' && 
    (e.path.endsWith('.ts') || e.path.endsWith('.tsx') || 
     e.path.endsWith('.js') || e.path.endsWith('.jsx')) &&
    !e.path.includes('node_modules') &&
    !e.path.includes('.test.') &&
    !e.path.includes('.spec.')
  ).length;
  
  const testFiles = repo.entries.filter(e => 
    e.kind === 'file' && 
    (e.path.includes('.test.') || e.path.includes('.spec.'))
  ).length;
  
  const testCoverage = codeFiles > 0 ? Math.round((testFiles / codeFiles) * 100) : 0;
  
  const hasLinting = hasFile('.eslintrc') || hasFile('eslint.config');
  const hasFormatting = hasFile('.prettierrc') || hasFile('prettier.config');
  const hasCI = hasFile('.github/workflows') || hasFile('.gitlab-ci') || hasFile('circle.yml');
  
  return {
    testCoverage,
    hasLinting,
    hasFormatting,
    hasCI
  };
}

export function manifestToJSON(manifest: RepoManifest): string {
  return JSON.stringify(manifest, null, 2);
}

export function manifestToYAML(manifest: RepoManifest): string {
  // Simple YAML serialization
  const lines: string[] = [];
  
  lines.push(`version: ${manifest.version}`);
  lines.push(`generated: ${manifest.generated}`);
  lines.push('');
  lines.push('repository:');
  lines.push(`  name: ${manifest.repository.name}`);
  lines.push(`  root: ${manifest.repository.root}`);
  lines.push(`  totalFiles: ${manifest.repository.totalFiles}`);
  lines.push(`  totalDirectories: ${manifest.repository.totalDirectories}`);
  lines.push(`  totalSize: ${manifest.repository.totalSize}`);
  lines.push('');
  lines.push('profile:');
  lines.push(`  type: ${manifest.profile.type}`);
  lines.push(`  frameworks: [${manifest.profile.frameworks.join(', ')}]`);
  lines.push(`  architecture: ${manifest.profile.architecture}`);
  lines.push(`  hasTests: ${manifest.profile.hasTests}`);
  lines.push(`  hasTypeScript: ${manifest.profile.hasTypeScript}`);
  lines.push(`  confidence: ${manifest.profile.confidence}%`);
  lines.push('');
  lines.push('languages:');
  for (const lang of manifest.languages) {
    lines.push(`  - language: ${lang.language}`);
    lines.push(`    files: ${lang.files}`);
    lines.push(`    lines: ${lang.lines}`);
    lines.push(`    percentage: ${lang.percentage}%`);
  }
  lines.push('');
  lines.push('quality:');
  lines.push(`  testCoverage: ${manifest.quality.testCoverage}%`);
  lines.push(`  hasLinting: ${manifest.quality.hasLinting}`);
  lines.push(`  hasFormatting: ${manifest.quality.hasFormatting}`);
  lines.push(`  hasCI: ${manifest.quality.hasCI}`);
  
  return lines.join('\n');
}
