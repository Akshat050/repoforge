/**
 * Rule Executor
 * Orchestrates rule evaluation across repository files
 */

import * as fs from 'fs';
import * as path from 'path';
import { RuleRegistry } from './RuleRegistry.js';
import {
  Rule,
  RuleContext,
  RuleEngineConfig,
  RuleEngineResult,
  Violation,
  Severity
} from './types.js';
import { RepoMap, ProjectProfile } from '../types.js';
import { shouldExcludeFile } from './fileFilter.js';
import { processInParallel } from './parallelProcessor.js';

export class RuleExecutor {
  private readonly severityOrder: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SUGGESTION'];

  constructor(
    private registry: RuleRegistry,
    private config: RuleEngineConfig = {}
  ) {}

  /**
   * Execute all applicable rules against a repository
   */
  async execute(repo: RepoMap, profile: ProjectProfile): Promise<RuleEngineResult> {
    const startTime = Date.now();
    
    // Get all rules and filter out disabled ones
    const allRules = this.registry.getAll();
    const enabledRules = this.filterDisabledRules(allRules);
    
    // Warn about invalid disabled rule IDs
    this.warnInvalidDisabledRules(allRules);
    
    // Filter rules by framework
    const applicableRules = this.filterByFramework(enabledRules, profile);
    
    // Get files to scan
    const filesToScan = this.getFilesToScan(repo);
    
    // Execute rules
    const allViolations = await this.executeRulesOnFiles(
      applicableRules,
      filesToScan,
      repo.root,
      profile,
      repo.entries.map(e => e.path)
    );
    
    // Filter by severity threshold
    let filteredViolations = this.filterBySeverity(allViolations, this.config.minSeverity);
    
    // Filter by category if specified
    filteredViolations = this.filterByCategory(filteredViolations, this.config.categories);
    
    // Calculate summary
    const summary = this.calculateSummary(filteredViolations);
    
    const executionTime = Date.now() - startTime;
    
    return {
      violations: filteredViolations,
      summary,
      executionTime,
      filesScanned: filesToScan.length,
      rulesExecuted: applicableRules.length
    };
  }

  /**
   * Execute specific rules
   */
  async executeRules(
    ruleIds: string[],
    repo: RepoMap,
    profile: ProjectProfile
  ): Promise<RuleEngineResult> {
    const startTime = Date.now();
    
    // Get specified rules
    const rules = ruleIds
      .map(id => this.registry.get(id))
      .filter((rule): rule is Rule => rule !== undefined);
    
    // Filter out disabled rules
    const enabledRules = this.filterDisabledRules(rules);
    
    // Get files to scan
    const filesToScan = this.getFilesToScan(repo);
    
    // Execute rules
    const allViolations = await this.executeRulesOnFiles(
      enabledRules,
      filesToScan,
      repo.root,
      profile,
      repo.entries.map(e => e.path)
    );
    
    // Filter by severity threshold
    let filteredViolations = this.filterBySeverity(allViolations, this.config.minSeverity);
    
    // Filter by category if specified
    filteredViolations = this.filterByCategory(filteredViolations, this.config.categories);
    
    // Calculate summary
    const summary = this.calculateSummary(filteredViolations);
    
    const executionTime = Date.now() - startTime;
    
    return {
      violations: filteredViolations,
      summary,
      executionTime,
      filesScanned: filesToScan.length,
      rulesExecuted: enabledRules.length
    };
  }

