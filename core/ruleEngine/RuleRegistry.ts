/**
 * Rule Registry
 * Central repository for managing rule definitions
 */

import { Rule, RuleCategory } from './types';
import { Framework } from '../types';

export interface RuleValidationResult {
  valid: boolean;
  errors: string[];
}

export class RuleRegistry {
  private rules: Map<string, Rule> = new Map();

  /**
   * Register a new rule
   * @throws Error if rule is invalid or duplicate ID exists
   */
  register(rule: Rule): void {
    const validation = this.validate(rule);
    if (!validation.valid) {
      throw new Error(`Invalid rule definition: ${validation.errors.join(', ')}`);
    }

    if (this.rules.has(rule.id)) {
      throw new Error(`Rule with ID '${rule.id}' already exists`);
    }

    this.rules.set(rule.id, rule);
  }

  /**
   * Register multiple rules at once
   */
  registerMany(rules: Rule[]): void {
    for (const rule of rules) {
      this.register(rule);
    }
  }

  /**
   * Get a rule by ID
   */
  get(ruleId: string): Rule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Get all registered rules
   */
  getAll(): Rule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules by category
   */
  getByCategory(category: RuleCategory): Rule[] {
    return this.getAll().filter(rule => rule.category === category);
  }

  /**
   * Get rules applicable to a framework
   */
  getByFramework(framework: Framework): Rule[] {
    return this.getAll().filter(rule => {
      // If no frameworks specified, rule applies to all
      if (!rule.frameworks || rule.frameworks.length === 0) {
        return true;
      }
      // Otherwise, check if framework is in the list
      return rule.frameworks.includes(framework);
    });
  }

  /**
   * Check if a rule exists
   */
  has(ruleId: string): boolean {
    return this.rules.has(ruleId);
  }

  /**
   * Unregister a rule
   */
  unregister(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Validate rule definition
   */
  validate(rule: Rule): RuleValidationResult {
    const errors: string[] = [];

    // Check required fields
    if (!rule.id || typeof rule.id !== 'string' || rule.id.trim() === '') {
      errors.push('Rule must have a non-empty id');
    }

    if (!rule.name || typeof rule.name !== 'string' || rule.name.trim() === '') {
      errors.push('Rule must have a non-empty name');
    }

    if (!rule.category) {
      errors.push('Rule must have a category');
    } else {
      const validCategories: RuleCategory[] = [
        'Security',
        'Testing',
        'Architecture',
        'Performance',
        'Style',
        'Maintainability'
      ];
      if (!validCategories.includes(rule.category)) {
        errors.push(`Invalid category '${rule.category}'. Must be one of: ${validCategories.join(', ')}`);
      }
    }

    if (!rule.severity) {
      errors.push('Rule must have a severity');
    } else {
      const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SUGGESTION'];
      if (!validSeverities.includes(rule.severity)) {
        errors.push(`Invalid severity '${rule.severity}'. Must be one of: ${validSeverities.join(', ')}`);
      }
    }

    if (!rule.check || typeof rule.check !== 'function') {
      errors.push('Rule must have a check function');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get all rules with their disabled status
   */
  getAllWithStatus(disabledRuleIds: string[] = []): Array<Rule & { disabled: boolean }> {
    const disabledSet = new Set(disabledRuleIds);
    return this.getAll().map(rule => ({
      ...rule,
      disabled: disabledSet.has(rule.id)
    }));
  }
}
