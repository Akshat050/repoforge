/**
 * RepoForge Flow Analyzer
 * Analyzes code flow, entry points, and architecture patterns
 */

import * as fs from 'fs';
import * as path from 'path';
import type { RepoMap, ProjectProfile } from './types.js';

export interface FlowAnalysis {
  entryPoints: EntryPoint[];
  dataFlow: DataFlow;
  apiEndpoints: APIEndpoint[];
  dependencies: DependencyGraph;
  architecture: ArchitectureInsight;
}

export interface EntryPoint {
  file: string;
  type: 'server' | 'client' | 'cli' | 'test' | 'unknown';
  description: string;
}

export interface DataFlow {
  hasDatabase: boolean;
  hasAPI: boolean;
  hasStateManagement: boolean;
  patterns: string[];
}

export interface APIEndpoint {
  path: string;
  file: string;
  method?: string;
}

export interface DependencyGraph {
  external: string[];
  internal: { from: string; to: string }[];
}

export interface ArchitectureInsight {
  pattern: string;
  layers: string[];
  explanation: string;
  suggestions: string[];
}

export function analyzeFlow(repo: RepoMap, profile: ProjectProfile): FlowAnalysis {
  const entryPoints = findEntryPoints(repo, profile);
  const dataFlow = analyzeDataFlow(repo);
  const apiEndpoints = findAPIEndpoints(repo);
  const dependencies = analyzeDependencies(repo);
  const architecture = analyzeArchitecture(repo, profile);
  
  return {
    entryPoints,
    dataFlow,
    apiEndpoints,
    dependencies,
    architecture
  };
}

function findEntryPoints(repo: RepoMap, profile: ProjectProfile): EntryPoint[] {
  const entryPoints: EntryPoint[] = [];
  
  // Check for common entry points
  const commonEntries = [
    { pattern: /^(src\/)?index\.(ts|js|tsx|jsx)$/, type: 'server' as const, desc: 'Main application entry point' },
    { pattern: /^(src\/)?main\.(ts|js|tsx|jsx)$/, type: 'server' as const, desc: 'Main entry point' },
    { pattern: /^(src\/)?app\.(ts|js|tsx|jsx)$/, type: 'server' as const, desc: 'Application bootstrap' },
    { pattern: /^(src\/)?server\.(ts|js)$/, type: 'server' as const, desc: 'Server entry point' },
    { pattern: /cli\/index\.(ts|js)$/, type: 'cli' as const, desc: 'Command-line interface' },
  ];
  
  for (const entry of repo.entries) {
    if (entry.kind !== 'file') continue;
    
    for (const { pattern, type, desc } of commonEntries) {
      if (pattern.test(entry.path)) {
        entryPoints.push({ file: entry.path, type, description: desc });
      }
    }
    
    // Check for Next.js pages
    if (entry.path.match(/\/(pages|app)\/.*\.(tsx|jsx)$/)) {
      entryPoints.push({
        file: entry.path,
        type: 'client',
        description: `Next.js page: ${entry.path.split('/').pop()?.replace(/\.(tsx|jsx)$/, '')}`
      });
    }
  }
  
  return entryPoints;
}

function analyzeDataFlow(repo: RepoMap): DataFlow {
  let hasDatabase = false;
  let hasAPI = false;
  let hasStateManagement = false;
  const patterns: string[] = [];
  
  for (const entry of repo.entries) {
    if (entry.kind !== 'file') continue;
    
    const lowerPath = entry.path.toLowerCase();
    
    // Check for database
    if (lowerPath.includes('prisma') || lowerPath.includes('database') || 
        lowerPath.includes('db') || lowerPath.includes('models')) {
      hasDatabase = true;
    }
    
    // Check for API
    if (lowerPath.includes('api') || lowerPath.includes('routes') || 
        lowerPath.includes('controllers')) {
      hasAPI = true;
    }
    
    // Check for state management
    if (lowerPath.includes('redux') || lowerPath.includes('store') || 
        lowerPath.includes('context')) {
      hasStateManagement = true;
    }
  }
  
  // Determine patterns
  if (hasDatabase && hasAPI) patterns.push('Full-stack with database');
  if (hasAPI) patterns.push('RESTful API');
  if (hasStateManagement) patterns.push('Client-side state management');
  
  return { hasDatabase, hasAPI, hasStateManagement, patterns };
}

