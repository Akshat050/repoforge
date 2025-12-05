/**
 * RepoForge State Management
 * Maintains context across sessions - never lose project understanding
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ProjectProfile, Issue } from './types.js';

export interface RepoForgeState {
  version: string;
  lastScanAt: string;
  project: ProjectProfile;
  lastAudit: {
    issuesCount: number;
    deepRun: boolean;
    timestamp: string;
    summary: {
      ghosts: number;
      curses: number;
      zombies: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  } | null;
  recommendations: string[];
  history: {
    timestamp: string;
    command: string;
    issuesFound: number;
  }[];
}

const STATE_FILE = '.repoforge/state.json';
const STATE_VERSION = '1.0.0';

/**
 * Load state from .repoforge/state.json
 */
export function loadState(root: string): RepoForgeState | null {
  const statePath = path.join(root, STATE_FILE);
  
  try {
    if (!fs.existsSync(statePath)) {
      return null;
    }
    
    const content = fs.readFileSync(statePath, 'utf-8');
    const state = JSON.parse(content) as RepoForgeState;
    
    // Validate version
    if (state.version !== STATE_VERSION) {
      console.warn(`State file version mismatch. Expected ${STATE_VERSION}, got ${state.version}`);
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Failed to load state:', error);
    return null;
  }
}

/**
 * Save state to .repoforge/state.json
 */
export function saveState(root: string, state: RepoForgeState): void {
  const stateDir = path.join(root, '.repoforge');
  const statePath = path.join(root, STATE_FILE);
  
  try {
    // Create .repoforge directory if it doesn't exist
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }
    
    // Write state file
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

/**
 * Create initial state from project profile
 */
export function createState(
  profile: ProjectProfile,
  recommendations: string[]
): RepoForgeState {
  return {
    version: STATE_VERSION,
    lastScanAt: new Date().toISOString(),
    project: profile,
    lastAudit: null,
    recommendations,
    history: []
  };
}

/**
 * Update state with audit results
 */
export function updateStateWithAudit(
  state: RepoForgeState,
  issues: Issue[],
  deepRun: boolean,
  command: string
): RepoForgeState {
  const summary = {
    ghosts: issues.filter(i => i.type === 'ghost').length,
    curses: issues.filter(i => i.type === 'curse').length,
    zombies: issues.filter(i => i.type === 'zombie').length,
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
  };
  
  return {
    ...state,
    lastScanAt: new Date().toISOString(),
    lastAudit: {
      issuesCount: issues.length,
      deepRun,
      timestamp: new Date().toISOString(),
      summary
    },
    history: [
      ...state.history.slice(-9), // Keep last 10 entries
      {
        timestamp: new Date().toISOString(),
        command,
        issuesFound: issues.length
      }
    ]
  };
}

/**
 * Get context summary for display
 */
export function getContextSummary(state: RepoForgeState): string {
  const lines: string[] = [];
  
  lines.push('📋 Project Context (from previous scan):');
  lines.push(`   Type: ${state.project.type}`);
  lines.push(`   Frameworks: ${state.project.frameworks.join(', ')}`);
  lines.push(`   Language: ${state.project.hasTypeScript ? 'TypeScript' : 'JavaScript'}`);
  lines.push(`   Last scan: ${new Date(state.lastScanAt).toLocaleString()}`);
  
  if (state.lastAudit) {
    lines.push('');
    lines.push('📊 Last Audit:');
    lines.push(`   Issues: ${state.lastAudit.issuesCount} total`);
    lines.push(`   👻 Ghosts: ${state.lastAudit.summary.ghosts}`);
    lines.push(`   🧿 Curses: ${state.lastAudit.summary.curses}`);
    lines.push(`   🧟 Zombies: ${state.lastAudit.summary.zombies}`);
  }
  
  return lines.join('\n');
}

/**
 * Check if state is stale (older than 24 hours)
 */
export function isStateStale(state: RepoForgeState): boolean {
  const lastScan = new Date(state.lastScanAt);
  const now = new Date();
  const hoursSinceLastScan = (now.getTime() - lastScan.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceLastScan > 24;
}
