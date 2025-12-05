# Configuration Examples

This guide provides sample `.repoforge/rules.json` configuration files for common use cases. Use these as starting points for your own configuration.

## Table of Contents

- [Configuration Options Reference](#configuration-options-reference)
- [Basic Examples](#basic-examples)
- [CI/CD Examples](#cicd-examples)
- [Team Standards Examples](#team-standards-examples)
- [Framework-Specific Examples](#framework-specific-examples)
- [Advanced Examples](#advanced-examples)

## Configuration Options Reference

### Complete Configuration Schema

```json
{
  "minSeverity": "MEDIUM",
  "failOnSeverity": "HIGH",
  "disabledRules": ["RULE_ID_1", "RULE_ID_2"],
  "customRules": "./path/to/custom-rules.ts",
  "parallel": true,
  "maxFiles": 10000,
  "categories": ["Security", "Testing"],
  "excludePatterns": ["*.test.ts", "dist/**"]
}
```

### Option Descriptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `minSeverity` | `Severity` | `SUGGESTION` | Minimum severity to report. Filters out lower severities. |
| `failOnSeverity` | `Severity` | `null` | Exit with non-zero code if violations at or above this severity exist. |
| `disabledRules` | `string[]` | `[]` | Array of rule IDs to disable. |
| `customRules` | `string` | `null` | Path to custom rules file. |
| `parallel` | `boolean` | `true` | Enable parallel file processing. |
| `maxFiles` | `number` | `10000` | Maximum number of files to process. |
| `categories` | `RuleCategory[]` | `null` | Only run rules in these categories. |
| `excludePatterns` | `string[]` | `[]` | Glob patterns for files to exclude. |

### Severity Levels

From highest to lowest priority:
1. `CRITICAL` - Security vulnerabilities, data loss risks
2. `HIGH` - Significant bugs, major architectural issues
3. `MEDIUM` - Code quality issues, maintainability concerns
4. `LOW` - Minor style issues, minor improvements
5. `SUGGESTION` - Optional improvements, best practices

### Rule Categories

- `Security` - Security vulnerabilities and risks
- `Testing` - Test coverage and quality
- `Architecture` - Code organization and structure
- `Performance` - Performance issues
- `Style` - Code formatting and conventions
- `Maintainability` - Code quality and maintainability

## Basic Examples

### Example 1: Default Configuration (Report Everything)

```json
{
  "minSeverity": "SUGGESTION",
  "parallel": true
}
```

**Use case:** Initial audit to see all issues.

**Behavior:**
- Reports all violations from CRITICAL to SUGGESTION
- Runs in parallel for better performance
- Does not fail CI/CD (no `failOnSeverity` set)

---

### Example 2: Focus on Important Issues

```json
{
  "minSeverity": "MEDIUM",
  "parallel": true
}
```

**Use case:** Daily development workflow, filter out noise.

**Behavior:**
- Only reports CRITICAL, HIGH, and MEDIUM violations
- Ignores LOW and SUGGESTION
- Good for focusing on actionable issues

---

### Example 3: Security-Only Audit

```json
{
  "categories": ["Security"],
  "minSeverity": "LOW",
  "parallel": true
}
```

**Use case:** Security-focused audit before deployment.

**Behavior:**
- Only runs Security category rules
- Reports all security issues regardless of severity
- Ignores other categories

---

### Example 4: Disable Specific Rules

```json
{
  "minSeverity": "MEDIUM",
  "disabledRules": [
    "STYLE001_NAMING_CONVENTION",
    "MAINT002_FILE_LENGTH",
    "TEST001_MISSING_ASSERTIONS"
  ]
}
```

**Use case:** Team disagrees with certain rules.

**Behavior:**
- Disables specific rules by ID
- All other rules run normally
- Useful for legacy codebases

## CI/CD Examples

### Example 5: Strict CI/CD (Block on High Severity)

```json
{
  "minSeverity": "MEDIUM",
  "failOnSeverity": "HIGH",
  "parallel": true
}
```

**Use case:** Production deployment pipeline.

**Behavior:**
- Reports MEDIUM, HIGH, and CRITICAL violations
- Fails build if HIGH or CRITICAL violations exist
- Allows MEDIUM violations (warnings only)

**CLI usage:**
```bash
repoforge audit
# Exit code 1 if HIGH or CRITICAL violations found
```

---

### Example 6: Critical-Only CI/CD

```json
{
  "minSeverity": "CRITICAL",
  "failOnSeverity": "CRITICAL",
  "parallel": true
}
```

**Use case:** Hotfix or emergency deployment.

**Behavior:**
- Only reports CRITICAL violations
- Only fails on CRITICAL violations
- Allows all other issues to pass

---

### Example 7: Security Gate

```json
{
  "categories": ["Security"],
  "failOnSeverity": "HIGH",
  "parallel": true
}
```

**Use case:** Security-focused CI/CD gate.

**Behavior:**
- Only runs security rules
- Fails on HIGH or CRITICAL security issues
- Ignores other categories

---

### Example 8: Progressive CI/CD

```json
{
  "minSeverity": "LOW",
  "failOnSeverity": "CRITICAL",
  "parallel": true
}
```

**Use case:** Gradual improvement strategy.

**Behavior:**
- Reports all violations (visibility)
- Only fails on CRITICAL (strict gate)
- Team can see all issues but build only fails on critical ones

## Team Standards Examples

### Example 9: Strict Team Standards

```json
{
  "minSeverity": "LOW",
  "failOnSeverity": "MEDIUM",
  "disabledRules": [],
  "parallel": true
}
```

**Use case:** High-quality codebase with strict standards.

**Behavior:**
- Reports everything except SUGGESTION
- Fails on MEDIUM or higher
- No disabled rules (all standards enforced)

---

### Example 10: Relaxed Team Standards

```json
{
  "minSeverity": "HIGH",
  "failOnSeverity": "CRITICAL",
  "disabledRules": [
    "STYLE001_NAMING_CONVENTION",
    "STYLE002_FILE_NAMING",
    "MAINT001_EXCESSIVE_COMPLEXITY"
  ],
  "parallel": true
}
```

**Use case:** Fast-moving startup, focus on critical issues.

**Behavior:**
- Only reports HIGH and CRITICAL
- Only fails on CRITICAL
- Disables style and some maintainability rules

---

### Example 11: Testing-Focused Standards

```json
{
  "categories": ["Testing", "Security"],
  "minSeverity": "MEDIUM",
  "failOnSeverity": "HIGH",
  "parallel": true
}
```

**Use case:** Team prioritizing test coverage and security.

**Behavior:**
- Only runs Testing and Security rules
- Reports MEDIUM and above
- Fails on HIGH and CRITICAL

---

### Example 12: Architecture-Focused Standards

```json
{
  "categories": ["Architecture", "Maintainability"],
  "minSeverity": "MEDIUM",
  "disabledRules": ["MAINT002_FILE_LENGTH"],
  "parallel": true
}
```

**Use case:** Refactoring project, focus on structure.

**Behavior:**
- Only runs Architecture and Maintainability rules
- Allows large files (disabled MAINT002)
- Focus on structural improvements

## Framework-Specific Examples

### Example 13: React Project

```json
{
  "minSeverity": "MEDIUM",
  "failOnSeverity": "HIGH",
  "disabledRules": [
    "ZOMBIE_OUTSIDE_SRC"
  ],
  "parallel": true
}
```

**Use case:** React application with Next.js.

**Behavior:**
- Runs React-specific rules automatically
- Disables zombie detection (Next.js has special directories)
- Standard severity thresholds

---

### Example 14: Node.js Backend

```json
{
  "minSeverity": "MEDIUM",
  "failOnSeverity": "HIGH",
  "categories": ["Security", "Architecture", "Testing"],
  "parallel": true
}
```

**Use case:** Express/Fastify API server.

**Behavior:**
- Focuses on backend concerns
- Runs Node.js-specific rules
- Emphasizes security and architecture

---

### Example 15: Fullstack Project

```json
{
  "minSeverity": "MEDIUM",
  "failOnSeverity": "HIGH",
  "excludePatterns": [
    "client/build/**",
    "server/dist/**"
  ],
  "parallel": true
}
```

**Use case:** Monorepo with frontend and backend.

**Behavior:**
- Runs both frontend and backend rules
- Excludes build directories
- Standard thresholds

## Advanced Examples

### Example 16: Custom Rules Integration

```json
{
  "minSeverity": "MEDIUM",
  "failOnSeverity": "HIGH",
  "customRules": "./.repoforge/custom-rules.ts",
  "parallel": true
}
```

**Custom rules file (`.repoforge/custom-rules.ts`):**

```typescript
import { Rule } from 'repoforge';

export const customRules: Rule[] = [
  {
    id: 'CUSTOM001_NO_CONSOLE',
    name: 'No Console Statements',
    category: 'Style',
    severity: 'LOW',
    description: 'Detects console.log statements',
    check: (context) => {
      const violations = [];
      const pattern = /console\.(log|warn|error|debug)/g;
      const matches = context.fileContent.matchAll(pattern);
      
      for (const match of matches) {
        violations.push({
          ruleId: 'CUSTOM001_NO_CONSOLE',
          ruleName: 'No Console Statements',
          severity: 'LOW',
          category: 'Style',
          message: 'Console statement found',
          filePath: context.filePath,
          fixSuggestion: 'Use a proper logging library',
          explanation: 'Console statements should not be in production code'
        });
      }
      
      return violations;
    }
  }
];
```

---

### Example 17: Performance Optimization

```json
{
  "minSeverity": "MEDIUM",
  "parallel": true,
  "maxFiles": 5000,
  "excludePatterns": [
    "node_modules/**",
    "dist/**",
    "build/**",
    "*.test.ts",
    "*.spec.ts"
  ]
}
```

**Use case:** Large codebase, optimize audit speed.

**Behavior:**
- Limits to 5000 files
- Excludes test files and build artifacts
- Parallel processing enabled

---

### Example 18: Gradual Adoption

```json
{
  "minSeverity": "CRITICAL",
  "failOnSeverity": "CRITICAL",
  "disabledRules": [
    "GHOST_MISSING_TEST",
    "CURSE_NAMING_COMPONENT",
    "CURSE_NAMING_SERVICE",
    "MAINT001_EXCESSIVE_COMPLEXITY"
  ],
  "parallel": true
}
```

**Use case:** Legacy codebase, start with critical issues only.

**Behavior:**
- Only reports CRITICAL violations
- Disables rules that would have too many violations
- Gradually enable rules as codebase improves

**Migration path:**
1. Week 1-2: Fix all CRITICAL issues
2. Week 3-4: Enable HIGH severity (`minSeverity: "HIGH"`)
3. Week 5-6: Enable one disabled rule at a time
4. Month 2+: Gradually tighten standards

---

### Example 19: Pre-commit Hook

```json
{
  "minSeverity": "HIGH",
  "failOnSeverity": "HIGH",
  "parallel": true,
  "maxFiles": 1000
}
```

**Use case:** Fast pre-commit validation.

**Behavior:**
- Only checks HIGH and CRITICAL
- Fails fast on serious issues
- Limits file count for speed

**Git hook (`.git/hooks/pre-commit`):**
```bash
#!/bin/bash
repoforge audit --config .repoforge/rules.json
```

---

### Example 20: Multi-Environment Configuration

**Development (`.repoforge/rules.dev.json`):**
```json
{
  "minSeverity": "SUGGESTION",
  "parallel": true
}
```

**Staging (`.repoforge/rules.staging.json`):**
```json
{
  "minSeverity": "MEDIUM",
  "failOnSeverity": "HIGH",
  "parallel": true
}
```

**Production (`.repoforge/rules.prod.json`):**
```json
{
  "minSeverity": "MEDIUM",
  "failOnSeverity": "CRITICAL",
  "categories": ["Security"],
  "parallel": true
}
```

**Usage:**
```bash
# Development
repoforge audit --config .repoforge/rules.dev.json

# Staging
repoforge audit --config .repoforge/rules.staging.json

# Production
repoforge audit --config .repoforge/rules.prod.json
```

## CLI Flag Overrides

Configuration files can be overridden with CLI flags:

```bash
# Override minimum severity
repoforge audit --min-severity HIGH

# Override fail threshold
repoforge audit --fail-on-severity CRITICAL

# Disable specific rules
repoforge audit --disable-rule STYLE001_NAMING_CONVENTION

# Combine multiple overrides
repoforge audit --min-severity MEDIUM --fail-on-severity HIGH --disable-rule TEST001
```

**Precedence order (highest to lowest):**
1. CLI flags
2. Project config (`.repoforge/rules.json`)
3. Global config (`~/.repoforge/rules.json`)
4. Default values

## Configuration Best Practices

### 1. Start Strict, Relax as Needed
```json
{
  "minSeverity": "LOW",
  "failOnSeverity": "MEDIUM"
}
```
Better to see all issues and disable specific rules than miss important problems.

### 2. Use Categories for Focus
```json
{
  "categories": ["Security", "Testing"]
}
```
Focus audits on specific concerns rather than disabling many individual rules.

### 3. Document Your Choices
```json
{
  "minSeverity": "MEDIUM",
  "disabledRules": [
    "STYLE001_NAMING_CONVENTION"  // Team uses different convention
  ]
}
```
Add comments explaining why rules are disabled.

### 4. Different Configs for Different Contexts
- `rules.dev.json` - Permissive, show everything
- `rules.ci.json` - Strict, fail on important issues
- `rules.security.json` - Security-only audit

### 5. Review Disabled Rules Regularly
```json
{
  "disabledRules": [
    "MAINT001_EXCESSIVE_COMPLEXITY"  // TODO: Re-enable after refactor
  ]
}
```
Periodically review and try to re-enable rules as code improves.

### 6. Use Parallel Processing
```json
{
  "parallel": true
}
```
Always enable unless you have specific reasons not to.

### 7. Exclude Build Artifacts
```json
{
  "excludePatterns": [
    "dist/**",
    "build/**",
    "*.min.js"
  ]
}
```
Don't waste time auditing generated code.

## Troubleshooting

### Too Many Violations
**Problem:** Audit reports thousands of violations.

**Solutions:**
1. Increase `minSeverity` to focus on important issues
2. Use `categories` to focus on specific areas
3. Disable noisy rules temporarily
4. Use gradual adoption strategy (Example 18)

### Build Failing Too Often
**Problem:** CI/CD fails frequently on minor issues.

**Solutions:**
1. Increase `failOnSeverity` threshold
2. Disable problematic rules
3. Use progressive approach (fail on CRITICAL only)

### Audit Too Slow
**Problem:** Audit takes too long to complete.

**Solutions:**
1. Enable `parallel: true`
2. Set `maxFiles` limit
3. Use `excludePatterns` to skip unnecessary files
4. Run focused audits with `categories`

### Rules Not Running
**Problem:** Expected rules don't produce violations.

**Solutions:**
1. Check `disabledRules` list
2. Verify `minSeverity` isn't filtering them out
3. Check `categories` filter
4. Ensure framework detection is working

## Next Steps

1. Copy a relevant example to `.repoforge/rules.json`
2. Run `repoforge audit` to test your configuration
3. Adjust based on results
4. Read the [Rule Authoring Guide](./RULE_AUTHORING_GUIDE.md) to create custom rules
5. Set up CI/CD integration with appropriate thresholds

## Additional Resources

- [Rule Authoring Guide](./RULE_AUTHORING_GUIDE.md) - Create custom rules
- [Rule Engine Design](../.kiro/specs/rule-engine/design.md) - Architecture details
- [Requirements Document](../.kiro/specs/rule-engine/requirements.md) - Feature requirements
- [Main README](../README.md) - General RepoForge documentation

