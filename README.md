# 🎃 RepoForge

**Smart repository auditor for JavaScript/TypeScript projects**

RepoForge automatically detects your project type (React, Next.js, Express, etc.) and runs intelligent audits to find:
- 👻 **Ghosts** - Files missing test coverage
- 🧿 **Curses** - Structural issues (naming, monolithic files, mixed layers)
- 🧟 **Zombies** - Code in wrong places (framework-aware detection)

## ✨ Features

### Core Capabilities
- 🔍 **Smart Detection** - Automatically identifies 15+ frameworks and project types
- 🎯 **Context-Aware** - Understands Next.js, Nuxt, Express, React, and more
- 📖 **Human-Friendly** - Explains your project structure in plain language
- 🏗️ **Architecture Analysis** - Detects MVC, Layered, Clean Architecture patterns
- 💡 **Smart Recommendations** - Actionable advice based on your stack
- 🚀 **Zero Config** - Just run it, no setup needed

### Advanced Features
- 🤖 **AI Code Generation** - Generate components, pages, APIs from natural language
- 🔬 **Deep Code Analysis** - Detect complexity, unused code, broken imports, security issues
- 📋 **Manifest Generation** - Machine-readable repository documentation (JSON/YAML)
- 🎨 **Naming Convention Enforcement** - camelCase, PascalCase, kebab-case, snake_case detection
- 🔗 **Dependency Analysis** - Track imports, exports, and dead code
- 🛡️ **Security Scanning** - Find hardcoded credentials and vulnerabilities

### Rule Engine (NEW!)
- ⚡ **Severity Levels** - Prioritize issues from CRITICAL to SUGGESTION
- 🎛️ **Configurable Rules** - Enable/disable rules, set thresholds, customize behavior
- 🔧 **Custom Rules** - Write your own rules for team-specific standards
- 🚦 **CI/CD Integration** - Fail builds on critical issues, pass on minor ones
- 📊 **Smart Filtering** - Filter by severity, category, or framework
- 🎯 **Framework-Aware** - Rules adapt to React, Node.js, and other frameworks

## � Gettaing Started (No API Keys Required!)

RepoForge is a **100% local tool** - no API keys, no sign-ups, no external services needed. Just install and run!

### Quick Start (3 Steps)

```bash
# 1. Install globally
npm install -g repoforge

# 2. Navigate to your project
cd /path/to/your/project

# 3. Run your first audit
repoforge audit
```

That's it! RepoForge will analyze your code and show you issues with severity levels.

## 📦 Installation Options

### Option 1: Global Installation (Recommended)
Install once, use anywhere:
```bash
npm install -g repoforge

# Now use in any project
cd /path/to/your/project
repoforge audit
```

### Option 2: Run Without Installing (npx)
No installation needed:
```bash
# Just run it directly
npx repoforge audit
npx repoforge map
npx repoforge generate "user login page"
```

### Option 3: Local Project Installation
Add to your project:
```bash
npm install --save-dev repoforge

# Add to package.json scripts
{
  "scripts": {
    "audit": "repoforge audit",
    "audit:deep": "repoforge audit --deep"
  }
}

# Run via npm
npm run audit
```

## � QCommon Use Cases

```bash
# Basic audit - find ghosts, curses, and zombies
repoforge audit

# Deep audit - includes code quality, security, complexity
repoforge audit --deep

# Show only critical issues
repoforge audit --min-severity CRITICAL

# Fail CI/CD on high severity issues
repoforge audit --fail-on-severity HIGH

# Get project overview and architecture
repoforge map

# Generate code with AI
repoforge generate "homepage for mobile shop"

# Create repository manifest
repoforge manifest --json
```

## 🚀 Usage

### 1. Quick Audit (Structure Only)
```bash
repoforge audit
```

Fast structural analysis showing:
- Project type and frameworks detected
- Missing tests (ghosts)
- Structural issues (curses)
- Misplaced code (zombies)
- Smart recommendations

### 2. Deep Audit (Structure + Code Quality)
```bash
repoforge audit --deep
```

Comprehensive analysis including:
- All structural checks
- Code complexity analysis
- Unused code detection
- Broken import detection
- Security vulnerability scanning
- Naming convention violations
- Console.log detection
- Empty catch blocks
- Hardcoded credentials

### 3. Audit with Severity Filtering
```bash
# Show only critical and high severity issues
repoforge audit --min-severity HIGH

# Fail CI/CD on critical issues only
repoforge audit --fail-on-severity CRITICAL

# Show only security issues
repoforge audit --category Security

# Disable specific rules
repoforge audit --disable-rule STYLE001_NAMING_CONVENTION
```

