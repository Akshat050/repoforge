/**
 * Property-Based Tests for Audit Rules
 * Tests correctness properties for ghost, curse, and zombie detection rules
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { AUDIT_RULES } from './auditRules';
import { RuleContext, Severity } from './types';
import { ProjectProfile } from '../types';

const config = { numRuns: 100 };

// Arbitraries for generating test data
const severityArbitrary = fc.constantFrom<Severity>('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SUGGESTION');

const filePathArbitrary = fc.oneof(
  fc.constant('src/utils/helper.ts'),
  fc.constant('src/components/Button.tsx'),
  fc.constant('src/services/userService.ts'),
  fc.constant('src/models/User.ts'),
  fc.constant('lib/core.ts'),
  fc.constant('core/engine.ts'),
  fc.constant('random_file.ts'),
  fc.constant('src/very_long_file.ts'),
);

const fileContentArbitrary = fc.oneof(
  fc.constant('export function test() { return true; }'),
  fc.constant('import React from "react";\nexport const Button = () => <div>Click</div>;'),
  fc.constant('import express from "express";\nconst app = express();'),
  fc.constant('// '.repeat(1000)), // Very long file
);

const projectProfileArbitrary: fc.Arbitrary<ProjectProfile> = fc.record({
  type: fc.constantFrom('frontend', 'backend', 'fullstack', 'library', 'monorepo', 'unknown'),
  frameworks: fc.array(fc.constantFrom('react', 'next', 'vue', 'express', 'nest', 'none'), { minLength: 1, maxLength: 3 }),
  architecture: fc.constantFrom('mvc', 'layered', 'clean', 'modular', 'flat', 'unknown'),
  hasTests: fc.boolean(),
  hasTypeScript: fc.boolean(),
  hasBuildConfig: fc.boolean(),
  packageManager: fc.constantFrom('npm', 'yarn', 'pnpm', 'bun', 'unknown'),
  confidence: fc.integer({ min: 0, max: 100 }),
});

const ruleContextArbitrary: fc.Arbitrary<RuleContext> = fc.record({
  filePath: filePathArbitrary,
  fileContent: fileContentArbitrary,
  ast: fc.constant(undefined),
  projectProfile: projectProfileArbitrary,
  allFiles: fc.array(filePathArbitrary, { minLength: 0, maxLength: 20 }),
});

describe('Audit Rules Property Tests', () => {
  describe('Property 1: Valid severity assignment', () => {
    it('**Feature: rule-engine, Property 1: Valid severity assignment** - all violations must have valid severity', () => {
      fc.assert(
        fc.property(
          ruleContextArbitrary,
          (context) => {
            const validSeverities: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SUGGESTION'];
            
            // Test all audit rules
            for (const rule of AUDIT_RULES) {
              const violations = rule.check(context);
              
              // Every violation must have a valid severity
              for (const violation of violations) {
                if (!validSeverities.includes(violation.severity)) {
                  return false;
                }
              }
            }
            
            return true;
          }
        ),
        config
      );
    });
  });

  describe('Property 9: Valid category assignment', () => {
    it('**Feature: rule-engine, Property 9: Valid category assignment** - all violations must have valid category', () => {
      fc.assert(
        fc.property(
          ruleContextArbitrary,
          (context) => {
            const validCategories = ['Security', 'Testing', 'Architecture', 'Performance', 'Style', 'Maintainability'];
            
            // Test all audit rules
            for (const rule of AUDIT_RULES) {
              const violations = rule.check(context);
              
              // Every violation must have a valid category
              for (const violation of violations) {
                if (!validCategories.includes(violation.category)) {
                  return false;
                }
              }
            }
            
            return true;
          }
        ),
        config
      );
    });
  });
});

