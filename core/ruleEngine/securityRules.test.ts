/**
 * Security Rules Unit Tests
 * Tests for built-in security rules with valid and malicious code examples
 */

import { describe, it, expect } from 'vitest';
import {
  hardcodedCredentialsRule,
  sqlInjectionRule,
  exposedSecretsRule,
  unsafeCryptoRule,
} from './securityRules';
import { RuleContext } from './types';
import { ProjectProfile } from '../types';

// Helper to create a minimal RuleContext for testing
function createContext(fileContent: string, filePath: string = 'test.ts'): RuleContext {
  return {
    filePath,
    fileContent,
    projectProfile: {} as ProjectProfile,
    allFiles: [],
  };
}

describe('SEC001: Hardcoded Credentials Rule', () => {
  it('should detect hardcoded password', () => {
    const code = `
      const config = {
        password: "mySecretPassword123"
      };
    `;
    const violations = hardcodedCredentialsRule.check(createContext(code));
    
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe('SEC001_HARDCODED_CREDENTIALS');
    expect(violations[0].severity).toBe('CRITICAL');
    expect(violations[0].message).toContain('password');
    expect(violations[0].fixSuggestion).toBeTruthy();
    expect(violations[0].immediateAttention).toBe(true);
  });

  it('should detect hardcoded API key', () => {
    const code = `
      const apiKey = "sk_live_1234567890abcdefghij";
    `;
    const violations = hardcodedCredentialsRule.check(createContext(code));
    
    // May detect multiple patterns (api_key pattern and the actual key format)
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].message).toContain('API key');
  });

  it('should detect hardcoded secret', () => {
    const code = `
      const secret = "my-super-secret-value-12345";
    `;
    const violations = hardcodedCredentialsRule.check(createContext(code));
    
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('secret');
  });

  it('should not flag valid code without credentials', () => {
    const code = `
      const password = process.env.PASSWORD;
      const apiKey = getApiKeyFromVault();
    `;
    const violations = hardcodedCredentialsRule.check(createContext(code));
    
    expect(violations).toHaveLength(0);
  });

  it('should not flag short strings or variable names', () => {
    const code = `
      const passwordField = "password";
      const pwd = "";
    `;
    const violations = hardcodedCredentialsRule.check(createContext(code));
    
    expect(violations).toHaveLength(0);
  });
});

describe('SEC002: SQL Injection Rule', () => {
  it('should detect SQL injection with string concatenation', () => {
    const code = `
      const query = "SELECT * FROM users WHERE id = " + req.params.userId;
      db.execute(query);
    `;
    const violations = sqlInjectionRule.check(createContext(code));
    
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('SEC002_SQL_INJECTION');
    expect(violations[0].severity).toBe('CRITICAL');
    expect(violations[0].fixSuggestion).toContain('parameterized');
  });

  it('should detect SQL injection with template literals', () => {
    const code = `
      const query = \`SELECT * FROM users WHERE name = \${userName}\`;
    `;
    const violations = sqlInjectionRule.check(createContext(code));
    
    expect(violations.length).toBeGreaterThan(0);
  });

  it('should detect SQL injection with request parameters', () => {
    const code = `
      const sql = "DELETE FROM posts WHERE id = " + req.params.id;
    `;
    const violations = sqlInjectionRule.check(createContext(code));
    
    expect(violations.length).toBeGreaterThan(0);
  });

  it('should not flag safe parameterized queries', () => {
    const code = `
      const query = "SELECT * FROM users WHERE id = ?";
      db.execute(query, [userId]);
    `;
    const violations = sqlInjectionRule.check(createContext(code));
    
    expect(violations).toHaveLength(0);
  });

  it('should not flag ORM usage', () => {
    const code = `
      const user = await User.findOne({ where: { id: userId } });
    `;
    const violations = sqlInjectionRule.check(createContext(code));
    
    expect(violations).toHaveLength(0);
  });
});