**Severity Levels:**
- 🔴 **CRITICAL** - Security vulnerabilities, data loss risks (fix immediately)
- 🟠 **HIGH** - Significant bugs, major architectural issues (fix before release)
- 🟡 **MEDIUM** - Code quality issues, maintainability concerns (fix in sprint)
- 🟢 **LOW** - Minor style issues, minor improvements (fix when convenient)
- 🔵 **SUGGESTION** - Optional improvements, best practices (team decides)

**Example Output:**
```
🔍 Audit Results

🔴 CRITICAL (2)
  SEC001_HARDCODED_CREDENTIALS
    src/config.ts:12 - Hardcoded API key detected
    Fix: Move credentials to environment variables

  SEC002_SQL_INJECTION
    src/db/queries.ts:45 - Unsafe SQL query construction
    Fix: Use parameterized queries

🟠 HIGH (5)
  ARCH001_CIRCULAR_DEPENDENCY
    src/services/user.ts - Circular dependency detected
    Fix: Refactor to remove circular dependency

🟡 MEDIUM (12)
  TEST001_MISSING_TEST
    src/utils/validator.ts - No test file found
    Fix: Create src/utils/validator.test.ts

📊 Summary: 19 violations (2 critical, 5 high, 12 medium)
```

### 4. AI Code Generation
```bash
repoforge generate "homepage for mobile shop"
repoforge generate "user authentication API"
repoforge generate "product card component"
```

Generates production-ready code with:
- Framework-aware structure
- Proper file organization
- Test files included
- TypeScript support
- Best practices applied

### 5. Repository Map & Flow Analysis
```bash
repoforge map
```

Shows comprehensive overview:
- Project explanation in plain language
- Technical stack details
- Architecture and code flow
- Entry points and API endpoints
- Directory structure
- Health check and recommendations

### 6. Generate Manifest
```bash
repoforge manifest --json   # JSON format (default)
repoforge manifest --yaml   # YAML format
```

Creates machine-readable documentation:
- Complete repository metadata
- Language statistics
- Module dependencies
- Export/import analysis
- Quality metrics
- Documentation status

### 7. Initialize Project Skeleton
```bash
repoforge init
```

Creates clean project structure:
- Standard folders (src, tests, etc.)
- Entrypoint with basic HTTP server
- Health check route and tests

### 8. Configure Rule Engine

Create `.repoforge/rules.json` to customize rule behavior:

```json
{
  "minSeverity": "MEDIUM",
  "failOnSeverity": "HIGH",
  "disabledRules": ["STYLE001_NAMING_CONVENTION"],
  "parallel": true
}
```

**Common Configurations:**

**Strict CI/CD:**
```json
{
  "minSeverity": "MEDIUM",
  "failOnSeverity": "HIGH"
}
```

**Security-Only Audit:**
```json
{
  "categories": ["Security"],
  "failOnSeverity": "HIGH"
}
```

**Gradual Adoption:**
```json
{
  "minSeverity": "CRITICAL",
  "failOnSeverity": "CRITICAL"
}
```

See [Configuration Examples](./docs/CONFIGURATION_EXAMPLES.md) for more use cases.

### 9. Show Help
```bash
repoforge help
```

## 📊 What It Detects

### Frameworks (15+)
- **Frontend**: React, Next.js, Vue, Nuxt, Angular, Svelte
- **Backend**: Express, Fastify, NestJS
- **Build Tools**: Vite, Webpack

### Project Types
- Frontend applications
- Backend services
- Fullstack apps
- Libraries/packages
- Monorepos
- CLI tools

### Architecture Patterns
- MVC (Model-View-Controller)
- Layered Architecture
- Clean Architecture
- Modular/Feature-based
- Flat structure

### Code Quality Issues
- **Complexity**: High cyclomatic complexity functions
- **Coupling**: Excessive imports (tight coupling)
- **Dead Code**: Unused variables, functions, and files
- **Broken Links**: Invalid import paths
- **Security**: Hardcoded credentials, API keys, secrets
- **Best Practices**: console.log in production, empty catch blocks
- **Technical Debt**: Excessive TODO/FIXME comments
- **Type Safety**: Excessive 'any' types in TypeScript

### Naming Conventions
- **camelCase**: Services, utilities, functions
- **PascalCase**: Components, classes, types
- **kebab-case**: File names (alternative)
- **snake_case**: Detection and warnings

