# Rule Authoring Guide

This guide explains how to create custom rules for RepoForge's Rule Engine. Custom rules allow you to enforce team-specific coding standards, detect project-specific issues, and extend RepoForge's capabilities.

## Table of Contents

- [Quick Start](#quick-start)
- [Rule Anatomy](#rule-anatomy)
- [Rule Categories](#rule-categories)
- [Severity Levels](#severity-levels)
- [Writing Check Functions](#writing-check-functions)
- [Framework-Specific Rules](#framework-specific-rules)
- [Advanced Features](#advanced-features)
- [Examples by Category](#examples-by-category)
- [Best Practices](#best-practices)

## Quick Start

Here's a minimal custom rule:

```typescript
import { Rule, RuleContext, Violation } from '../core/ruleEngine/types';

const myCustomRule: Rule = {
  id: 'CUSTOM001_MY_RULE',
  name: 'My Custom Rule',
  category: 'Style',
  severity: 'LOW',
  description: 'Detects TODO comments in production code',
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    const todoPattern = /\/\/\s*TODO:/gi;
    const matches = context.fileContent.matchAll(todoPattern);
    
    for (const match of matches) {
      violations.push({
        ruleId: 'CUSTOM001_MY_RULE',
        ruleName: 'My Custom Rule',
        severity: 'LOW',
        category: 'Style',
        message: 'TODO comment found',
        filePath: context.filePath,
        line: getLineNumber(context.fileContent, match.index!),
        fixSuggestion: 'Create a ticket and remove the TODO comment',
        explanation: 'TODO comments should be tracked in issue management systems'
      });
    }
    
    return violations;
  }
};
```

## Rule Anatomy

Every rule must implement the `Rule` interface:

```typescript
interface Rule {
  // Unique identifier (use CATEGORY###_NAME format)
  id: string;
  
  // Human-readable name
  name: string;
  
  // One of: Security, Testing, Architecture, Performance, Style, Maintainability
  category: RuleCategory;
  
  // One of: CRITICAL, HIGH, MEDIUM, LOW, SUGGESTION
  severity: Severity;
  
  // Brief description of what the rule checks
  description: string;
  
  // Function that performs the check
  check: (context: RuleContext) => Violation[];
  
  // Optional: adjust severity based on context
  adjustSeverity?: (context: RuleContext, baseSeverity: Severity) => Severity;
  
  // Optional: frameworks this rule applies to
  frameworks?: Framework[];
  
  // Optional: tags for filtering
  tags?: string[];
}
```

### Rule ID Convention

Use this format: `CATEGORY###_DESCRIPTIVE_NAME`

Examples:
- `SEC001_HARDCODED_CREDENTIALS`
- `TEST001_MISSING_ASSERTIONS`
- `ARCH001_CIRCULAR_DEPENDENCY`
- `PERF001_INEFFICIENT_LOOP`
- `STYLE001_NAMING_CONVENTION`
- `MAINT001_EXCESSIVE_COMPLEXITY`

## Rule Categories

Choose the category that best fits your rule:

### Security
For rules that detect security vulnerabilities or risks.

**Examples:**
- Hardcoded credentials
- SQL injection risks
- Exposed secrets
- Unsafe cryptographic practices
- Missing input validation

**Typical Severities:** CRITICAL, HIGH

### Testing
For rules related to test coverage and quality.

**Examples:**
- Missing test files
- Missing assertions
- Skipped tests
- Test file naming conventions

**Typical Severities:** MEDIUM, LOW

### Architecture
For rules about code organization and structure.

**Examples:**
- Circular dependencies
- Layer violations
- Tight coupling
- Missing separation of concerns
- Misplaced files

**Typical Severities:** HIGH, MEDIUM

### Performance
For rules that detect performance issues.

**Examples:**
- Inefficient algorithms
- Memory leaks
- Unnecessary re-renders
- Blocking operations
- Large bundle sizes

**Typical Severities:** HIGH, MEDIUM

### Style
For rules about code formatting and conventions.

**Examples:**
- Naming conventions
- File naming patterns
- Code formatting
- Comment style

**Typical Severities:** LOW, SUGGESTION

### Maintainability
For rules about code quality and maintainability.

**Examples:**
- Code complexity
- File size
- Function length
- Code duplication
- Technical debt markers

**Typical Severities:** MEDIUM, LOW

## Severity Levels

Assign severity based on the impact of the violation:

### CRITICAL
**When to use:** Security vulnerabilities, data loss risks, system crashes

**Examples:**
- Hardcoded credentials
- SQL injection vulnerabilities
- Exposed API keys
- Unhandled promise rejections in critical paths

**Action:** Fix immediately, block deployment

### HIGH
**When to use:** Significant bugs, major architectural issues, performance problems

**Examples:**
- Missing error handling
- Tight coupling between layers
- Memory leaks
- Circular dependencies

**Action:** Fix before next release

### MEDIUM
**When to use:** Code quality issues, maintainability concerns

**Examples:**
- Missing tests
- Large files (>500 lines)
- Naming violations
- Moderate complexity

**Action:** Fix in current sprint

### LOW
**When to use:** Minor style issues, minor improvements

**Examples:**
- Inconsistent naming
- Minor refactoring opportunities
- Console.log statements
- Empty catch blocks

**Action:** Fix when convenient

### SUGGESTION
**When to use:** Optional improvements, best practices

**Examples:**
- Consider using const instead of let
- Could extract this into a function
- Consider adding JSDoc comments

**Action:** Optional, team decides

## Writing Check Functions

The `check` function receives a `RuleContext` and returns an array of `Violation` objects.

### RuleContext

```typescript
interface RuleContext {
  filePath: string;        // Path to the file being checked
  fileContent: string;     // Full content of the file
  ast?: any;              // AST if available (optional)
  projectProfile: ProjectProfile;  // Project metadata
  allFiles: string[];     // All files in the project
}
```

### Violation

```typescript
interface Violation {
  ruleId: string;         // Must match your rule's id
  ruleName: string;       // Must match your rule's name
  severity: Severity;     // Must match your rule's severity
  category: RuleCategory; // Must match your rule's category
  message: string;        // Brief description of the issue
  filePath: string;       // File where violation occurred
  line?: number;          // Line number (optional but recommended)
  column?: number;        // Column number (optional)
  codeSnippet?: string;   // Code snippet showing the issue
  fixSuggestion: string;  // How to fix the issue
  explanation: string;    // Why this is a problem
}
```

### Pattern Matching Example

```typescript
check: (context: RuleContext): Violation[] => {
  const violations: Violation[] = [];
  
  // Define patterns to search for
  const patterns = [
    { regex: /password\s*=\s*["'][^"']+["']/gi, type: 'password' },
    { regex: /api[_-]?key\s*=\s*["'][^"']+["']/gi, type: 'API key' },
  ];
  
  // Search for each pattern
  for (const { regex, type } of patterns) {
    const matches = context.fileContent.matchAll(regex);
    
    for (const match of matches) {
      const line = getLineNumber(context.fileContent, match.index!);
      
      violations.push({
        ruleId: this.id,
        ruleName: this.name,
        severity: this.severity,
        category: this.category,
        message: `Hardcoded ${type} detected`,
        filePath: context.filePath,
        line,
        codeSnippet: extractSnippet(context.fileContent, match.index!),
        fixSuggestion: `Move ${type} to environment variables`,
        explanation: `Hardcoded credentials pose a security risk`
      });
    }
  }
  
  return violations;
}
```

### Helper Functions

```typescript
// Get line number from character index
function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}

// Extract code snippet around an index
function extractSnippet(content: string, index: number, context: number = 2): string {
  const lines = content.split('\n');
  const lineNum = getLineNumber(content, index);
  const start = Math.max(0, lineNum - context - 1);
  const end = Math.min(lines.length, lineNum + context);
  
  return lines.slice(start, end).join('\n');
}
```

## Framework-Specific Rules

Rules can target specific frameworks:

```typescript
const reactRule: Rule = {
  id: 'REACT001_ASYNC_USEEFFECT',
  name: 'Async useEffect',
  category: 'Architecture',
  severity: 'HIGH',
  description: 'Detects async functions directly in useEffect',
  
  // Only applies to React and Next.js projects
  frameworks: ['react', 'next'],
  
  check: (context: RuleContext): Violation[] => {
    // This check only runs on React/Next.js projects
    const pattern = /useEffect\s*\(\s*async\s*\(/g;
    // ... implementation
  }
};
```

Available frameworks:
- `react`, `next`, `vue`, `nuxt`, `angular`, `svelte`
- `express`, `fastify`, `nest`
- `vite`, `webpack`

## Advanced Features

### Context-Aware Severity Adjustment

Adjust severity based on project context:

```typescript
const rule: Rule = {
  id: 'MAINT001_FILE_SIZE',
  name: 'Large File',
  category: 'Maintainability',
  severity: 'MEDIUM',
  description: 'Detects files that are too large',
  
  check: (context: RuleContext): Violation[] => {
    const lines = context.fileContent.split('\n').length;
    
    if (lines > 500) {
      return [{
        // ... violation details
      }];
    }
    
    return [];
  },
  
  // Adjust severity based on context
  adjustSeverity: (context: RuleContext, baseSeverity: Severity): Severity => {
    const lines = context.fileContent.split('\n').length;
    
    // More severe for very large files
    if (lines > 1000) {
      return 'HIGH';
    }
    
    // Less severe for test files
    if (context.filePath.includes('.test.') || context.filePath.includes('.spec.')) {
      return 'LOW';
    }
    
    return baseSeverity;
  }
};
```

### Using Project Profile

Access project metadata in your checks:

```typescript
check: (context: RuleContext): Violation[] => {
  const { projectProfile } = context;
  
  // Check if project uses TypeScript
  if (projectProfile.hasTypeScript) {
    // TypeScript-specific checks
  }
  
  // Check detected frameworks
  if (projectProfile.frameworks.includes('react')) {
    // React-specific checks
  }
  
  // Check architecture pattern
  if (projectProfile.architecture === 'mvc') {
    // MVC-specific checks
  }
  
  return violations;
}
```

### Multi-File Analysis

Access all project files for cross-file checks:

```typescript
check: (context: RuleContext): Violation[] => {
  const violations: Violation[] = [];
  
  // Find all test files
  const testFiles = context.allFiles.filter(f => 
    f.includes('.test.') || f.includes('.spec.')
  );
  
  // Check if current file has a corresponding test
  const baseName = context.filePath.replace(/\.(ts|js|tsx|jsx)$/, '');
  const hasTest = testFiles.some(f => f.includes(baseName));
  
  if (!hasTest) {
    violations.push({
      // ... missing test violation
    });
  }
  
  return violations;
}
```

## Examples by Category

### Security Rule Example

```typescript
const sqlInjectionRule: Rule = {
  id: 'SEC002_SQL_INJECTION',
  name: 'SQL Injection Risk',
  category: 'Security',
  severity: 'CRITICAL',
  description: 'Detects unsafe SQL query construction',
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Detect string concatenation in SQL queries
    const patterns = [
      /query\s*\(\s*['"`][^'"`]*\$\{/g,
      /execute\s*\(\s*['"`][^'"`]*\+/g,
    ];
    
    for (const pattern of patterns) {
      const matches = context.fileContent.matchAll(pattern);
      
      for (const match of matches) {
        violations.push({
          ruleId: 'SEC002_SQL_INJECTION',
          ruleName: 'SQL Injection Risk',
          severity: 'CRITICAL',
          category: 'Security',
          message: 'Unsafe SQL query construction detected',
          filePath: context.filePath,
          line: getLineNumber(context.fileContent, match.index!),
          codeSnippet: extractSnippet(context.fileContent, match.index!),
          fixSuggestion: 'Use parameterized queries or an ORM',
          explanation: 'String concatenation in SQL queries can lead to SQL injection vulnerabilities'
        });
      }
    }
    
    return violations;
  },
  
  tags: ['security', 'sql', 'injection']
};
```

### Testing Rule Example

```typescript
const missingAssertionsRule: Rule = {
  id: 'TEST001_MISSING_ASSERTIONS',
  name: 'Missing Test Assertions',
  category: 'Testing',
  severity: 'MEDIUM',
  description: 'Detects test functions without assertions',
  
  check: (context: RuleContext): Violation[] => {
    // Only check test files
    if (!context.filePath.match(/\.(test|spec)\.(ts|js|tsx|jsx)$/)) {
      return [];
    }
    
    const violations: Violation[] = [];
    const content = context.fileContent;
    
    // Find test blocks
    const testPattern = /(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{([^}]+)\}/g;
    const matches = content.matchAll(testPattern);
    
    for (const match of matches) {
      const testBody = match[2];
      
      // Check for assertion keywords
      const hasAssertion = /expect|assert|should/.test(testBody);
      
      if (!hasAssertion) {
        violations.push({
          ruleId: 'TEST001_MISSING_ASSERTIONS',
          ruleName: 'Missing Test Assertions',
          severity: 'MEDIUM',
          category: 'Testing',
          message: `Test "${match[1]}" has no assertions`,
          filePath: context.filePath,
          line: getLineNumber(content, match.index!),
          fixSuggestion: 'Add expect() or assert() statements to verify behavior',
          explanation: 'Tests without assertions do not verify any behavior'
        });
      }
    }
    
    return violations;
  }
};
```

### Architecture Rule Example

```typescript
const circularDependencyRule: Rule = {
  id: 'ARCH001_CIRCULAR_DEPENDENCY',
  name: 'Circular Dependency',
  category: 'Architecture',
  severity: 'HIGH',
  description: 'Detects circular dependencies between modules',
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Build dependency graph
    const imports = extractImports(context.fileContent);
    const graph = buildDependencyGraph(context.allFiles);
    
    // Detect cycles
    const cycles = findCycles(graph, context.filePath);
    
    for (const cycle of cycles) {
      violations.push({
        ruleId: 'ARCH001_CIRCULAR_DEPENDENCY',
        ruleName: 'Circular Dependency',
        severity: 'HIGH',
        category: 'Architecture',
        message: `Circular dependency detected: ${cycle.join(' -> ')}`,
        filePath: context.filePath,
        fixSuggestion: 'Refactor to remove circular dependency, consider dependency inversion',
        explanation: 'Circular dependencies make code harder to test and maintain'
      });
    }
    
    return violations;
  }
};
```

### Performance Rule Example

```typescript
const inefficientLoopRule: Rule = {
  id: 'PERF001_INEFFICIENT_LOOP',
  name: 'Inefficient Loop',
  category: 'Performance',
  severity: 'MEDIUM',
  description: 'Detects inefficient loop patterns',
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Detect array.length in loop condition
    const pattern = /for\s*\([^;]+;\s*\w+\s*<\s*\w+\.length\s*;/g;
    const matches = context.fileContent.matchAll(pattern);
    
    for (const match of matches) {
      violations.push({
        ruleId: 'PERF001_INEFFICIENT_LOOP',
        ruleName: 'Inefficient Loop',
        severity: 'MEDIUM',
        category: 'Performance',
        message: 'Array length accessed in every loop iteration',
        filePath: context.filePath,
        line: getLineNumber(context.fileContent, match.index!),
        codeSnippet: extractSnippet(context.fileContent, match.index!),
        fixSuggestion: 'Cache array length: const len = arr.length; for (let i = 0; i < len; i++)',
        explanation: 'Accessing .length in loop condition causes unnecessary property lookups'
      });
    }
    
    return violations;
  }
};
```

### Style Rule Example

```typescript
const namingConventionRule: Rule = {
  id: 'STYLE001_NAMING_CONVENTION',
  name: 'Naming Convention Violation',
  category: 'Style',
  severity: 'LOW',
  description: 'Enforces naming conventions',
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Check function names (should be camelCase)
    const functionPattern = /function\s+([A-Z][a-zA-Z0-9]*)\s*\(/g;
    const matches = context.fileContent.matchAll(functionPattern);
    
    for (const match of matches) {
      violations.push({
        ruleId: 'STYLE001_NAMING_CONVENTION',
        ruleName: 'Naming Convention Violation',
        severity: 'LOW',
        category: 'Style',
        message: `Function "${match[1]}" should use camelCase`,
        filePath: context.filePath,
        line: getLineNumber(context.fileContent, match.index!),
        fixSuggestion: `Rename to ${toCamelCase(match[1])}`,
        explanation: 'Functions should use camelCase naming convention'
      });
    }
    
    return violations;
  }
};
```

### Maintainability Rule Example

```typescript
const complexityRule: Rule = {
  id: 'MAINT001_EXCESSIVE_COMPLEXITY',
  name: 'Excessive Complexity',
  category: 'Maintainability',
  severity: 'MEDIUM',
  description: 'Detects functions with high cyclomatic complexity',
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Calculate complexity for each function
    const functions = extractFunctions(context.fileContent);
    
    for (const func of functions) {
      const complexity = calculateComplexity(func.body);
      
      if (complexity > 10) {
        violations.push({
          ruleId: 'MAINT001_EXCESSIVE_COMPLEXITY',
          ruleName: 'Excessive Complexity',
          severity: complexity > 20 ? 'HIGH' : 'MEDIUM',
          category: 'Maintainability',
          message: `Function "${func.name}" has complexity ${complexity}`,
          filePath: context.filePath,
          line: func.line,
          fixSuggestion: 'Break down into smaller functions',
          explanation: 'High complexity makes code harder to understand and test'
        });
      }
    }
    
    return violations;
  }
};
```

## Best Practices

### 1. Be Specific in Messages
❌ Bad: "Code quality issue"
✅ Good: "Function exceeds 50 lines (found 87 lines)"

### 2. Provide Actionable Fix Suggestions
❌ Bad: "Fix this"
✅ Good: "Move credentials to environment variables using process.env.API_KEY"

### 3. Include Context in Explanations
❌ Bad: "This is wrong"
✅ Good: "Hardcoded credentials in source code can be exposed in version control and pose a security risk"

### 4. Use Appropriate Severity
- Don't mark everything as CRITICAL
- Reserve CRITICAL for security and data loss issues
- Use SUGGESTION for optional improvements

### 5. Handle Edge Cases
```typescript
check: (context: RuleContext): Violation[] => {
  // Skip non-applicable files
  if (!context.filePath.endsWith('.ts')) {
    return [];
  }
  
  // Handle empty files
  if (!context.fileContent.trim()) {
    return [];
  }
  
  // Your check logic here
}
```

### 6. Optimize Performance
```typescript
// ❌ Bad: Multiple passes over content
const matches1 = content.matchAll(pattern1);
const matches2 = content.matchAll(pattern2);

// ✅ Good: Single pass with combined pattern
const combinedPattern = new RegExp(`(${pattern1.source})|(${pattern2.source})`, 'g');
const matches = content.matchAll(combinedPattern);
```

### 7. Test Your Rules
Always test your custom rules with:
- Valid code (should pass)
- Invalid code (should detect violations)
- Edge cases (empty files, comments, etc.)

### 8. Document Your Rules
Include clear descriptions and examples in your rule definitions.

### 9. Use Tags for Organization
```typescript
tags: ['security', 'credentials', 'secrets', 'critical']
```

### 10. Consider Framework Context
```typescript
// Adjust checks based on framework
if (context.projectProfile.frameworks.includes('react')) {
  // React-specific logic
} else if (context.projectProfile.frameworks.includes('vue')) {
  // Vue-specific logic
}
```

## Registering Custom Rules

### Option 1: Configuration File

Create `.repoforge/custom-rules.ts`:

```typescript
import { Rule } from 'repoforge';

export const customRules: Rule[] = [
  {
    id: 'CUSTOM001_MY_RULE',
    // ... rule definition
  },
  {
    id: 'CUSTOM002_ANOTHER_RULE',
    // ... rule definition
  }
];
```

Reference in `.repoforge/rules.json`:

```json
{
  "customRules": "./custom-rules.ts"
}
```

### Option 2: Programmatic Registration

```typescript
import { RuleRegistry } from 'repoforge';

const registry = new RuleRegistry();

registry.register({
  id: 'CUSTOM001_MY_RULE',
  // ... rule definition
});
```

## Troubleshooting

### Rule Not Running
- Check that the rule ID is unique
- Verify the rule is registered in configuration
- Ensure the rule isn't disabled
- Check framework filters match your project

### False Positives
- Refine your regex patterns
- Add file type filters
- Use AST-based checks instead of regex
- Add context-aware logic

### Performance Issues
- Limit regex complexity
- Cache expensive computations
- Skip non-applicable files early
- Use streaming for large files

## Next Steps

1. Read the [Configuration Guide](./CONFIGURATION_EXAMPLES.md) for setup options
2. Check the [Rule Engine Design](../.kiro/specs/rule-engine/design.md) for architecture details
3. Browse built-in rules in `core/ruleEngine/` for more examples
4. Join the community to share your custom rules!