describe('SEC003: Exposed Secrets Rule', () => {
  it('should detect AWS access key', () => {
    const code = `
      const awsKey = "AKIAIOSFODNN7EXAMPLE";
    `;
    const violations = exposedSecretsRule.check(createContext(code));
    
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('SEC003_EXPOSED_SECRETS');
    expect(violations[0].severity).toBe('CRITICAL');
    expect(violations[0].message).toContain('AWS');
  });

  it('should detect Stripe API key', () => {
    const code = `
      const stripeKey = "sk_live_FAKE_TEST_KEY_NOT_REAL_123456";
    `;
    const violations = exposedSecretsRule.check(createContext(code));
    
    expect(violations.length).toBeGreaterThan(0);
  });

  it('should detect JWT token', () => {
    const code = `
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    `;
    const violations = exposedSecretsRule.check(createContext(code));
    
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].message).toContain('JWT');
  });

  it('should detect private key', () => {
    const code = `
      const key = "-----BEGIN RSA PRIVATE KEY-----";
    `;
    const violations = exposedSecretsRule.check(createContext(code));
    
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].message).toContain('Private Key');
  });

  it('should not flag environment variable usage', () => {
    const code = `
      const apiKey = process.env.API_KEY;
      const token = getTokenFromVault();
    `;
    const violations = exposedSecretsRule.check(createContext(code));
    
    expect(violations).toHaveLength(0);
  });
});

describe('SEC004: Unsafe Cryptography Rule', () => {
  it('should detect MD5 usage', () => {
    const code = `
      const hash = crypto.createHash('md5').update(data).digest('hex');
    `;
    const violations = unsafeCryptoRule.check(createContext(code));
    
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].ruleId).toBe('SEC004_UNSAFE_CRYPTO');
    expect(violations[0].severity).toBe('HIGH');
    expect(violations[0].message).toContain('MD5');
    expect(violations[0].fixSuggestion).toContain('SHA-256');
  });

  it('should detect SHA-1 usage', () => {
    const code = `
      const hash = crypto.createHash('sha1').update(password).digest('hex');
    `;
    const violations = unsafeCryptoRule.check(createContext(code));
    
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].message).toContain('SHA-1');
  });

  it('should detect ECB mode', () => {
    const code = `
      const cipher = crypto.createCipher('aes-256-ecb', key);
    `;
    const violations = unsafeCryptoRule.check(createContext(code));
    
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].message).toContain('ECB');
  });

  it('should detect Math.random() for security', () => {
    const code = `
      const token = Math.random().toString(36);
    `;
    const violations = unsafeCryptoRule.check(createContext(code));
    
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].fixSuggestion).toContain('crypto.randomBytes');
  });

  it('should detect hardcoded IV', () => {
    const code = `
      const iv = "1234567890123456";
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    `;
    const violations = unsafeCryptoRule.check(createContext(code));
    
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].message).toContain('IV');
  });

  it('should not flag secure cryptography', () => {
    const code = `
      const hash = crypto.createHash('sha256').update(data).digest('hex');
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    `;
    const violations = unsafeCryptoRule.check(createContext(code));
    
    expect(violations).toHaveLength(0);
  });
});

describe('Security Rules - General Properties', () => {
  it('all security rules should have CRITICAL or HIGH severity', () => {
    const rules = [
      hardcodedCredentialsRule,
      sqlInjectionRule,
      exposedSecretsRule,
      unsafeCryptoRule,
    ];
    
    for (const rule of rules) {
      expect(['CRITICAL', 'HIGH']).toContain(rule.severity);
    }
  });

  it('all security rules should have Security category', () => {
    const rules = [
      hardcodedCredentialsRule,
      sqlInjectionRule,
      exposedSecretsRule,
      unsafeCryptoRule,
    ];
    
    for (const rule of rules) {
      expect(rule.category).toBe('Security');
    }
  });

  it('all violations should include fix suggestions', () => {
    const code = `
      const password = "hardcoded123";
      const query = "SELECT * FROM users WHERE id = " + userId;
    `;
    const context = createContext(code);
    
    const allViolations = [
      ...hardcodedCredentialsRule.check(context),
      ...sqlInjectionRule.check(context),
    ];
    
    for (const violation of allViolations) {
      expect(violation.fixSuggestion).toBeTruthy();
      expect(violation.fixSuggestion.length).toBeGreaterThan(0);
    }
  });
});