## 🎯 Example Output

```
📖 What is this project?
   This is a frontend application - it runs in the browser and handles 
   the user interface. It uses React, Next.js as the main frameworks. 
   Code uses modular architecture - organized by features. The project 
   uses TypeScript for type safety, has test coverage.

📊 Technical Details:
   Type: frontend
   Frameworks: react, next
   Architecture: modular
   TypeScript: ✅
   Tests: ✅
   Package Manager: npm
   Detection Confidence: 95%

🔍 Found 3 issue(s):
   👻 Ghosts: 2
   🧿 Curses: 1
   🧟 Zombies: 0

💡 Smart Recommendations:
   🧪 Add tests for critical business logic and API endpoints
   🏗️ Consider splitting large components into smaller, focused modules
```

## 🔧 MCP Server Integration

RepoForge includes an MCP server for integration with AI coding assistants like Kiro IDE:

### Tools Available:
- `repoforge_audit_repo` - Full detailed audit with smart recommendations
- `repoforge_audit_summary` - Quick health check summary
- `repoforge_generate_code` - AI-powered code generation from prompts
- `repoforge_generate_manifest` - Generate repository manifest (JSON/YAML)

### Setup in Kiro IDE:
1. Add to `.kiro/settings/mcp.json`:
```json
{
  "mcpServers": {
    "repoforge": {
      "command": "node",
      "args": ["path/to/repoforge/dist/mcp-server/index.js"]
    }
  }
}
```

2. Restart Kiro or reconnect MCP servers

3. Use in chat:
   - "Audit this repository"
   - "Generate a user login page"
   - "Create a manifest for this project"

## 🔧 Custom Rules

Create your own rules to enforce team-specific standards:

```typescript
// .repoforge/custom-rules.ts
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
      const pattern = /console\.(log|warn|error)/g;
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

Reference in `.repoforge/rules.json`:
```json
{
  "customRules": "./.repoforge/custom-rules.ts"
}
```

See the [Rule Authoring Guide](./docs/RULE_AUTHORING_GUIDE.md) for detailed instructions and examples.

## 🚦 CI/CD Integration

Integrate RepoForge into your CI/CD pipeline to enforce code quality standards:

### GitHub Actions

```yaml
name: Code Quality
on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g repoforge
      - run: repoforge audit --fail-on-severity HIGH
```

### GitLab CI

```yaml
code_quality:
  stage: test
  script:
    - npm install -g repoforge
    - repoforge audit --fail-on-severity HIGH
```

### Jenkins

```groovy
stage('Code Quality') {
  steps {
    sh 'npm install -g repoforge'
    sh 'repoforge audit --fail-on-severity HIGH'
  }
}
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit
repoforge audit --min-severity HIGH --fail-on-severity CRITICAL
```

## 📚 Documentation

- **[Rule Authoring Guide](./docs/RULE_AUTHORING_GUIDE.md)** - Create custom rules for your team
- **[Configuration Examples](./docs/CONFIGURATION_EXAMPLES.md)** - Sample configurations for common use cases
- **[Rule Engine Design](./kiro/specs/rule-engine/design.md)** - Architecture and technical details

## 🎃 Why "Spooky" Themes?

Built for the Kiroween hackathon! The spooky terminology makes code quality issues memorable:
- **Ghosts** haunt your repo when tests are missing
- **Curses** plague your code with structural problems
- **Zombies** shamble around outside their proper directories

## ❓ FAQ

### Do I need API keys or external services?
**No!** RepoForge runs 100% locally on your machine. No API keys, no sign-ups, no external dependencies. The "API keys" you see in test files are fake examples used to verify that RepoForge can detect hardcoded secrets in *other people's code*.

### Does it work offline?
**Yes!** RepoForge is a static analysis tool that works completely offline.

### What languages does it support?
Currently JavaScript and TypeScript. Support for more languages coming soon!

### Can I use it in CI/CD?
**Absolutely!** RepoForge is designed for CI/CD integration. Use `--fail-on-severity` to control when builds should fail.

### How do I write custom rules?
See the [Rule Authoring Guide](./docs/RULE_AUTHORING_GUIDE.md) for detailed instructions on creating custom rules for your team.

### Is it free?
**Yes!** RepoForge is open source and completely free to use.

## 📝 License

ISC

## 🤝 Contributing

Issues and pull requests welcome!

## 🏆 Hackathon Project

Created for Kiroween 2024 - Frankenstein Category
