/**
 * RepoForge Smart Auditor
 * Context-aware auditing based on project type and best practices
 * Now powered by the Rule Engine for extensible, configurable auditing
 */

import type { RepoMap, Issue } from './types.js';
import { detectProject, type ProjectProfile } from './projectDetector.js';
import { auditRepo } from './auditor.js';
import { RuleRegistry } from './ruleEngine/RuleRegistry.js';
import { RuleExecutor } from './ruleEngine/RuleExecutor.js';
import { AUDIT_RULES } from './ruleEngine/auditRules.js';
import { securityRules } from './ruleEngine/securityRules.js';
import { reactRules } from './ruleEngine/reactRules.js';
import { nodeRules } from './ruleEngine/nodeRules.js';
import type { RuleEngineConfig, Violation } from './ruleEngine/types.js';

export interface SmartAuditResult {
  profile: ProjectProfile;
  issues: Issue[];
  recommendations: string[];
  bestPractices: BestPractice[];
}

export interface BestPractice {
  category: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  applies: boolean;
}

function generateRecommendations(profile: ProjectProfile, issues: Issue[]): string[] {
  const recommendations: string[] = [];
  
  // TypeScript recommendations
  if (!profile.hasTypeScript && profile.type !== 'unknown') {
    recommendations.push(
      `Consider migrating to TypeScript for better type safety and developer experience in ${profile.type} projects.`
    );
  }
  
  // Testing recommendations
  if (!profile.hasTests) {
    recommendations.push(
      `Add a testing framework (Jest, Vitest, or Mocha) to improve code quality and catch bugs early.`
    );
  }
  
  // Architecture recommendations
  if (profile.architecture === 'flat' && profile.type === 'backend') {
    recommendations.push(
      `Consider organizing your backend into layers (controllers, services, repositories) for better maintainability.`
    );
  }
  
  if (profile.architecture === 'flat' && profile.type === 'frontend') {
    recommendations.push(
      `Organize your frontend code into features or modules (components, hooks, utils, services) for scalability.`
    );
  }
  
  // Framework-specific recommendations
  if (profile.frameworks.includes('react') && !profile.hasTypeScript) {
    recommendations.push(
      `React projects benefit greatly from TypeScript for prop validation and better IDE support.`
    );
  }
  
  if (profile.frameworks.includes('express') && profile.architecture === 'unknown') {
    recommendations.push(
      `Structure your Express app with clear separation: routes → controllers → services → models.`
    );
  }
  
  // Issue-based recommendations
  const ghostCount = issues.filter(i => i.type === 'ghost').length;
  if (ghostCount > 5) {
    recommendations.push(
      `You have ${ghostCount} files without tests. Start by adding tests for critical business logic and API endpoints.`
    );
  }
  
  const zombieCount = issues.filter(i => i.type === 'zombie').length;
  if (zombieCount > 0) {
    recommendations.push(
      `Move ${zombieCount} code file(s) into src/ to maintain a clean project structure.`
    );
  }
  
  return recommendations;
}