/**
 * Property-Based Tests for Security Rules
 * Using fast-check for property-based testing
 */

import fc from 'fast-check';

// Arbitraries for generating test data
const fileContentArb = fc.string({ minLength: 10, maxLength: 500 });
const filePathArb = fc.string({ minLength: 1 }).map(s => s + '.ts');

/**
 * **Feature: rule-engine, Property 12: Violation completeness**
 * For any violation, the violation must contain all required metadata: 
 * ruleId, ruleName, severity, category, message, filePath, fixSuggestion, and explanation.
 * **Validates: Requirements 1.5, 3.2, 4.5, 5.1, 5.5, 10.1, 10.3, 10.4**
 */
describe('Property 12: Violation completeness', () => {
  it('all violations from security rules must have complete metadata', () => {
    fc.assert(
      fc.property(
        fileContentArb,
        filePathArb,
        (content, filePath) => {
          const context = createContext(content, filePath);
          
          // Collect all violations from all security rules
          const allViolations = [
            ...hardcodedCredentialsRule.check(context),
            ...sqlInjectionRule.check(context),
            ...exposedSecretsRule.check(context),
            ...unsafeCryptoRule.check(context),
          ];
          
          // Check that every violation has all required fields
          for (const violation of allViolations) {
            // Required string fields must be non-empty
            if (!violation.ruleId || typeof violation.ruleId !== 'string' || violation.ruleId.trim() === '') {
              return false;
            }
            if (!violation.ruleName || typeof violation.ruleName !== 'string' || violation.ruleName.trim() === '') {
              return false;
            }
            if (!violation.message || typeof violation.message !== 'string' || violation.message.trim() === '') {
              return false;
            }
            if (!violation.filePath || typeof violation.filePath !== 'string' || violation.filePath.trim() === '') {
              return false;
            }
            if (!violation.fixSuggestion || typeof violation.fixSuggestion !== 'string' || violation.fixSuggestion.trim() === '') {
              return false;
            }
            if (!violation.explanation || typeof violation.explanation !== 'string' || violation.explanation.trim() === '') {
              return false;
            }
            
            // Severity must be valid
            const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SUGGESTION'];
            if (!validSeverities.includes(violation.severity)) {
              return false;
            }
            
            // Category must be valid
            const validCategories = ['Security', 'Testing', 'Architecture', 'Performance', 'Style', 'Maintainability'];
            if (!validCategories.includes(violation.category)) {
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

/**
 * **Feature: rule-engine, Property 13: Code snippet inclusion**
 * For any violation with a line number, the violation must include a code snippet showing the problematic code.
 * **Validates: Requirements 10.2**
 */
describe('Property 13: Code snippet inclusion', () => {
  it('violations with line numbers must include code snippets', () => {
    fc.assert(
      fc.property(
        fileContentArb,
        filePathArb,
        (content, filePath) => {
          const context = createContext(content, filePath);
          
          // Collect all violations from all security rules
          const allViolations = [
            ...hardcodedCredentialsRule.check(context),
            ...sqlInjectionRule.check(context),
            ...exposedSecretsRule.check(context),
            ...unsafeCryptoRule.check(context),
          ];
          
          // Check that every violation with a line number has a code snippet
          for (const violation of allViolations) {
            if (violation.line !== undefined && violation.line > 0) {
              // Must have a code snippet
              if (!violation.codeSnippet || typeof violation.codeSnippet !== 'string' || violation.codeSnippet.trim() === '') {
                return false;
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
