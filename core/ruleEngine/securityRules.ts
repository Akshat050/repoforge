/**
 * Built-in Security Rules
 * Pre-defined security rules for detecting common vulnerabilities
 */

import { Rule, RuleContext, Violation } from './types';

/**
 * Helper function to get line number from string index
 */
function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}

/**
 * Helper function to extract code snippet around a match
 */
function extractSnippet(content: string, index: number, contextLines: number = 2): string {
  const lines = content.split('\n');
  const lineNumber = getLineNumber(content, index);
  const startLine = Math.max(0, lineNumber - contextLines - 1);
  const endLine = Math.min(lines.length, lineNumber + contextLines);
  
  return lines.slice(startLine, endLine).join('\n');
}

/**
 * SEC001: Hardcoded Credentials Detection
 * Detects hardcoded passwords, API keys, and secrets in source code
 */
export const hardcodedCredentialsRule: Rule = {
  id: 'SEC001_HARDCODED_CREDENTIALS',
  name: 'Hardcoded Credentials',
  category: 'Security',
  severity: 'CRITICAL',
  description: 'Detects hardcoded passwords, API keys, and secrets in source code',
  tags: ['security', 'credentials', 'secrets'],
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Patterns for detecting hardcoded credentials
    const patterns = [
      { regex: /password\s*[=:]\s*["'][^"'\s]{3,}["']/gi, type: 'password' },
      { regex: /passwd\s*[=:]\s*["'][^"'\s]{3,}["']/gi, type: 'password' },
      { regex: /pwd\s*[=:]\s*["'][^"'\s]{3,}["']/gi, type: 'password' },
      { regex: /api[_-]?key\s*[=:]\s*["'][^"'\s]{10,}["']/gi, type: 'API key' },
      { regex: /apikey\s*[=:]\s*["'][^"'\s]{10,}["']/gi, type: 'API key' },
      { regex: /secret\s*[=:]\s*["'][^"'\s]{10,}["']/gi, type: 'secret' },
      { regex: /token\s*[=:]\s*["'][^"'\s]{10,}["']/gi, type: 'token' },
      { regex: /access[_-]?key\s*[=:]\s*["'][^"'\s]{10,}["']/gi, type: 'access key' },
      { regex: /private[_-]?key\s*[=:]\s*["'][^"'\s]{10,}["']/gi, type: 'private key' },
    ];
    
    for (const pattern of patterns) {
      const matches = Array.from(context.fileContent.matchAll(pattern.regex));
      
      for (const match of matches) {
        const matchIndex = match.index!;
        const lineNumber = getLineNumber(context.fileContent, matchIndex);
        
        violations.push({
          ruleId: hardcodedCredentialsRule.id,
          ruleName: hardcodedCredentialsRule.name,
          severity: hardcodedCredentialsRule.severity,
          category: hardcodedCredentialsRule.category,
          message: `Hardcoded ${pattern.type} detected`,
          filePath: context.filePath,
          line: lineNumber,
          codeSnippet: extractSnippet(context.fileContent, matchIndex),
          fixSuggestion: `Move ${pattern.type} to environment variables or a secure vault. Use process.env.${pattern.type.toUpperCase().replace(/\s+/g, '_')} or a secrets management service.`,
          explanation: `Hardcoded credentials in source code can be exposed in version control history, logs, and error messages. This poses a significant security risk as anyone with access to the code can obtain these credentials.`,
          immediateAttention: true
        });
      }
    }
    
    return violations;
  }
};


/**
 * SEC002: SQL Injection Detection
 * Detects unsafe SQL query construction using string concatenation
 */
