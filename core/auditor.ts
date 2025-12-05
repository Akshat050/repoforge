/**
 * RepoForge Auditor
 * Runs spooky audits on repositories (ghosts, curses, zombies)
 */

import * as path from "path";
import * as fs from "fs";
import type { RepoMap, Issue } from "./types.js";

const CODE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
const TEST_SUFFIXES = [
  ".test.ts",
  ".spec.ts",
  ".test.tsx",
  ".spec.tsx",
  ".test.js",
  ".spec.js",
  ".test.jsx",
  ".spec.jsx",
];

function isCodeFile(filePath: string): boolean {
  return CODE_EXTENSIONS.some((ext) => filePath.endsWith(ext));
}

function isTestFile(filePath: string): boolean {
  return TEST_SUFFIXES.some((suffix) => filePath.endsWith(suffix));
}

function getTestVariants(filePath: string): string[] {
  const ext = path.extname(filePath);
  const baseName = filePath.slice(0, -ext.length);

  return [`${baseName}.test${ext}`, `${baseName}.spec${ext}`];
}

function isCamelCase(name: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/.test(name);
}

function isPascalCase(name: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

function isSnakeCase(name: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(name) && name.includes('_');
}

function isKebabCase(name: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(name) && name.includes('-');
}

/**
 * 👻 Ghosts: code files in src/ with no matching test file
 * Smart detection: looks in src/, lib/, core/, or main code directories
 */
function auditGhosts(repo: RepoMap): Issue[] {
  const issues: Issue[] = [];
  const allPaths = new Set(repo.entries.map((e) => e.path));
  
  // Determine main code directories
  const codeDirectories = ['src/', 'lib/', 'core/'];
  const mainCodeDir = codeDirectories.find(dir => 
    repo.entries.some(e => e.path.startsWith(dir))
  ) || 'src/';

  const codeFiles = repo.entries.filter(
    (entry) =>
      entry.kind === "file" &&
      entry.path.startsWith(mainCodeDir) &&
      isCodeFile(entry.path) &&
      !isTestFile(entry.path) &&
      !entry.path.endsWith('.d.ts'), // skip type definition files
  );

  for (const file of codeFiles) {
    const testVariants = getTestVariants(file.path);
    
    // Also check for tests in tests/ or test/ directories
    const fileName = path.basename(file.path);
    const testDirVariants = [
      `tests/${fileName.replace(/\.(ts|js|tsx|jsx)$/, '.test$1')}`,
      `test/${fileName.replace(/\.(ts|js|tsx|jsx)$/, '.test$1')}`,
      `tests/${fileName.replace(/\.(ts|js|tsx|jsx)$/, '.spec$1')}`,
      `test/${fileName.replace(/\.(ts|js|tsx|jsx)$/, '.spec$1')}`,
    ];
    
    const hasTest = [...testVariants, ...testDirVariants].some((variant) => allPaths.has(variant));

    if (!hasTest) {
      issues.push({
        id: "GHOST_MISSING_TEST",
        type: "ghost",
        severity: "medium",
        filePath: file.path,
        message: `File "${file.path}" has no matching test file and is haunting the repo as a ghost. Consider adding ${path.basename(
          testVariants[0] ?? "",
        )}.`,
      });
    }
  }

  return issues;
}

/**
 * Small heuristic to guess if a JS/TS file is frontend or backend.
 */
type FileRole = "frontend" | "backend" | "unknown";

function guessFileRole(filePath: string, absPath: string): FileRole {
  const lowerPath = filePath.toLowerCase();

  // Path-based hints
  const frontendHints = [
    "/components/",
    "/pages/",
    "/hooks/",
    "/styles/",
    "/ui/",
    "/public/",
    "/assets/",
    "/frontend/",
    "/client/",
  ];
  const backendHints = [
    "/routes/",
    "/controllers/",
    "/services/",
    "/models/",
    "/api/",
    "/server/",
    "/backend/",
    "/db/",
    "/repositories/",
  ];

  if (frontendHints.some((h) => lowerPath.includes(h))) {
    return "frontend";
  }
  if (backendHints.some((h) => lowerPath.includes(h))) {
    return "backend";
  }

  // Content-based hints (very light)
  let text: string;
  try {
    text = fs.readFileSync(absPath, "utf8");
  } catch {
    return "unknown";
  }

  const lower = text.toLowerCase();

  // Frontend keywords
  if (
    lower.includes(`from "react"`) ||
    lower.includes(`from 'react'`) ||
    lower.includes("reactdom") ||
    lower.includes("nextpage") ||
    lower.includes("jsx") ||
    lower.includes("tsx")
  ) {
    return "frontend";
  }

  // Backend keywords
  if (
    lower.includes(`from "express"`) ||
    lower.includes(`from 'express'`) ||
    lower.includes("require('express')") ||
    lower.includes('require("express")') ||
    lower.includes("@nestjs/") ||
    lower.includes("fastify") ||
    lower.includes("koa")
  ) {
    return "backend";
  }

  return "unknown";
}

/**
 * 🧿 Curses: naming, file size, and mixed frontend/backend layers
 */
function auditCurses(repo: RepoMap): Issue[] {
  const issues: Issue[] = [];

  // 1) Comprehensive naming convention checks
  
  // Services should be camelCase
  const serviceFiles = repo.entries.filter(
    (entry) =>
      entry.kind === "file" &&
      entry.path.includes("/services/") &&
      isCodeFile(entry.path),
  );

  for (const file of serviceFiles) {
    const baseName = path.basename(file.path, path.extname(file.path));
    if (!isCamelCase(baseName) && !isPascalCase(baseName)) {
      issues.push({
        id: "CURSE_NAMING_SERVICE",
        type: "curse",
        severity: "low",
        filePath: file.path,
        message: `Service file "${file.path}" should use camelCase (userService.ts) or PascalCase (UserService.ts).`,
        suggestion: "Rename to follow camelCase or PascalCase convention"
      });
    }
  }
  
  // Components should be PascalCase
  const componentFiles = repo.entries.filter(
    (entry) =>
      entry.kind === "file" &&
      (entry.path.includes("/components/") || entry.path.includes("/Component")) &&
      (entry.path.endsWith('.tsx') || entry.path.endsWith('.jsx')),
  );

  for (const file of componentFiles) {
    const baseName = path.basename(file.path, path.extname(file.path));
    if (!isPascalCase(baseName)) {
      issues.push({
        id: "CURSE_NAMING_COMPONENT",
        type: "curse",
        severity: "medium",
        filePath: file.path,
        message: `Component "${file.path}" should use PascalCase naming (Button.tsx, UserCard.tsx).`,
        suggestion: "Rename component to PascalCase"
      });
    }
  }
  
  // Models/Types should be PascalCase
  const modelFiles = repo.entries.filter(
    (entry) =>
      entry.kind === "file" &&
      (entry.path.includes("/models/") || entry.path.includes("/types/")) &&
      isCodeFile(entry.path) &&
      !entry.path.endsWith('.d.ts'),
  );

  for (const file of modelFiles) {
    const baseName = path.basename(file.path, path.extname(file.path));
    if (!isPascalCase(baseName) && !isCamelCase(baseName)) {
      issues.push({
        id: "CURSE_NAMING_MODEL",
        type: "curse",
        severity: "low",
        filePath: file.path,
        message: `Model/Type file "${file.path}" should use PascalCase (User.ts) or camelCase (user.ts).`,
        suggestion: "Follow consistent naming convention"
      });
    }
  }
  
  // Utils/Helpers should be camelCase
  const utilFiles = repo.entries.filter(
    (entry) =>
      entry.kind === "file" &&
      (entry.path.includes("/utils/") || entry.path.includes("/helpers/")) &&
      isCodeFile(entry.path),
  );

  for (const file of utilFiles) {
    const baseName = path.basename(file.path, path.extname(file.path));
    if (!isCamelCase(baseName) && !isKebabCase(baseName)) {
      issues.push({
        id: "CURSE_NAMING_UTIL",
        type: "curse",
        severity: "low",
        filePath: file.path,
        message: `Utility file "${file.path}" should use camelCase (dateUtils.ts) or kebab-case (date-utils.ts).`,
        suggestion: "Use camelCase or kebab-case for utility files"
      });
    }
  }
  
  // Check for snake_case in JS/TS files (usually wrong)
  const allCodeFiles = repo.entries.filter(
    (entry) =>
      entry.kind === "file" &&
      isCodeFile(entry.path) &&
      !entry.path.includes('node_modules'),
  );

  for (const file of allCodeFiles) {
    const baseName = path.basename(file.path, path.extname(file.path));
    if (isSnakeCase(baseName) && !file.path.includes('test') && !file.path.includes('spec')) {
      issues.push({
        id: "CURSE_NAMING_SNAKE_CASE",
        type: "curse",
        severity: "low",
        filePath: file.path,
        message: `File "${file.path}" uses snake_case naming. JavaScript/TypeScript typically uses camelCase or PascalCase.`,
        suggestion: "Convert to camelCase or PascalCase"
      });
    }
  }

  // 2) Monster-sized JS/TS files - context-aware thresholds
  // Different thresholds for different file types
  const THRESHOLDS = {
    component: 400,    // UI components (React, Vue, etc.)
    controller: 500,   // Controllers/routes
    service: 600,      // Business logic services
    model: 400,        // Data models
    config: 800,       // Config files can be longer
    test: 1000,        // Test files can be very long
    default: 500       // General threshold
  };

  const longCandidates = repo.entries.filter(
    (entry) =>
      entry.kind === "file" &&
      (entry.path.startsWith("src/") || entry.path.startsWith("lib/") || entry.path.startsWith("core/")) &&
      isCodeFile(entry.path) &&
      !isTestFile(entry.path), // Skip test files
  );

  for (const file of longCandidates) {
    const absPath = path.join(repo.root, file.path);

    let text: string;
    try {
      text = fs.readFileSync(absPath, "utf8");
    } catch {
      continue; // can't read, skip
    }

    const lineCount = text.split(/\r?\n/).length;
    
    // Determine appropriate threshold based on file type
    const lowerPath = file.path.toLowerCase();
    let threshold = THRESHOLDS.default;
    
    if (lowerPath.includes('/component') || lowerPath.match(/\.(jsx|tsx)$/)) {
      threshold = THRESHOLDS.component;
    } else if (lowerPath.includes('/controller') || lowerPath.includes('/route')) {
      threshold = THRESHOLDS.controller;
    } else if (lowerPath.includes('/service')) {
      threshold = THRESHOLDS.service;
    } else if (lowerPath.includes('/model')) {
      threshold = THRESHOLDS.model;
    } else if (lowerPath.includes('config')) {
      threshold = THRESHOLDS.config;
    }
    
    // Only flag if significantly over threshold
    if (lineCount > threshold) {
      const severity = lineCount > threshold * 2 ? "high" : "medium";
      
      issues.push({
        id: "CURSE_MONOLITHIC_FILE",
        type: "curse",
        severity,
        filePath: file.path,
        message: `File "${file.path}" is monstrously long (${lineCount} lines, threshold: ${threshold}). Consider splitting it into smaller, focused modules to lift the curse.`,
      });
    }
  }

  // 3) Mixed frontend/backend folders (layer curse)
  type FolderRole = {
    frontend: string[]; // example files
    backend: string[];  // example files
  };

  const folderRoles = new Map<string, FolderRole>();

  const srcCodeFiles = repo.entries.filter(
    (entry) =>
      entry.kind === "file" &&
      entry.path.startsWith("src/") &&
      isCodeFile(entry.path),
  );

  for (const entry of srcCodeFiles) {
    const absPath = path.join(repo.root, entry.path);
    const role = guessFileRole(entry.path, absPath);
    if (role === "unknown") continue;

    const folderPath = entry.path.split("/").slice(0, -1).join("/");
    if (!folderRoles.has(folderPath)) {
      folderRoles.set(folderPath, { frontend: [], backend: [] });
    }
    const bucket = folderRoles.get(folderPath)!;
    if (role === "frontend") bucket.frontend.push(entry.path);
    if (role === "backend") bucket.backend.push(entry.path);
  }

  for (const [folder, roles] of folderRoles.entries()) {
    if (roles.frontend.length > 0 && roles.backend.length > 0) {
      const exampleFront = roles.frontend[0];
      const exampleBack = roles.backend[0];

      issues.push({
        id: "CURSE_MIXED_FRONTEND_BACKEND",
        type: "curse",
        severity: "medium",
        filePath: folder,
        message: `Folder "${folder}" mixes frontend and backend JS/TS files. Example frontend: "${exampleFront}", backend: "${exampleBack}". Consider separating layers (e.g. src/frontend/ and src/backend/) to break the architecture curse.`,
      });
    }
  }

  return issues;
}

/**
 * 🧟 Zombies: code files living outside src/
 * Smart detection: skip if project uses alternative structures (lib/, core/, cli/, etc.)
 */
function auditZombies(repo: RepoMap): Issue[] {
  const issues: Issue[] = [];
  
  // Detect Next.js/Nuxt (framework-specific structures)
  const isNextJS = repo.entries.some(e => 
    e.path.includes('next.config.js') || e.path.includes('next.config.ts') || 
    e.path.startsWith('app/') || e.path.includes('/app/')
  );
  const isNuxt = repo.entries.some(e => 
    e.path.includes('nuxt.config.js') || e.path.includes('nuxt.config.ts')
  );
  
  // Check for alternative structures
  const hasAlternativeStructure = repo.entries.some(e => 
    e.path.startsWith('core/') || e.path.startsWith('packages/') || e.path.startsWith('apps/') ||
    e.path.startsWith('cli/') || e.path.startsWith('mcp-server/')
  );
  
  // Build artifacts to skip (check anywhere in path)
  const shouldSkip = (p: string) => 
    p.includes('/.next/') || p.startsWith('.next/') ||
    p.includes('/.nuxt/') || p.startsWith('.nuxt/') ||
    p.includes('/dist/') || p.startsWith('dist/') ||
    p.includes('/build/') || p.startsWith('build/') ||
    p.includes('/out/') || p.startsWith('out/') ||
    p.includes('/node_modules/') || p.startsWith('node_modules/') ||
    p.endsWith('.d.ts');
  
  // Framework-valid directories (check if path contains these patterns)
  const validPatterns: string[] = ['src/', 'tests/', 'test/', '__tests__/'];
  if (isNextJS) {
    validPatterns.push('app/', 'pages/', 'components/', 'lib/', 'public/', 
                      'styles/', 'utils/', 'hooks/', 'types/');
  }
  if (isNuxt) {
    validPatterns.push('pages/', 'components/', 'layouts/', 'middleware/', 
                      'plugins/', 'store/', 'assets/', 'static/', 'composables/');
  }
  if (hasAlternativeStructure) {
    validPatterns.push('core/', 'packages/', 'apps/', 'cli/', 'mcp-server/');
  }
  
  // Check if path is in a valid directory
  const isInValidDir = (p: string): boolean => {
    return validPatterns.some(pattern => 
      p.startsWith(pattern) || p.includes(`/${pattern}`)
    );
  };
  
  // Valid root config files
  const validRootFiles = new Set([
    'next.config.js', 'next.config.ts', 'nuxt.config.js', 'nuxt.config.ts',
    'vite.config.js', 'vite.config.ts', 'webpack.config.js', 'tailwind.config.js',
    'postcss.config.js', 'playwright.config.ts', 'vitest.config.ts', 'jest.config.js',
    'next-env.d.ts', 'index.ts', 'index.js', 'main.ts', 'app.ts'
  ]);
  
  const zombieFiles = repo.entries.filter((entry) => {
    if (entry.kind !== "file" || !isCodeFile(entry.path)) return false;
    if (shouldSkip(entry.path)) return false;
    
    const fileName = entry.path.split('/').pop() || '';
    // Allow valid config files anywhere (root or in subfolders)
    if (validRootFiles.has(fileName)) return false;
    
    if (isInValidDir(entry.path)) return false;
    
    return true;
  });
  
  for (const file of zombieFiles) {
    issues.push({
      id: "ZOMBIE_OUTSIDE_SRC",
      type: "zombie",
      severity: "low",
      filePath: file.path,
      message: `Code file "${file.path}" is outside standard directories. ${isNextJS || isNuxt || hasAlternativeStructure ? 'Consider organizing it properly.' : 'Move it to src/ or justify its existence.'}`,
    });
  }

  return issues;
}

export function auditRepo(repo: RepoMap): Issue[] {
  const issues: Issue[] = [];

  issues.push(...auditGhosts(repo));
  issues.push(...auditCurses(repo));
  issues.push(...auditZombies(repo));

  return issues;
}

/**
 * Full audit including code analysis
 */
export async function auditRepoWithCode(repo: RepoMap): Promise<Issue[]> {
  const issues = auditRepo(repo);
  
  // Import code analyzer
  try {
    const { analyzeCode } = await import('./codeAnalyzer.js');
    const codeIssues = analyzeCode(repo);
    issues.push(...codeIssues);
  } catch (err) {
    console.error('Warning: Code analysis failed:', err);
  }
  
  return issues;
}

/**
 * Smart audit with project detection and recommendations
 * Now uses the Rule Engine for extensible, configurable auditing
 */
export async function smartAuditRepo(repo: RepoMap, cliConfig?: Partial<import('./ruleEngine/types.js').RuleEngineConfig>): Promise<import('./types.js').AuditResult> {
  const profile = detectProjectProfile(repo);
  const explanation = generateHumanExplanation(profile);
  
  // Use Rule Engine for auditing
  const { smartAudit } = await import('./smartAuditor.js');
  const smartResult = await smartAudit(repo, cliConfig);
  const issues = smartResult.issues;
  const recommendations = smartResult.recommendations;
  
  const summary = {
    totalIssues: issues.length,
    ghosts: issues.filter(i => i.type === 'ghost').length,
    curses: issues.filter(i => i.type === 'curse').length,
    zombies: issues.filter(i => i.type === 'zombie').length,
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
  };
  
  return { profile, explanation, issues, recommendations, summary };
}

/**
 * Legacy synchronous version for backward compatibility
 */
export function smartAuditRepoSync(repo: RepoMap): import('./types.js').AuditResult {
  const profile = detectProjectProfile(repo);
  const explanation = generateHumanExplanation(profile);
  const issues = auditRepo(repo);
  const recommendations = generateSmartRecommendations(profile, issues);
  
  const summary = {
    totalIssues: issues.length,
    ghosts: issues.filter(i => i.type === 'ghost').length,
    curses: issues.filter(i => i.type === 'curse').length,
    zombies: issues.filter(i => i.type === 'zombie').length,
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
  };
  
  return { profile, explanation, issues, recommendations, summary };
}

function detectProjectProfile(repo: RepoMap): import('./types.js').ProjectProfile {
  const entries = repo.entries;
  
  const hasFile = (pattern: string | RegExp): boolean => {
    return entries.some(e => {
      if (typeof pattern === 'string') {
        return e.path === pattern || e.path.endsWith(`/${pattern}`);
      }
      return pattern.test(e.path);
    });
  };
  
  // Detect frameworks
  const frameworks: import('./types.js').Framework[] = [];
  if (hasFile(/\.jsx$/) || hasFile(/\.tsx$/)) frameworks.push('react');
  if (hasFile('next.config.js') || hasFile('next.config.ts')) frameworks.push('next');
  if (hasFile(/\.vue$/)) frameworks.push('vue');
  if (hasFile('nuxt.config.js') || hasFile('nuxt.config.ts')) frameworks.push('nuxt');
  if (hasFile('angular.json')) frameworks.push('angular');
  if (hasFile(/\.svelte$/)) frameworks.push('svelte');
  if (hasFile(/src\/routes/) || hasFile(/express/i)) frameworks.push('express');
  if (hasFile('nest-cli.json')) frameworks.push('nest');
  if (frameworks.length === 0) frameworks.push('none');
  
  // Detect project type
  const hasFrontend = hasFile(/src\/components/) || hasFile(/\.jsx$/) || hasFile(/\.tsx$/) || hasFile(/\.vue$/);
  const hasBackend = hasFile(/src\/routes/) || hasFile(/src\/controllers/) || hasFile(/src\/services/);
  const isMonorepo = hasFile('lerna.json') || hasFile('pnpm-workspace.yaml') || hasFile(/packages\//);
  
  let type: import('./types.js').ProjectType = 'unknown';
  if (isMonorepo) type = 'monorepo';
  else if (hasFrontend && hasBackend) type = 'fullstack';
  else if (hasFrontend) type = 'frontend';
  else if (hasBackend) type = 'backend';
  else if (hasFile(/^(src\/)?index\.(ts|js)$/)) type = 'library';
  
  // Detect architecture
  const hasControllers = hasFile(/src\/controllers/);
  const hasModels = hasFile(/src\/models/);
  const hasServices = hasFile(/src\/services/);
  const hasDomain = hasFile(/src\/domain/);
  const hasInfra = hasFile(/src\/infrastructure/);
  const hasModules = hasFile(/src\/modules/);
  
  let architecture: import('./types.js').Architecture = 'unknown';
  if (hasDomain && hasInfra) architecture = 'clean';
  else if (hasControllers && hasModels) architecture = 'mvc';
  else if (hasServices) architecture = 'layered';
  else if (hasModules) architecture = 'modular';
  else if (entries.filter(e => e.path.match(/^src\/[^\/]+\.(ts|js)$/)).length > 3) architecture = 'flat';
  
  const hasTests = hasFile(/\.test\.(ts|js|tsx|jsx)$/) || hasFile(/\.spec\.(ts|js|tsx|jsx)$/);
  const hasTypeScript = hasFile(/\.ts$/) || hasFile('tsconfig.json');
  const hasBuildConfig = hasFile('webpack.config.js') || hasFile('vite.config.js') || hasFile('tsconfig.json');
  
  let packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown' = 'unknown';
  if (hasFile('pnpm-lock.yaml')) packageManager = 'pnpm';
  else if (hasFile('yarn.lock')) packageManager = 'yarn';
  else if (hasFile('bun.lockb')) packageManager = 'bun';
  else if (hasFile('package-lock.json')) packageManager = 'npm';
  
  let confidence = 50;
  if (frameworks.length > 0 && frameworks[0] !== 'none') confidence += 20;
  if (architecture !== 'unknown') confidence += 15;
  if (hasTests) confidence += 10;
  if (hasBuildConfig) confidence += 5;
  
  return {
    type,
    frameworks,
    architecture,
    hasTests,
    hasTypeScript,
    hasBuildConfig,
    packageManager,
    confidence: Math.min(confidence, 100)
  };
}

function generateHumanExplanation(profile: import('./types.js').ProjectProfile): string {
  const parts: string[] = [];
  
  // Explain project type
  const typeExplanations: Record<string, string> = {
    frontend: "This is a frontend application - it runs in the browser and handles the user interface.",
    backend: "This is a backend service - it runs on a server and handles business logic, APIs, and data.",
    fullstack: "This is a fullstack application - it has both frontend (UI) and backend (server) code in one repo.",
    library: "This is a library/package - reusable code meant to be imported by other projects.",
    monorepo: "This is a monorepo - multiple related projects/packages organized together.",
    unknown: "The project structure is unclear - consider organizing code into standard folders."
  };
  parts.push(typeExplanations[profile.type] || typeExplanations.unknown);
  
  // Explain frameworks
  if (profile.frameworks.length > 0 && profile.frameworks[0] !== 'none') {
    const frameworkNames = profile.frameworks.join(', ');
    parts.push(`It uses ${frameworkNames} as the main framework(s).`);
  }
  
  // Explain architecture
  const archExplanations: Record<string, string> = {
    mvc: "Code is organized in MVC pattern (Models, Views, Controllers) - a classic separation of data, UI, and logic.",
    layered: "Code uses layered architecture - organized by technical layers (services, repositories, etc.).",
    clean: "Code follows Clean Architecture - domain logic is isolated from infrastructure concerns.",
    modular: "Code is organized by modules/features - each feature has its own folder with related code.",
    flat: "Code has a flat structure - most files are at the same level without deep organization.",
    unknown: "The architecture pattern is not clearly defined."
  };
  
  if (profile.architecture !== 'unknown') {
    parts.push(archExplanations[profile.architecture]);
  }
  
  // Explain current state
  const stateNotes: string[] = [];
  if (profile.hasTypeScript) stateNotes.push("uses TypeScript for type safety");
  if (profile.hasTests) stateNotes.push("has test coverage");
  if (!profile.hasTypeScript) stateNotes.push("uses plain JavaScript (no TypeScript)");
  if (!profile.hasTests) stateNotes.push("lacks automated tests");
  
  if (stateNotes.length > 0) {
    parts.push(`The project ${stateNotes.join(', ')}.`);
  }
  
  return parts.join(' ');
}

function generateSmartRecommendations(
  profile: import('./types.js').ProjectProfile,
  issues: Issue[]
): string[] {
  const recs: string[] = [];
  
  // TypeScript recommendation
  if (!profile.hasTypeScript && profile.type !== 'unknown') {
    recs.push(`🎯 Migrate to TypeScript for better type safety in ${profile.type} projects`);
  }
  
  // Testing recommendation
  if (!profile.hasTests) {
    recs.push(`🧪 Add testing framework (Jest/Vitest) to catch bugs early`);
  }
  
  // Architecture recommendations
  if (profile.architecture === 'flat' && profile.type === 'backend') {
    recs.push(`🏗️ Organize backend into layers: routes → controllers → services → repositories`);
  }
  
  if (profile.architecture === 'flat' && profile.type === 'frontend') {
    recs.push(`🏗️ Structure frontend by features: components, hooks, utils, services per feature`);
  }
  
  // Framework-specific
  if (profile.frameworks.includes('react') && !profile.hasTypeScript) {
    recs.push(`⚛️ React + TypeScript = better prop validation and IDE support`);
  }
  
  if (profile.frameworks.includes('express') && profile.architecture === 'unknown') {
    recs.push(`🚂 Structure Express with clear layers: routes → controllers → services → models`);
  }
  
  // Issue-based
  const ghostCount = issues.filter(i => i.type === 'ghost').length;
  if (ghostCount > 5) {
    recs.push(`👻 ${ghostCount} files lack tests. Start with critical business logic and API endpoints`);
  }
  
  const curseCount = issues.filter(i => i.type === 'curse').length;
  if (curseCount > 0) {
    recs.push(`🧿 Fix ${curseCount} structural issues for better maintainability`);
  }
  
  const zombieCount = issues.filter(i => i.type === 'zombie').length;
  if (zombieCount > 0) {
    recs.push(`🧟 Move ${zombieCount} zombie file(s) into src/ for clean structure`);
  }
  
  return recs;
}