function findAPIEndpoints(repo: RepoMap): APIEndpoint[] {
  const endpoints: APIEndpoint[] = [];
  
  for (const entry of repo.entries) {
    if (entry.kind !== 'file') continue;
    
    // Check for API routes
    if (entry.path.includes('/api/') || entry.path.includes('/routes/')) {
      const fullPath = path.join(repo.root, entry.path);
      
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        // Extract route patterns
        const routeMatches = content.match(/['"`]\/[^'"`]*['"`]/g);
        if (routeMatches) {
          for (const match of routeMatches.slice(0, 3)) { // Limit to 3 per file
            endpoints.push({
              path: match.replace(/['"`]/g, ''),
              file: entry.path
            });
          }
        }
      } catch {
        // Can't read file, skip
      }
    }
  }
  
  return endpoints.slice(0, 10); // Limit total endpoints
}

function analyzeDependencies(repo: RepoMap): DependencyGraph {
  const external: string[] = [];
  
  // Read package.json for external deps
  const packageJsonPath = path.join(repo.root, 'package.json');
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);
    
    if (pkg.dependencies) {
      external.push(...Object.keys(pkg.dependencies).slice(0, 10));
    }
  } catch {
    // No package.json or can't read
  }
  
  return {
    external,
    internal: [] // Could be expanded to analyze imports
  };
}

function analyzeArchitecture(repo: RepoMap, profile: ProjectProfile): ArchitectureInsight {
  const layers: string[] = [];
  const suggestions: string[] = [];
  
  // Detect layers
  const hasControllers = repo.entries.some(e => e.path.includes('/controllers/'));
  const hasServices = repo.entries.some(e => e.path.includes('/services/'));
  const hasModels = repo.entries.some(e => e.path.includes('/models/'));
  const hasViews = repo.entries.some(e => e.path.includes('/views/'));
  const hasComponents = repo.entries.some(e => e.path.includes('/components/'));
  const hasRoutes = repo.entries.some(e => e.path.includes('/routes/'));
  
  if (hasRoutes) layers.push('Routes (API endpoints)');
  if (hasControllers) layers.push('Controllers (request handlers)');
  if (hasServices) layers.push('Services (business logic)');
  if (hasModels) layers.push('Models (data layer)');
  if (hasComponents) layers.push('Components (UI layer)');
  if (hasViews) layers.push('Views (presentation)');
  
  let pattern = profile.architecture;
  let explanation = '';
  
  if (profile.architecture === 'layered') {
    explanation = 'Your code follows a layered architecture where each layer has a specific responsibility. ' +
                  'Requests flow: Routes → Controllers → Services → Models → Database.';
    
    if (!hasServices) {
      suggestions.push('Consider adding a Services layer to separate business logic from controllers');
    }
  } else if (profile.architecture === 'mvc') {
    explanation = 'Classic MVC pattern: Models handle data, Views handle presentation, Controllers coordinate between them.';
  } else if (profile.architecture === 'modular') {
    explanation = 'Feature-based organization where each feature/module contains its own routes, components, and logic.';
    suggestions.push('Keep features independent to maintain modularity');
  } else if (profile.architecture === 'flat') {
    explanation = 'Simple flat structure - all files at similar levels.';
    suggestions.push('As the project grows, consider organizing into layers or modules');
  } else {
    explanation = 'Architecture pattern is not clearly defined.';
    suggestions.push('Consider adopting a clear architecture pattern (layered, MVC, or modular)');
  }
  
  return {
    pattern,
    layers,
    explanation,
    suggestions
  };
}
