/**
 * Property-Based Tests for RuleRegistry
 * Using fast-check for property-based testing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { RuleRegistry } from './RuleRegistry';
import { Rule, RuleCategory, Severity, RuleContext } from './types';

// Arbitraries for generating test data
const severityArb = fc.constantFrom<Severity>('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SUGGESTION');
const categoryArb = fc.constantFrom<RuleCategory>('Security', 'Testing', 'Architecture', 'Performance', 'Style', 'Maintainability');

// Generate non-empty, non-whitespace strings
const nonEmptyStringArb = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);

const validRuleArb = fc.record({
  id: nonEmptyStringArb,
  name: nonEmptyStringArb,
  category: categoryArb,
  severity: severityArb,
  description: fc.string(),
  check: fc.constant((context: RuleContext) => []),
});

describe('RuleRegistry Property Tests', () => {
  let registry: RuleRegistry;

  beforeEach(() => {
    registry = new RuleRegistry();
  });

  /**
   * **Feature: rule-engine, Property 6: Valid rule registration**
   * For any valid rule definition, after registration, the rule must be retrievable from the registry by its ID.
   * **Validates: Requirements 2.2**
   */
  it('Property 6: Valid rule registration', () => {
    fc.assert(
      fc.property(validRuleArb, (ruleData) => {
        const testRegistry = new RuleRegistry();
        const rule = ruleData as Rule;
        testRegistry.register(rule);
        const retrieved = testRegistry.get(rule.id);
        
        return retrieved !== undefined && retrieved.id === rule.id;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: rule-engine, Property 7: Duplicate rule prevention**
   * For any two rules with the same ID, attempting to register the second rule must fail with an error indicating the ID already exists.
   * **Validates: Requirements 2.4**
   */
  it('Property 7: Duplicate rule prevention', () => {
    fc.assert(
      fc.property(validRuleArb, validRuleArb, (rule1Data, rule2Data) => {
        const testRegistry = new RuleRegistry();
        const rule1 = rule1Data as Rule;
        const rule2 = { ...rule2Data, id: rule1.id } as Rule; // Force same ID
        
        testRegistry.register(rule1);
        
        try {
          testRegistry.register(rule2);
          return false; // Should have thrown an error
        } catch (error) {
          return error instanceof Error && error.message.includes('already exists');
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: rule-engine, Property 5: Rule definition validation**
   * For any rule definition, if it is missing any required field (id, name, category, severity, or check function),
   * then validation must reject it with a clear error message indicating which field is missing.
   * **Validates: Requirements 2.1, 2.3**
   */
  it('Property 5: Rule definition validation', () => {
    const testRegistry = new RuleRegistry();
    
    // Test missing id
    fc.assert(
      fc.property(validRuleArb, (ruleData) => {
        const invalidRule = { ...ruleData, id: '' } as any;
        
        try {
          testRegistry.register(invalidRule);
          return false; // Should have thrown
        } catch (error) {
          return error instanceof Error && error.message.includes('non-empty id');
        }
      }),
      { numRuns: 100 }
    );

    // Test missing name
    fc.assert(
      fc.property(validRuleArb, (ruleData) => {
        const invalidRule = { ...ruleData, name: '' } as any;
        
        try {
          testRegistry.register(invalidRule);
          return false; // Should have thrown
        } catch (error) {
          return error instanceof Error && error.message.includes('non-empty name');
        }
      }),
      { numRuns: 100 }
    );

    // Test missing category
    fc.assert(
      fc.property(validRuleArb, (ruleData) => {
        const invalidRule = { ...ruleData, category: undefined } as any;
        
        try {
          testRegistry.register(invalidRule);
          return false; // Should have thrown
        } catch (error) {
          return error instanceof Error && error.message.includes('category');
        }
      }),
      { numRuns: 100 }
    );

    // Test missing severity
    fc.assert(
      fc.property(validRuleArb, (ruleData) => {
        const invalidRule = { ...ruleData, severity: undefined } as any;
        
        try {
          testRegistry.register(invalidRule);
          return false; // Should have thrown
        } catch (error) {
          return error instanceof Error && error.message.includes('severity');
        }
      }),
      { numRuns: 100 }
    );

    // Test missing check function
    fc.assert(
      fc.property(validRuleArb, (ruleData) => {
        const invalidRule = { ...ruleData, check: undefined } as any;
        
        try {
          testRegistry.register(invalidRule);
          return false; // Should have thrown
        } catch (error) {
          return error instanceof Error && error.message.includes('check function');
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: rule-engine, Property 8: Rule merging**
   * For any set of built-in rules and custom rules, after merging, the registry must contain all rules from both sets with no duplicates.
   * **Validates: Requirements 2.5**
   */
  it('Property 8: Rule merging', () => {
    fc.assert(
      fc.property(
        fc.array(validRuleArb, { minLength: 1, maxLength: 10 }),
        fc.array(validRuleArb, { minLength: 1, maxLength: 10 }),
        (builtInRulesData, customRulesData) => {
          const testRegistry = new RuleRegistry();
          
          // Ensure unique IDs within each set
          const builtInRules = builtInRulesData.map((r, i) => ({ ...r, id: `builtin_${i}` } as Rule));
          const customRules = customRulesData.map((r, i) => ({ ...r, id: `custom_${i}` } as Rule));
          
          // Register built-in rules
          testRegistry.registerMany(builtInRules);
          
          // Register custom rules
          testRegistry.registerMany(customRules);
          
          // Verify all rules are present
          const allRules = testRegistry.getAll();
          const expectedCount = builtInRules.length + customRules.length;
          
          if (allRules.length !== expectedCount) {
            return false;
          }
          
          // Verify no duplicates by checking unique IDs
          const uniqueIds = new Set(allRules.map(r => r.id));
          if (uniqueIds.size !== expectedCount) {
            return false;
          }
          
          // Verify all built-in rules are present
          for (const rule of builtInRules) {
            if (!testRegistry.has(rule.id)) {
              return false;
            }
          }
          
          // Verify all custom rules are present
          for (const rule of customRules) {
            if (!testRegistry.has(rule.id)) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: rule-engine, Property 20: Disabled rule indication**
   * For any rule in the disabled rules list, when listing all rules, that rule must be marked as disabled.
   * **Validates: Requirements 8.3**
   */
  it('Property 20: Disabled rule indication', () => {
    fc.assert(
      fc.property(
        fc.array(validRuleArb, { minLength: 2, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (rulesData, disabledIndex) => {
          const testRegistry = new RuleRegistry();
          
          // Ensure unique IDs
          const rules = rulesData.map((r, i) => ({ ...r, id: `rule_${i}` } as Rule));
          
          // Register all rules
          testRegistry.registerMany(rules);
          
          // Select one rule to disable
          const disabledRuleId = `rule_${disabledIndex % rules.length}`;
          const disabledRuleIds = [disabledRuleId];
          
          // Get all rules with status
          const rulesWithStatus = testRegistry.getAllWithStatus(disabledRuleIds);
          
          // Verify all rules are present
          if (rulesWithStatus.length !== rules.length) {
            console.error('FAIL: Expected', rules.length, 'rules, got', rulesWithStatus.length);
            return false;
          }
          
          // Verify the disabled rule is marked as disabled
          const disabledRule = rulesWithStatus.find(r => r.id === disabledRuleId);
          if (!disabledRule) {
            console.error('FAIL: Disabled rule not found in results');
            return false;
          }
          if (!disabledRule.disabled) {
            console.error('FAIL: Disabled rule not marked as disabled');
            return false;
          }
          
          // Verify all other rules are marked as enabled
          for (const rule of rulesWithStatus) {
            if (rule.id !== disabledRuleId && rule.disabled) {
              console.error('FAIL: Non-disabled rule marked as disabled:', rule.id);
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
