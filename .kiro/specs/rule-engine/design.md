# Design Document: Rule Engine with Severity Levels

## Overview

The Rule Engine is a foundational system that transforms RepoForge from a basic auditor into an extensible, intelligent code quality platform. It provides a structured way to define, evaluate, and report code quality issues with configurable severity levels, enabling developers to prioritize fixes and teams to enforce custom standards.

The engine introduces a clear separation between rule definitions (what to check), rule evaluation (how to check), and result reporting (how to communicate findings). This architecture enables RepoForge to scale from simple structural checks to deep static analysis, security scanning, and framework-specific validations.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      RepoForge CLI/MCP                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Rule Engine Core                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Rule Registry│  │ Rule Executor│  │Result Formatter│     │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌────────────────┐ ┌────────────┐ ┌────────────┐
│  Built-in Rules│ │Custom Rules│ │Framework   │
│  (Security,    │ │(Team       │ │Rules       │
│   Testing,     │ │ Standards) │ │(React,     │
│   Structure)   │ │            │ │ Node, etc.)│
└────────────────┘ └────────────┘ └────────────┘
```

### Component Breakdown

1. **Rule Registry**: Central repository of all available rules
   - Manages rule registration and lookup
   - Validates rule definitions
   - Handles rule enabling/disabling
   - Merges built-in and custom rules

2. **Rule Executor**: Orchestrates rule evaluation
   - Loads project context (files, AST, metadata)
   - Executes rules in parallel where possible
   - Collects violations and metadata
   - Handles errors gracefully

3. **Result Formatter**: Transforms violations into user-facing output
   - Groups by severity and category
   - Formats for CLI, JSON, or MCP responses
   - Generates fix suggestions
   - Provides contextual information

## Components and Interfaces

### Core Types

```typescript
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
}

// Rule definition interface
export interface Rule {
  id: string;
  name: string;
  category: RuleCategory;
  severity: Severity;
  description: string;
  
  // The check function that evaluates the rule
  check: (context: RuleContext) => Violation[];
  
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
```

### Rule Registry Interface

```typescript
export class RuleRegistry {
  private rules: Map<string, Rule> = new Map();
  
  // Register a new rule
  register(rule: Rule): void;
  
  // Register multiple rules at once
  registerMany(rules: Rule[]): void;
  
  // Get a rule by ID
  get(ruleId: string): Rule | undefined;
  
  // Get all registered rules
  getAll(): Rule[];
  
  // Get rules by category
  getByCategory(category: RuleCategory): Rule[];
  
  // Get rules applicable to a framework
  getByFramework(framework: Framework): Rule[];
  
  // Check if a rule exists
  has(ruleId: string): boolean;
  
  // Unregister a rule
  unregister(ruleId: string): void;
  
  // Validate rule definition
  validate(rule: Rule): { valid: boolean; errors: string[] };
}
```

### Rule Executor Interface

```typescript
export class RuleExecutor {
  constructor(
    private registry: RuleRegistry,
    private config: RuleEngineConfig
  ) {}
  
  // Execute all applicable rules against a repository
  async execute(repo: RepoMap, profile: ProjectProfile): Promise<RuleEngineResult>;
  
  // Execute specific rules
  async executeRules(
    ruleIds: string[],
    repo: RepoMap,
    profile: ProjectProfile
  ): Promise<RuleEngineResult>;
  
  // Execute a single rule against a file
  async executeRule(
    rule: Rule,
    context: RuleContext
  ): Promise<Violation[]>;
  
  // Filter violations by severity threshold
  filterBySeverity(violations: Violation[], minSeverity: Severity): Violation[];
  
  // Check if execution should fail based on config
  shouldFail(result: RuleEngineResult): boolean;
}
```

### Result Formatter Interface

```typescript
export class ResultFormatter {
  // Format for CLI output with colors and grouping
  formatCLI(result: RuleEngineResult): string;
  
  // Format as JSON for programmatic consumption
  formatJSON(result: RuleEngineResult): string;
  
  // Format for MCP response
  formatMCP(result: RuleEngineResult): object;
  
  // Generate summary statistics
  generateSummary(result: RuleEngineResult): string;
  
  // Group violations by severity
  groupBySeverity(violations: Violation[]): Map<Severity, Violation[]>;
  
  // Group violations by category
  groupByCategory(violations: Violation[]): Map<RuleCategory, Violation[]>;
  