  /**
   * Execute a single rule against a file
   */
  async executeRule(rule: Rule, context: RuleContext): Promise<Violation[]> {
    try {
      const violations = await Promise.resolve(rule.check(context));
      
      // Apply severity adjustment if defined
      if (rule.adjustSeverity) {
        return violations.map(v => {
          const adjustedSeverity = rule.adjustSeverity!(context, v.severity);
          return {
            ...v,
            severity: adjustedSeverity,
            immediateAttention: adjustedSeverity === 'CRITICAL'
          };
        });
      }
      
      // Set immediateAttention flag for CRITICAL violations
      return violations.map(v => ({
        ...v,
        immediateAttention: v.severity === 'CRITICAL'
      }));
    } catch (error) {
      // Log error but don't fail entire audit
      console.warn(`Rule ${rule.id} failed on ${context.filePath}:`, error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Filter violations by severity threshold
   */
  filterBySeverity(violations: Violation[], minSeverity?: Severity): Violation[] {
    if (!minSeverity) {
      return violations;
    }
    
    const minIndex = this.severityOrder.indexOf(minSeverity);
    if (minIndex === -1) {
      return violations;
    }
    
    return violations.filter(v => {
      const vIndex = this.severityOrder.indexOf(v.severity);
      return vIndex !== -1 && vIndex <= minIndex;
    });
  }

  /**
   * Filter violations by category
   */
  filterByCategory(violations: Violation[], categories?: string[]): Violation[] {
    if (!categories || categories.length === 0) {
      return violations;
    }
    
    const categorySet = new Set(categories);
    return violations.filter(v => categorySet.has(v.category));
  }

  /**
   * Check if execution should fail based on config
   */
  shouldFail(result: RuleEngineResult): boolean {
    if (!this.config.failOnSeverity) {
      return false;
    }
    
    const threshold = this.config.failOnSeverity;
    const thresholdIndex = this.severityOrder.indexOf(threshold);
    
    if (thresholdIndex === -1) {
      return false;
    }
    
    // Check if any violations meet or exceed the threshold
    return result.violations.some(v => {
      const vIndex = this.severityOrder.indexOf(v.severity);
      return vIndex !== -1 && vIndex <= thresholdIndex;
    });
  }

  /**
   * Filter out disabled rules
   */
  private filterDisabledRules(rules: Rule[]): Rule[] {
    if (!this.config.disabledRules || this.config.disabledRules.length === 0) {
      return rules;
    }
    
    const disabledSet = new Set(this.config.disabledRules);
    return rules.filter(rule => !disabledSet.has(rule.id));
  }

  /**
   * Warn about invalid disabled rule IDs
   */
  private warnInvalidDisabledRules(allRules: Rule[]): void {
    if (!this.config.disabledRules || this.config.disabledRules.length === 0) {
      return;
    }
    
    const validRuleIds = new Set(allRules.map(r => r.id));
    
    for (const disabledId of this.config.disabledRules) {
      if (!validRuleIds.has(disabledId)) {
        console.warn(`Warning: Disabled rule ID '${disabledId}' does not exist in registry`);
      }
    }
  }

  /**
   * Filter rules by framework applicability
   */
  private filterByFramework(rules: Rule[], profile: ProjectProfile): Rule[] {
    return rules.filter(rule => {
      // If rule has no framework restrictions, it applies to all
      if (!rule.frameworks || rule.frameworks.length === 0) {
        return true;
      }
      
      // Check if any of the project's frameworks match the rule's frameworks
      return profile.frameworks.some(pf => rule.frameworks!.includes(pf));
    });
  }

  /**
   * Get files to scan (excluding binary files and node_modules)
   */
  private getFilesToScan(repo: RepoMap): string[] {
    return repo.entries
      .filter(entry => {
        // Only process files
        if (entry.kind !== 'file') {
          return false;
        }
        
        // Use the file filter utility to check if file should be excluded
        // Don't check content in tests (file may not exist)
        return !shouldExcludeFile(entry.path);
      })
      .map(entry => entry.path)
      .slice(0, this.config.maxFiles);
  }

  /**
   * Execute rules on all files
   */
  private async executeRulesOnFiles(
    rules: Rule[],
    files: string[],
    repoRoot: string,
    profile: ProjectProfile,
    allFiles: string[]
  ): Promise<Violation[]> {
    const allViolations: Violation[] = [];
    
    if (this.config.parallel) {
      // Parallel execution with concurrency control
      const maxConcurrency = this.config.maxConcurrency || 10;
      
      const results = await processInParallel(
        files,
        async (filePath) => {
          return this.executeRulesOnFile(rules, filePath, repoRoot, profile, allFiles);
        },
        maxConcurrency
      );
      
      results.forEach(violations => allViolations.push(...violations));
    } else {
      // Sequential execution
      for (const filePath of files) {
        const violations = await this.executeRulesOnFile(rules, filePath, repoRoot, profile, allFiles);
        allViolations.push(...violations);
      }
    }
    
    return allViolations;
  }

  /**
   * Execute all rules on a single file
   */
  private async executeRulesOnFile(
    rules: Rule[],
    filePath: string,
    repoRoot: string,
    profile: ProjectProfile,
    allFiles: string[]
  ): Promise<Violation[]> {
    const fullPath = path.join(repoRoot, filePath);
    
    let fileContent: string;
    try {
      fileContent = fs.readFileSync(fullPath, 'utf-8');
    } catch (error) {
      // Skip files that can't be read
      return [];
    }
    
    const context: RuleContext = {
      filePath,
      fileContent,
      projectProfile: profile,
      allFiles
    };
    
    const violations: Violation[] = [];
    
    for (const rule of rules) {
      const ruleViolations = await this.executeRule(rule, context);
      violations.push(...ruleViolations);
    }
    
    return violations;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(violations: Violation[]) {
    const bySeverity: Record<Severity, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      SUGGESTION: 0
    };
    
    const byCategory: Record<string, number> = {};
    
    for (const violation of violations) {
      bySeverity[violation.severity]++;
      
      if (!byCategory[violation.category]) {
        byCategory[violation.category] = 0;
      }
      byCategory[violation.category]++;
    }
    
    return {
      total: violations.length,
      bySeverity,
      byCategory
    };
  }
}
