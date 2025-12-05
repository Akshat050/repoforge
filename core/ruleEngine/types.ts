/**
 * Rule Engine Types
 * Type definitions for the RepoForge Rule Engine with severity levels
 */

import { ProjectProfile, Framework } from '../types';

// Severity levels in priority order
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SUGGESTION';

// Rule categories for organization
export type RuleCategory = 
  | 'Security' 
  | 'Testing' 
  | 'Architecture' 
  | 'Performance' 
  | 'Style' 
  | 'Maintainability';

// Context provided to rules during evaluation
export interface RuleContext {
  filePath: string;
  fileContent: string;
  ast?: any; // AST if available
  projectProfile: ProjectProfile;
  allFiles: string[];
}

// A violation found by a rule
export interface Violation {
  ruleId: string;
  ruleName: string;
  severity: Severity;
  category: RuleCategory;
  message: string;
  filePath: string;
  line?: number;
  column?: number;
  codeSnippet?: string;
  fixSuggestion: string;
  explanation: string;
  immediateAttention?: boolean; // Flag for CRITICAL violations
}

// Rule definition interface
export interface Rule {
  id: string;
  name: string;
  category: RuleCategory;
  severity: Severity;
  description: string;
  
  // The check function that evaluates the rule
  check: (context: RuleContext) => Violation[] | Promise<Violation[]>;
  
  // Optional: adjust severity based on context
  adjustSeverity?: (context: RuleContext, baseSeverity: Severity) => Severity;
  
  // Optional: framework applicability
  frameworks?: Framework[];
  
  // Optional: tags for filtering
  tags?: string[];
}

// Configuration for rule engine
export interface RuleEngineConfig {
  // Minimum severity to report (filters out lower severities)
  minSeverity?: Severity;
  
  // Rule IDs to disable
  disabledRules?: string[];
  
  // Custom rules to add
  customRules?: Rule[];
  
  // Fail CI/CD if violations at or above this severity
  failOnSeverity?: Severity;
  
  // Enable parallel execution
  parallel?: boolean;
  
  // Maximum files to process (for performance)
  maxFiles?: number;
  
  // Maximum concurrent file processing (for parallel execution)
  maxConcurrency?: number;
  
  // Filter violations by category
  categories?: RuleCategory[];
}

// Result from rule engine execution
export interface RuleEngineResult {
  violations: Violation[];
  summary: {
    total: number;
    bySeverity: Record<Severity, number>;
    byCategory: Record<RuleCategory, number>;
  };
  executionTime: number;
  filesScanned: number;
  rulesExecuted: number;
}