function generateBestPractices(profile: ProjectProfile): BestPractice[] {
  const practices: BestPractice[] = [];
  
  // Universal best practices
  practices.push({
    category: 'Structure',
    title: 'Consistent folder organization',
    description: 'Keep all source code in src/, tests in tests/ or co-located with source files',
    priority: 'high',
    applies: true
  });
  
  practices.push({
    category: 'Testing',
    title: 'Test coverage for critical paths',
    description: 'Maintain tests for business logic, API endpoints, and complex components',
    priority: 'high',
    applies: true
  });
  
  // Frontend-specific
  if (profile.type === 'frontend' || profile.type === 'fullstack') {
    practices.push({
      category: 'Frontend',
      title: 'Component organization',
      description: 'Group components by feature or domain, not by type (Button, Form, etc.)',
      priority: 'medium',
      applies: true
    });
    
    practices.push({
      category: 'Frontend',
      title: 'Separate business logic from UI',
      description: 'Use custom hooks (React) or composables (Vue) to extract reusable logic',
      priority: 'medium',
      applies: profile.frameworks.includes('react') || profile.frameworks.includes('vue')
    });
  }
  
  // Backend-specific
  if (profile.type === 'backend' || profile.type === 'fullstack') {
    practices.push({
      category: 'Backend',
      title: 'Layered architecture',
      description: 'Separate concerns: routes → controllers → services → data access',
      priority: 'high',
      applies: true
    });
    
    practices.push({
      category: 'Backend',
      title: 'Input validation',
      description: 'Validate all API inputs using schemas (Zod, Joi, class-validator)',
      priority: 'high',
      applies: true
    });
    
    practices.push({
      category: 'Backend',
      title: 'Error handling middleware',
      description: 'Centralize error handling with proper HTTP status codes and logging',
      priority: 'high',
      applies: true
    });
  }
  
  // TypeScript-specific
  if (profile.hasTypeScript) {
    practices.push({
      category: 'TypeScript',
      title: 'Strict mode enabled',
      description: 'Use strict: true in tsconfig.json for maximum type safety',
      priority: 'high',
      applies: true
    });
    
    practices.push({
      category: 'TypeScript',
      title: 'Avoid any types',
      description: 'Use unknown or proper types instead of any to maintain type safety',
      priority: 'medium',
      applies: true
    });
  }
  
  // Monorepo-specific
  if (profile.type === 'monorepo') {
    practices.push({
      category: 'Monorepo',
      title: 'Shared configuration',
      description: 'Use workspace-level configs for TypeScript, ESLint, and Prettier',
      priority: 'medium',
      applies: true
    });
  }
  
  return practices.filter(p => p.applies);
}

/**
 * Convert Violation to Issue for backward compatibility
 */
function violationToIssue(violation: Violation): Issue {
  // Map rule categories to issue types
  let type: 'ghost' | 'curse' | 'zombie' = 'curse';
  
  if (violation.ruleId.startsWith('GHOST_')) {
    type = 'ghost';
  } else if (violation.ruleId.startsWith('ZOMBIE_')) {
    type = 'zombie';
  } else if (violation.ruleId.startsWith('CURSE_')) {
    type = 'curse';
  }
  
  // Map severity
  const severityMap: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
    'CRITICAL': 'critical',
    'HIGH': 'high',
    'MEDIUM': 'medium',
    'LOW': 'low',
    'SUGGESTION': 'low'
  };
  
  return {
    id: violation.ruleId,
    type,
    severity: severityMap[violation.severity] || 'medium',
    filePath: violation.filePath,
    line: violation.line,
    column: violation.column,
    message: violation.message,
    suggestion: violation.fixSuggestion
  };
}

/**
 * Smart audit using Rule Engine
 * This is the new implementation that uses the extensible rule system
 */
export async function smartAudit(repo: RepoMap, config?: Partial<RuleEngineConfig>): Promise<SmartAuditResult> {
  const profile = detectProject(repo);
  
  // Initialize Rule Engine
  const registry = new RuleRegistry();
  
  // Register all built-in rules
  registry.registerMany(AUDIT_RULES);
  registry.registerMany(securityRules);
  registry.registerMany(reactRules);
  registry.registerMany(nodeRules);
  
  // Register custom rules if provided
  if (config?.customRules) {
    registry.registerMany(config.customRules);
  }
  
  // Execute rules
  const executor = new RuleExecutor(registry, config);
  const result = await executor.execute(repo, profile);
  
  // Convert violations to issues for backward compatibility
  const issues = result.violations.map(violationToIssue);
  
  const recommendations = generateRecommendations(profile, issues);
  const bestPractices = generateBestPractices(profile);
  
  return {
    profile,
    issues,
    recommendations,
    bestPractices
  };
}

/**
 * Legacy smartAudit - synchronous version for backward compatibility
 * Uses the old auditor implementation
 */
export function smartAuditLegacy(repo: RepoMap): SmartAuditResult {
  const profile = detectProject(repo);
  const issues = auditRepo(repo);
  const recommendations = generateRecommendations(profile, issues);
  const bestPractices = generateBestPractices(profile);
  
  return {
    profile,
    issues,
    recommendations,
    bestPractices
  };
}
