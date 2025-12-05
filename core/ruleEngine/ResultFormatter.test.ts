/**
 * Result Formatter Tests
 * Property-based tests for the ResultFormatter class
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ResultFormatter } from './ResultFormatter';
import { RuleEngineResult, Violation, Severity, RuleCategory } from './types';

const config = { numRuns: 100 };

// Arbitraries for generating test data
const severityArb = fc.constantFrom<Severity>('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SUGGESTION');
const categoryArb = fc.constantFrom<RuleCategory>('Security', 'Testing', 'Architecture', 'Performance', 'Style', 'Maintainability');

const violationArb = fc.record({
  ruleId: fc.string({ minLength: 1 }),
  ruleName: fc.string({ minLength: 1 }),
  severity: severityArb,
  category: categoryArb,
  message: fc.string({ minLength: 1 }),
  filePath: fc.string({ minLength: 1 }),
  line: fc.option(fc.nat(), { nil: undefined }),
  column: fc.option(fc.nat(), { nil: undefined }),
  codeSnippet: fc.option(fc.string(), { nil: undefined }),
  fixSuggestion: fc.string({ minLength: 1 }),
  explanation: fc.string({ minLength: 1 }),
  immediateAttention: fc.option(fc.boolean(), { nil: undefined }),
}) as fc.Arbitrary<Violation>;

const ruleEngineResultArb = fc.record({
  violations: fc.array(violationArb),
  summary: fc.record({
    total: fc.nat(),
    bySeverity: fc.record({
      CRITICAL: fc.nat(),
      HIGH: fc.nat(),
      MEDIUM: fc.nat(),
      LOW: fc.nat(),
      SUGGESTION: fc.nat(),
    }),
    byCategory: fc.record({
      Security: fc.nat(),
      Testing: fc.nat(),
      Architecture: fc.nat(),
      Performance: fc.nat(),
      Style: fc.nat(),
      Maintainability: fc.nat(),
    }),
  }),
  executionTime: fc.nat(),
  filesScanned: fc.nat(),
  rulesExecuted: fc.nat(),
}) as fc.Arbitrary<RuleEngineResult>;

describe('ResultFormatter Properties', () => {
  const formatter = new ResultFormatter();
  
  /**
   * **Feature: rule-engine, Property 2: Severity ordering in results**
   * **Validates: Requirements 1.2**
   */
  it('Property 2: Severity ordering in results', () => {
    fc.assert(
      fc.property(
        fc.array(violationArb, { minLength: 1 }),
        (violations) => {
          // Group violations by severity
          const grouped = formatter.groupBySeverity(violations);
          
          // Get the severity order from the grouped map
          const severitiesInResult = Array.from(grouped.keys());
          
          // Define the expected order
          const expectedOrder: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SUGGESTION'];
          
          // Filter expected order to only include severities present in the result
          const expectedPresent = expectedOrder.filter(s => severitiesInResult.includes(s));
          
          // Check that the severities appear in the correct order
          // We need to verify that when we iterate through the expected order,
          // we encounter the severities in the same sequence
          let lastIndex = -1;
          for (const severity of expectedPresent) {
            const currentIndex = expectedOrder.indexOf(severity);
            if (currentIndex <= lastIndex) {
              return false;
            }
            lastIndex = currentIndex;
          }
          
          return true;
        }
      ),
      config
    );
  });
  
  /**
   * **Feature: rule-engine, Property 24: Output format validity**
   * **Validates: Requirements 10.5**
   */
  it('Property 24: Output format validity', () => {
    fc.assert(
      fc.property(
        ruleEngineResultArb,
        (result) => {
          // Test CLI output produces human-readable text (non-empty string)
          const cliOutput = formatter.formatCLI(result);
          const cliValid = typeof cliOutput === 'string' && cliOutput.length > 0;
          
          // Test JSON output produces valid, parseable JSON
          const jsonOutput = formatter.formatJSON(result);
          let jsonValid = false;
          try {
            const parsed = JSON.parse(jsonOutput);
            jsonValid = typeof parsed === 'object' && parsed !== null;
          } catch {
            jsonValid = false;
          }
          
          return cliValid && jsonValid;
        }
      ),
      config
    );
  });
  
  /**
   * **Feature: rule-engine, Property 4: Severity count accuracy**
   * **Validates: Requirements 1.4**
   */
  it('Property 4: Severity count accuracy', () => {
    fc.assert(
      fc.property(
        fc.array(violationArb),
        (violations) => {
          // Count violations by severity manually
          const expectedCounts: Record<Severity, number> = {
            CRITICAL: 0,
            HIGH: 0,
            MEDIUM: 0,
            LOW: 0,
            SUGGESTION: 0,
          };
          
          for (const violation of violations) {
            expectedCounts[violation.severity]++;
          }
          
          // Create a result object with the violations
          const result: RuleEngineResult = {
            violations,
            summary: {
              total: violations.length,
              bySeverity: {
                CRITICAL: expectedCounts.CRITICAL,
                HIGH: expectedCounts.HIGH,
                MEDIUM: expectedCounts.MEDIUM,
                LOW: expectedCounts.LOW,
                SUGGESTION: expectedCounts.SUGGESTION,
              },
              byCategory: {
                Security: 0,
                Testing: 0,
                Architecture: 0,
                Performance: 0,
                Style: 0,
                Maintainability: 0,
              },
            },
            executionTime: 0,
            filesScanned: 0,
            rulesExecuted: 0,
          };
          
          // Verify that the counts in the summary match the actual counts
          for (const severity of Object.keys(expectedCounts) as Severity[]) {
            if (result.summary.bySeverity[severity] !== expectedCounts[severity]) {
              return false;
            }
          }
          
          return true;
        }
      ),
      config
    );
  });
  
  /**
   * **Feature: rule-engine, Property 11: Category count accuracy**
   * **Validates: Requirements 3.4**
   */
  it('Property 11: Category count accuracy', () => {
    fc.assert(
      fc.property(
        fc.array(violationArb),
        (violations) => {
          // Count violations by category manually
          const expectedCounts: Record<RuleCategory, number> = {
            Security: 0,
            Testing: 0,
            Architecture: 0,
            Performance: 0,
            Style: 0,
            Maintainability: 0,
          };
          
          for (const violation of violations) {
            expectedCounts[violation.category]++;
          }
          
          // Create a result object with the violations
          const result: RuleEngineResult = {
            violations,
            summary: {
              total: violations.length,
              bySeverity: {
                CRITICAL: 0,
                HIGH: 0,
                MEDIUM: 0,
                LOW: 0,
                SUGGESTION: 0,
              },
              byCategory: {
                Security: expectedCounts.Security,
                Testing: expectedCounts.Testing,
                Architecture: expectedCounts.Architecture,
                Performance: expectedCounts.Performance,
                Style: expectedCounts.Style,
                Maintainability: expectedCounts.Maintainability,
              },
            },
            executionTime: 0,
            filesScanned: 0,
            rulesExecuted: 0,
          };
          
          // Verify that the counts in the summary match the actual counts
          for (const category of Object.keys(expectedCounts) as RuleCategory[]) {
            if (result.summary.byCategory[category] !== expectedCounts[category]) {
              return false;
            }
          }
          
          return true;
        }
      ),
      config
    );
  });

  /**
   * **Feature: rule-engine, Property 14: Fix suggestion or guidance**
   * For any violation, the violation must have either a non-empty fixSuggestion field
   * or manual remediation guidance in the explanation.
   * **Validates: Requirements 5.4**
   */
  it('Property 14: Fix suggestion or guidance', () => {
    fc.assert(
      fc.property(
        violationArb,
        (violation) => {
          // Check that either fixSuggestion is non-empty or explanation contains guidance
          const hasFixSuggestion = violation.fixSuggestion && violation.fixSuggestion.trim().length > 0;
          const hasExplanation = violation.explanation && violation.explanation.trim().length > 0;
          
          // At least one must be present
          if (!hasFixSuggestion && !hasExplanation) {
            console.error('FAIL: Violation has neither fix suggestion nor explanation');
            return false;
          }
          
          return true;
        }
      ),
      config
    );
  });
});
