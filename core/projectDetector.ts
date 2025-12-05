/**
 * RepoForge Project Detector
 * Intelligently detects project type, framework, and architecture
 */

import type { RepoMap, FileEntry } from './types.js';

export type ProjectType = 'frontend' | 'backend' | 'fullstack' | 'library' | 'monorepo' | 'unknown';
export type Framework = 'react' | 'vue' | 'angular' | 'svelte' | 'next' | 'nuxt' | 'express' | 'fastify' | 'nest' | 'none';
export type Architecture = 'mvc' | 'layered' | 'clean' | 'modular' | 'flat' | 'unknown';

export interface ProjectProfile {
  type: ProjectType;
  frameworks: Framework[];
  architecture: Architecture;
  hasTests: boolean;
  hasTypeScript: boolean;
  hasBuildConfig: boolean;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown';
  confidence: number; // 0-100
}

function hasFile(entries: FileEntry[], pattern: string | RegExp): boolean {
  return entries.some(e => {
    if (typeof pattern === 'string') {
      return e.path === pattern || e.path.endsWith(`/${pattern}`);
    }
    return pattern.test(e.path);
  });
}

function countFiles(entries: FileEntry[], pattern: RegExp): number {
  return entries.filter(e => e.kind === 'file' && pattern.test(e.path)).length;
}

function detectFrameworks(entries: FileEntry[]): Framework[] {
  const frameworks: Framework[] = [];
  
  // Frontend frameworks
  if (hasFile(entries, /package\.json/)) {
    // Check for React
    if (hasFile(entries, /\.jsx$/) || hasFile(entries, /\.tsx$/)) {
      frameworks.push('react');
    }
    // Check for Next.js
    if (hasFile(entries, 'next.config.js') || hasFile(entries, 'next.config.ts')) {
      frameworks.push('next');
    }
    // Check for Vue
    if (hasFile(entries, /\.vue$/)) {
      frameworks.push('vue');
    }
    // Check for Nuxt
    if (hasFile(entries, 'nuxt.config.js') || hasFile(entries, 'nuxt.config.ts')) {
      frameworks.push('nuxt');
    }
    // Check for Angular
    if (hasFile(entries, 'angular.json')) {
      frameworks.push('angular');
    }
    // Check for Svelte
    if (hasFile(entries, /\.svelte$/)) {
      frameworks.push('svelte');
    }
  }
  
  // Backend frameworks
  if (hasFile(entries, /express/i) || hasFile(entries, /src\/routes/)) {
    frameworks.push('express');
  }
  if (hasFile(entries, /fastify/i)) {
    frameworks.push('fastify');
  }
  if (hasFile(entries, 'nest-cli.json')) {
    frameworks.push('nest');
  }
  
  return frameworks.length > 0 ? frameworks : ['none'];
}

function detectProjectType(entries: FileEntry[], frameworks: Framework[]): ProjectType {
  const hasFrontendIndicators = 
    hasFile(entries, /public\/index\.html/) ||
    hasFile(entries, /src\/components/) ||
    hasFile(entries, /\.jsx$/) ||
    hasFile(entries, /\.tsx$/) ||
    hasFile(entries, /\.vue$/) ||
    frameworks.some(f => ['react', 'vue', 'angular', 'svelte', 'next', 'nuxt'].includes(f));
  
  const hasBackendIndicators =
    hasFile(entries, /src\/routes/) ||
    hasFile(entries, /src\/controllers/) ||
    hasFile(entries, /src\/services/) ||
    hasFile(entries, /src\/models/) ||
    hasFile(entries, /api\//) ||
    frameworks.some(f => ['express', 'fastify', 'nest'].includes(f));
  
  const isMonorepo = 
    hasFile(entries, 'lerna.json') ||
    hasFile(entries, 'pnpm-workspace.yaml') ||
    hasFile(entries, /packages\//);
  
  const isLibrary =
    hasFile(entries, /^(src\/)?index\.(ts|js)$/) &&
    !hasFrontendIndicators &&
    !hasBackendIndicators;
  
  if (isMonorepo) return 'monorepo';
  if (hasFrontendIndicators && hasBackendIndicators) return 'fullstack';
  if (hasFrontendIndicators) return 'frontend';
  if (hasBackendIndicators) return 'backend';
  if (isLibrary) return 'library';
  
  return 'unknown';
}

function detectArchitecture(entries: FileEntry[], projectType: ProjectType): Architecture {
  const hasControllers = hasFile(entries, /src\/controllers/);
  const hasModels = hasFile(entries, /src\/models/);
  const hasViews = hasFile(entries, /src\/views/);
  const hasServices = hasFile(entries, /src\/services/);
  const hasRepositories = hasFile(entries, /src\/repositories/);
  const hasDomain = hasFile(entries, /src\/domain/);
  const hasInfrastructure = hasFile(entries, /src\/infrastructure/);
  const hasModules = hasFile(entries, /src\/modules/);
  const hasFeatures = hasFile(entries, /src\/features/);
  
  // Clean Architecture
  if (hasDomain && hasInfrastructure) {
    return 'clean';
  }
  
  // MVC Pattern
  if (hasControllers && hasModels && hasViews) {
    return 'mvc';
  }
  
  // Layered Architecture
  if (hasServices && hasRepositories) {
    return 'layered';
  }
  
  // Modular/Feature-based
  if (hasModules || hasFeatures) {
    return 'modular';
  }
  
  // Flat structure
  const srcFiles = countFiles(entries, /^src\/[^\/]+\.(ts|js)$/);
  if (srcFiles > 3) {
    return 'flat';
  }
  
  return 'unknown';
}

function detectPackageManager(entries: FileEntry[]): 'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown' {
  if (hasFile(entries, 'pnpm-lock.yaml')) return 'pnpm';
  if (hasFile(entries, 'yarn.lock')) return 'yarn';
  if (hasFile(entries, 'bun.lockb')) return 'bun';
  if (hasFile(entries, 'package-lock.json')) return 'npm';
  return 'unknown';
}

export function detectProject(repo: RepoMap): ProjectProfile {
  const entries = repo.entries;
  
  const frameworks = detectFrameworks(entries);
  const type = detectProjectType(entries, frameworks);
  const architecture = detectArchitecture(entries, type);
  
  const hasTests = 
    hasFile(entries, /\.test\.(ts|js|tsx|jsx)$/) ||
    hasFile(entries, /\.spec\.(ts|js|tsx|jsx)$/) ||
    hasFile(entries, /tests?\//);
  
  const hasTypeScript = hasFile(entries, /\.ts$/) || hasFile(entries, 'tsconfig.json');
  
  const hasBuildConfig = 
    hasFile(entries, 'webpack.config.js') ||
    hasFile(entries, 'vite.config.js') ||
    hasFile(entries, 'rollup.config.js') ||
    hasFile(entries, 'tsconfig.json');
  
  const packageManager = detectPackageManager(entries);
  
  // Calculate confidence based on indicators found
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