export const sqlInjectionRule: Rule = {
  id: 'SEC002_SQL_INJECTION',
  name: 'SQL Injection Risk',
  category: 'Security',
  severity: 'CRITICAL',
  description: 'Detects unsafe SQL query construction that may be vulnerable to SQL injection',
  tags: ['security', 'sql', 'injection'],
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Patterns for detecting SQL injection vulnerabilities
    const patterns = [
      // String concatenation with SQL keywords
      /(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\s+.*?\+\s*(?:req\.|params\.|query\.|body\.|\$\{|`\$\{)/gi,
      // Template literals with SQL
      /`(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\s+.*?\$\{[^}]+\}`/gi,
      // Direct variable interpolation in SQL
      /(?:query|execute|run)\s*\(\s*["'`](?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\s+.*?["'`]\s*\+/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = Array.from(context.fileContent.matchAll(pattern));
      
      for (const match of matches) {
        const matchIndex = match.index!;
        const lineNumber = getLineNumber(context.fileContent, matchIndex);
        
        violations.push({
          ruleId: sqlInjectionRule.id,
          ruleName: sqlInjectionRule.name,
          severity: sqlInjectionRule.severity,
          category: sqlInjectionRule.category,
          message: 'Potential SQL injection vulnerability detected',
          filePath: context.filePath,
          line: lineNumber,
          codeSnippet: extractSnippet(context.fileContent, matchIndex),
          fixSuggestion: 'Use parameterized queries or prepared statements instead of string concatenation. For example: db.query("SELECT * FROM users WHERE id = ?", [userId]) instead of db.query("SELECT * FROM users WHERE id = " + userId)',
          explanation: 'SQL injection occurs when user input is directly concatenated into SQL queries without proper sanitization. Attackers can manipulate the query to access, modify, or delete unauthorized data. Always use parameterized queries or ORM methods that handle escaping automatically.',
          immediateAttention: true
        });
      }
    }
    
    return violations;
  }
};


/**
 * SEC003: Exposed Secrets Detection
 * Detects environment variables, tokens, and secrets exposed in code
 */
export const exposedSecretsRule: Rule = {
  id: 'SEC003_EXPOSED_SECRETS',
  name: 'Exposed Secrets',
  category: 'Security',
  severity: 'CRITICAL',
  description: 'Detects environment variables, tokens, and secrets that may be exposed in code',
  tags: ['security', 'secrets', 'tokens', 'environment'],
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Patterns for detecting exposed secrets
    const patterns = [
      // AWS keys
      { regex: /AKIA[0-9A-Z]{16}/g, type: 'AWS Access Key' },
      // Generic API keys (long alphanumeric strings)
      { regex: /['"](sk|pk)_(?:live|test)_[0-9a-zA-Z]{24,}['"]/g, type: 'API Key (Stripe-like)' },
      // GitHub tokens
      { regex: /gh[pousr]_[0-9a-zA-Z]{36}/g, type: 'GitHub Token' },
      // Generic bearer tokens
      { regex: /bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi, type: 'Bearer Token' },
      // JWT tokens (basic detection)
      { regex: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, type: 'JWT Token' },
      // Private keys
      { regex: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g, type: 'Private Key' },
      // Slack tokens
      { regex: /xox[baprs]-[0-9a-zA-Z]{10,}/g, type: 'Slack Token' },
      // Google API keys
      { regex: /AIza[0-9A-Za-z\\-_]{35}/g, type: 'Google API Key' },
    ];
    
    for (const pattern of patterns) {
      const matches = Array.from(context.fileContent.matchAll(pattern.regex));
      
      for (const match of matches) {
        const matchIndex = match.index!;
        const lineNumber = getLineNumber(context.fileContent, matchIndex);
        
        violations.push({
          ruleId: exposedSecretsRule.id,
          ruleName: exposedSecretsRule.name,
          severity: exposedSecretsRule.severity,
          category: exposedSecretsRule.category,
          message: `Exposed ${pattern.type} detected in code`,
          filePath: context.filePath,
          line: lineNumber,
          codeSnippet: extractSnippet(context.fileContent, matchIndex),
          fixSuggestion: `Remove the ${pattern.type} from the code immediately. Rotate the credential if it has been committed to version control. Store secrets in environment variables, a secrets manager (AWS Secrets Manager, HashiCorp Vault), or encrypted configuration files that are not committed to the repository.`,
          explanation: `Exposed secrets in source code are a critical security vulnerability. Once committed to version control, they remain in the git history even if removed later. Attackers can scan public repositories for exposed credentials and gain unauthorized access to systems and data.`,
          immediateAttention: true
        });
      }
    }
    
    return violations;
  }
};


/**
 * SEC004: Unsafe Cryptography Detection
 * Detects weak cryptographic algorithms and practices
 */
export const unsafeCryptoRule: Rule = {
  id: 'SEC004_UNSAFE_CRYPTO',
  name: 'Unsafe Cryptography',
  category: 'Security',
  severity: 'HIGH',
  description: 'Detects weak cryptographic algorithms and insecure cryptographic practices',
  tags: ['security', 'cryptography', 'encryption'],
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Patterns for detecting unsafe cryptography
    const patterns = [
      // Weak hash algorithms
      { regex: /\b(?:md5|MD5)\b/g, type: 'MD5 hash algorithm', recommendation: 'Use SHA-256 or SHA-3 instead' },
      { regex: /\b(?:sha1|SHA1|sha-1|SHA-1)\b/g, type: 'SHA-1 hash algorithm', recommendation: 'Use SHA-256 or SHA-3 instead' },
      
      // Weak encryption algorithms
      { regex: /\b(?:DES|des)\b(?!cription|ign|troy)/g, type: 'DES encryption', recommendation: 'Use AES-256 instead' },
      { regex: /\bRC4\b/g, type: 'RC4 encryption', recommendation: 'Use AES-256 instead' },
      
      // ECB mode (insecure)
      { regex: /['"](?:aes-\d+-ecb|des-ecb)['"]|ECB/gi, type: 'ECB cipher mode', recommendation: 'Use CBC, GCM, or CTR mode instead' },
      
      // Weak key sizes
      { regex: /(?:keySize|key_size|keyLength|key_length)\s*[=:]\s*(?:40|56|64|128)(?!\d)/g, type: 'weak key size', recommendation: 'Use at least 256-bit keys for symmetric encryption' },
      
      // Insecure random number generation
      { regex: /Math\.random\(\)/g, type: 'Math.random() for security', recommendation: 'Use crypto.randomBytes() or crypto.getRandomValues() for cryptographic purposes' },
      
      // Hardcoded IV or salt
      { regex: /(?:iv|salt|nonce)\s*[=:]\s*["'][^"']+["']/gi, type: 'hardcoded IV/salt', recommendation: 'Generate random IVs and salts for each encryption operation' },
    ];
    
    for (const pattern of patterns) {
      const matches = Array.from(context.fileContent.matchAll(pattern.regex));
      
      for (const match of matches) {
        const matchIndex = match.index!;
        const lineNumber = getLineNumber(context.fileContent, matchIndex);
        
        violations.push({
          ruleId: unsafeCryptoRule.id,
          ruleName: unsafeCryptoRule.name,
          severity: unsafeCryptoRule.severity,
          category: unsafeCryptoRule.category,
          message: `Unsafe cryptographic practice detected: ${pattern.type}`,
          filePath: context.filePath,
          line: lineNumber,
          codeSnippet: extractSnippet(context.fileContent, matchIndex),
          fixSuggestion: pattern.recommendation,
          explanation: `Using weak or outdated cryptographic algorithms can compromise the security of your application. ${pattern.type} is considered insecure and should not be used for security-sensitive operations. Modern alternatives provide better security guarantees and are resistant to known attacks.`,
          immediateAttention: false
        });
      }
    }
    
    return violations;
  }
};

/**
 * Export all security rules as an array for easy registration
 */
export const securityRules: Rule[] = [
  hardcodedCredentialsRule,
  sqlInjectionRule,
  exposedSecretsRule,
  unsafeCryptoRule,
];
