/**
 * RepoForge Types
 * Type definitions for the RepoForge devtool
 */

export type FileKind = 'file' | 'directory' | 'symlink';

export interface FileEntry {
  path: string;
  kind: FileKind;
  size?: number;
  children?: FileEntry[];
}

export interface RepoMap {
  root: string;
  entries: FileEntry[];
  totalFiles: number;
  totalDirectories: number;
}

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type SpookyType = 'ghost' | 'curse' | 'zombie';

export interface Issue {
  id: string;
  type: SpookyType;
  severity: IssueSeverity;
  message: string;
  filePath: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

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
  confidence: number;
}

export interface AuditResult {
  profile: ProjectProfile;
  explanation: string;
  issues: Issue[];
  recommendations: string[];
  summary: {
    totalIssues: number;
    ghosts: number;
    curses: number;
    zombies: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}