  // Group violations by file
  groupByFile(violations: Violation[]): Map<string, Violation[]>;
}
```

## Data Models

### Severity Hierarchy

Severities are ordered by priority:

1. **CRITICAL**: Security vulnerabilities, data loss risks, system crashes
   - Examples: Hardcoded credentials, SQL injection, exposed secrets
   - Action: Fix immediately, block deployment
   
2. **HIGH**: Significant bugs, major architectural issues, performance problems
   - Examples: Missing error handling, tight coupling, memory leaks
   - Action: Fix before next release
   
3. **MEDIUM**: Code quality issues, maintainability concerns
   - Examples: Missing tests, large files, naming violations
   - Action: Fix in current sprint
   
4. **LOW**: Minor style issues, minor improvements
   - Examples: Inconsistent naming, minor refactoring opportunities
   - Action: Fix when convenient
   
5. **SUGGESTION**: Optional improvements, best practices
   - Examples: Consider using const, could extract function
   - Action: Optional, team decides

### Rule Definition Schema

```typescript
const exampleRule: Rule = {
  id: 'SEC001_HARDCODED_CREDENTIALS',
  name: 'Hardcoded Credentials',
  category: 'Security',
  severity: 'CRITICAL',
  description: 'Detects hardcoded passwords, API keys, and secrets in source code',
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    const patterns = [
      /password\s*=\s*["'][^"']+["']/gi,
      /api[_-]?key\s*=\s*["'][^"']+["']/gi,
      /secret\s*=\s*["'][^"']+["']/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = context.fileContent.matchAll(pattern);
      for (const match of matches) {
        violations.push({
          ruleId: this.id,
          ruleName: this.name,
          severity: this.severity,
          category: this.category,
          message: 'Hardcoded credential detected',
          filePath: context.filePath,
          line: getLineNumber(context.fileContent, match.index),
          codeSnippet: extractSnippet(context.fileContent, match.index),
          fixSuggestion: 'Move credentials to environment variables or a secure vault',
          explanation: 'Hardcoded credentials in source code can be exposed in version control and pose a security risk'
        });
      }
    }
    
    return violations;
  },
  
  frameworks: undefined, // Applies to all frameworks
  tags: ['security', 'credentials', 'secrets']
};
```

### Configuration File Format

Users can configure the rule engine via `.repoforge/rules.json`:

```json
{
  "minSeverity": "MEDIUM",
  "failOnSeverity": "HIGH",
  "disabledRules": [
    "STYLE001_NAMING_CONVENTION",
    "MAINT002_FILE_LENGTH"
  ],
  "customRules": [],
  "parallel": true,
  "maxFiles": 10000
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:

- **Property 8.1 and 8.2** are logically equivalent - both test that disabled rules don't produce violations. These will be combined into a single property.
- **Properties 1.5, 5.5, and 10.1-10.4** all test that violations contain required metadata. These can be combined into a comprehensive "violation completeness" property.
- **Properties 4.1-4.4** are specific examples of security rules rather than general properties. These will be tested as examples, not properties.
- **Properties 6.3-6.5** are specific threshold examples that can be covered by the general threshold property 6.1.

### Core Properties

**Property 1: Valid severity assignment**
*For any* violation detected by the Rule Engine, the violation's severity must be exactly one of: CRITICAL, HIGH, MEDIUM, LOW, or SUGGESTION.
**Validates: Requirements 1.1**

**Property 2: Severity ordering in results**
*For any* set of violations grouped by severity, the groups must appear in descending order of importance: CRITICAL, HIGH, MEDIUM, LOW, SUGGESTION.
**Validates: Requirements 1.2**

**Property 3: Critical flagging**
*For any* violation with CRITICAL severity, the violation must be flagged for immediate attention (has immediateAttention flag set to true).
**Validates: Requirements 1.3**

**Property 4: Severity count accuracy**
*For any* set of violations, the count of violations per severity level must equal the actual number of violations at that severity level.
**Validates: Requirements 1.4**

**Property 5: Rule definition validation**
*For any* rule definition, if it is missing any required field (id, name, category, severity, or check function), then validation must reject it with a clear error message indicating which field is missing.
**Validates: Requirements 2.1, 2.3**

**Property 6: Valid rule registration**
*For any* valid rule definition, after registration, the rule must be retrievable from the registry by its ID.
**Validates: Requirements 2.2**

**Property 7: Duplicate rule prevention**
*For any* two rules with the same ID, attempting to register the second rule must fail with an error indicating the ID already exists.
**Validates: Requirements 2.4**

**Property 8: Rule merging**
*For any* set of built-in rules and custom rules, after merging, the registry must contain all rules from both sets with no duplicates.
**Validates: Requirements 2.5**

**Property 9: Valid category assignment**
*For any* rule, the rule's category must be exactly one of: Security, Testing, Architecture, Performance, Style, or Maintainability.
**Validates: Requirements 3.1**

**Property 10: Category filtering**
*For any* set of violations and a target category, filtering by that category must return only violations whose category matches the target.
**Validates: Requirements 3.3**

**Property 11: Category count accuracy**
*For any* set of violations, the count of violations per category must equal the actual number of violations in that category.
**Validates: Requirements 3.4**

**Property 12: Violation completeness**
*For any* violation, the violation must contain all required metadata: ruleId, ruleName, severity, category, message, filePath, fixSuggestion, and explanation.
**Validates: Requirements 1.5, 3.2, 4.5, 5.1, 5.5, 10.1, 10.3, 10.4**

**Property 13: Code snippet inclusion**
*For any* violation with a line number, the violation must include a code snippet showing the problematic code.
**Validates: Requirements 10.2**

**Property 14: Fix suggestion or guidance**
*For any* violation, the violation must have either a non-empty fixSuggestion field or manual remediation guidance in the explanation.
**Validates: Requirements 5.4**

**Property 15: Severity threshold filtering**
*For any* set of violations and a minimum severity threshold, filtering by that threshold must return only violations at or above that severity level in the hierarchy.
**Validates: Requirements 6.1**

**Property 16: CI/CD exit code**
*For any* rule engine execution in CI/CD mode, if violations exist at or above the failOnSeverity threshold, the exit code must be non-zero; otherwise it must be zero.
**Validates: Requirements 6.2**

**Property 17: Framework-specific rule application**
*For any* project with a detected framework, the set of executed rules must include all rules applicable to that framework.
**Validates: Requirements 7.1, 7.2, 7.5**

**Property 18: Severity adjustment by context**
*For any* rule with an adjustSeverity function, when evaluated, the final violation severity must be the result of calling adjustSeverity with the rule context.
**Validates: Requirements 7.3**

**Property 19: Disabled rules exclusion**
*For any* set of disabled rule IDs, violations from those rules must not appear in the final results.
**Validates: Requirements 8.1, 8.2**

**Property 20: Disabled rule indication**
*For any* rule in the disabled rules list, when listing all rules, that rule must be marked as disabled.
**Validates: Requirements 8.3**

**Property 21: Invalid disabled rule warning**
*For any* disabled rule ID that doesn't exist in the registry, the engine must emit a warning but continue execution without failing.
**Validates: Requirements 8.5**

**Property 22: Error resilience**
*For any* repository where some files cause rule evaluation errors, the engine must continue processing remaining files and report violations from successfully processed files.
**Validates: Requirements 9.4**

**Property 23: Binary and node_modules exclusion**
*For any* repository containing binary files or node_modules directories, those files must not be processed by the rule engine.
**Validates: Requirements 9.5**

**Property 24: Output format validity**
*For any* set of violations, formatting as CLI output must produce human-readable text, and formatting as JSON must produce valid, parseable JSON.
**Validates: Requirements 10.5**



## Error Handling

### Error Categories

1. **Rule Definition Errors**
   - Missing required fields
   - Invalid severity or category values
   - Duplicate rule IDs
   - Invalid check function
   
   **Handling**: Reject rule registration, provide clear error message, continue with other rules

2. **Rule Execution Errors**
   - Exception thrown during rule check
   - File read errors
   - AST parsing failures
   
   **Handling**: Log error, skip problematic file/rule, continue with remaining files

3. **Configuration Errors**
   - Invalid config file format
   - Invalid severity threshold
   - Non-existent disabled rule IDs
   
   **Handling**: Use defaults, warn user, continue execution

4. **System Errors**
   - Out of memory
   - File system errors
   - Permission denied
   
   **Handling**: Fail gracefully with clear error message, provide partial results if available

### Error Recovery Strategy

```typescript
// Graceful degradation example
async function executeRule(rule: Rule, context: RuleContext): Promise<Violation[]> {
  try {
    return await rule.check(context);
  } catch (error) {
    console.warn(`Rule ${rule.id} failed on ${context.filePath}:`, error.message);
    
    // Return empty violations array, don't fail entire audit
    return [];
  }
}
```

### Error Reporting

All errors should include:
- Error type/category
- Affected file or rule
- Clear description of what went wrong
- Suggested remediation steps
- Stack trace (in debug mode only)

## Testing Strategy

The Rule Engine will be tested using a dual approach: unit tests for specific behaviors and property-based tests for universal correctness properties.

### Unit Testing

Unit tests will cover:

1. **Rule Registry**
   - Registering valid rules
   - Rejecting invalid rules
   - Preventing duplicate IDs
   - Retrieving rules by ID, category, framework

2. **Rule Executor**
   - Executing single rules
   - Parallel execution
   - Error handling during execution
   - Severity threshold filtering

3. **Result Formatter**
   - CLI output formatting
   - JSON output formatting
   - Grouping by severity/category/file
   - Summary generation

4. **Built-in Rules**
   - Security rules (hardcoded credentials, SQL injection, etc.)
   - Testing rules (missing tests)
   - Architecture rules (layer violations)
   - Style rules (naming conventions)

### Property-Based Testing

Property-based tests will use **fast-check** (for TypeScript/JavaScript) to verify universal properties across randomly generated inputs. Each property test will run a minimum of 100 iterations.

**Configuration**:
```typescript
import fc from 'fast-check';

// Configure for 100+ iterations
const config = { numRuns: 100 };
```

**Test Structure**:
Each property-based test must:
1. Be tagged with the property number and text from the design document
2. Generate appropriate random inputs using fast-check arbitraries
3. Execute the system under test
4. Assert the property holds

**Example**:
```typescript
describe('Rule Engine Properties', () => {
  it('Property 1: Valid severity assignment', () => {
    // **Feature: rule-engine, Property 1: Valid severity assignment**
    
    fc.assert(
      fc.property(
        fc.record({
          ruleId: fc.string(),
          message: fc.string(),
          filePath: fc.string(),
        }),
        (violationData) => {
          const violation = createViolation(violationData);
          const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SUGGESTION'];
          return validSeverities.includes(violation.severity);
        }
      ),
      config
    );
  });
});
```

### Integration Testing

Integration tests will verify:
- End-to-end audit flow (scan → execute rules → format results)
- Configuration loading from files
- MCP server integration
- CLI command integration

### Test Coverage Goals

- Unit test coverage: >80% for core components
- Property-based tests: All 24 correctness properties implemented
- Integration tests: All major user flows covered
- Security rules: 100% coverage with both valid and malicious examples

## Implementation Notes

### Performance Considerations

1. **Parallel Execution**: Use worker threads or async processing for file-level parallelism
2. **Lazy Loading**: Load AST parsers only when needed
3. **Caching**: Cache file contents and ASTs during single audit run
4. **Early Exit**: Stop processing if critical errors exceed threshold
5. **Streaming**: Process large files in chunks to avoid memory issues

### Extensibility Points

1. **Custom Rules**: Users can define rules in `.repoforge/custom-rules.ts`
2. **Rule Plugins**: Support npm packages that export rule definitions
3. **Formatters**: Allow custom output formatters
4. **Severity Adjusters**: Framework-specific severity adjustment functions

### Migration from Current System

The existing `Issue` type will be mapped to `Violation`:

```typescript
function migrateIssueToViolation(issue: Issue): Violation {
  return {
    ruleId: issue.id,
    ruleName: issue.type.toUpperCase(),
    severity: mapOldSeverity(issue.severity),
    category: inferCategory(issue.type),
    message: issue.message,
    filePath: issue.filePath,
    line: issue.line,
    column: issue.column,
    codeSnippet: extractSnippet(issue.filePath, issue.line),
    fixSuggestion: issue.suggestion || 'No automated fix available',
    explanation: generateExplanation(issue)
  };
}
```

Existing audit functions will be refactored into rules:
- `auditGhosts()` → `GHOST_MISSING_TEST` rule
- `auditCurses()` → Multiple curse rules (naming, file size, etc.)
- `auditZombies()` → `ZOMBIE_OUTSIDE_SRC` rule

### Framework-Specific Rules

Rules can declare framework applicability:

```typescript
const reactHookRule: Rule = {
  id: 'REACT001_ASYNC_USEEFFECT',
  name: 'Async useEffect',
  category: 'Architecture',
  severity: 'HIGH',
  description: 'Detects async functions directly in useEffect',
  frameworks: ['react', 'next'],
  
  check: (context) => {
    // Only runs on React/Next.js projects
    // ...
  }
};
```

### Configuration Precedence

Configuration is loaded in this order (later overrides earlier):
1. Default configuration (hardcoded)
2. Global config (`~/.repoforge/rules.json`)
3. Project config (`.repoforge/rules.json`)
4. CLI flags (`--min-severity=HIGH`)

## Future Enhancements

1. **Auto-fix Engine**: Automatically apply fixes for certain violations
2. **Rule Marketplace**: Share and download community rules
3. **Machine Learning**: Learn from user feedback to adjust severities
4. **IDE Integration**: Real-time rule evaluation in editors
5. **Custom Severity Levels**: Allow teams to define their own severity hierarchy
6. **Rule Dependencies**: Rules that depend on other rules' results
7. **Incremental Audits**: Only check changed files in git diff
8. **Rule Performance Metrics**: Track which rules are slowest
