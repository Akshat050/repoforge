# 🎃 RepoForge

<div align="center">

[![NPM Version](https://img.shields.io/npm/v/repoforge?style=for-the-badge&logo=npm&color=CB3837)](https://www.npmjs.com/package/repoforge)
[![License](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

**🔍 Smart Repository Auditor for JavaScript/TypeScript Projects**

*Find ghosts 👻, curses 🧿, and zombies 🧟 in your codebase*

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [MCP Integration](#-mcp-server-integration)

</div>

---

## 🌟 What is RepoForge?

RepoForge is an intelligent code auditing tool that automatically detects your project type and runs framework-aware analysis to identify quality issues. No configuration needed—just run it!

### 🎯 Key Capabilities

<table>
<tr>
<td width="33%">

#### 🔍 **Smart Detection**
Automatically identifies 15+ frameworks including React, Next.js, Vue, Express, and more

</td>
<td width="33%">

#### 🎯 **Context-Aware**
Understands your framework's conventions and architecture patterns

</td>
<td width="33%">

#### 💡 **Actionable Insights**
Provides clear explanations and fix recommendations

</td>
</tr>
</table>

### 🎃 What Does It Find?

- **👻 Ghosts** - Files missing test coverage
- **🧿 Curses** - Structural issues (naming, monolithic files, mixed layers)
- **🧟 Zombies** - Code in wrong places (framework-aware detection)

---

## ✨ Features

### 🚀 Core Capabilities

```bash
✅ Zero Configuration      # Just install and run
✅ 15+ Framework Support   # React, Next.js, Vue, Express, etc.
✅ Architecture Analysis   # MVC, Layered, Clean Architecture
✅ Human-Friendly Output   # Plain language explanations
✅ 100% Local             # No API keys or external services
```

### 🔬 Advanced Analysis

| Feature | Description |
|---------|-------------|
| **🤖 AI Code Generation** | Generate components, pages, APIs from natural language |
| **🔍 Deep Code Analysis** | Detect complexity, unused code, broken imports |
| **📋 Manifest Generation** | Machine-readable repository documentation (JSON/YAML) |
| **🎨 Naming Conventions** | Enforce camelCase, PascalCase, kebab-case standards |
| **🔗 Dependency Tracking** | Track imports, exports, and dead code |
| **🛡️ Security Scanning** | Find hardcoded credentials and vulnerabilities |

### ⚡ Rule Engine

<details>
<summary><b>🎛️ Configurable Rules System</b> (Click to expand)</summary>

- **Severity Levels**: CRITICAL → HIGH → MEDIUM → LOW → SUGGESTION
- **Custom Rules**: Write team-specific validation rules
- **CI/CD Ready**: Fail builds on critical issues
- **Framework-Aware**: Rules adapt to your tech stack
- **Smart Filtering**: Filter by severity, category, or framework

</details>

---

## 🚀 Quick Start

### Installation (Choose One)

<table>
<tr>
<td>

#### 🌍 **Global Install** (Recommended)
```bash
npm install -g repoforge
cd /path/to/your/project
repoforge audit
```

</td>
<td>

#### ⚡ **Run Without Installing**
```bash
npx repoforge audit
npx repoforge map
npx repoforge generate "login page"
```

</td>
</tr>
</table>

### 🎯 Basic Usage

```bash
# Quick structural audit
repoforge audit

# Deep audit with code quality checks
repoforge audit --deep

# Show only critical issues
repoforge audit --min-severity CRITICAL

# Fail CI/CD on high severity issues
repoforge audit --fail-on-severity HIGH

# Get project overview
repoforge map

# Generate code with AI
repoforge generate "user authentication API"
```

---

## 📊 Example Output

```bash
📖 What is this project?
   This is a frontend application built with React and Next.js.
   It uses modular architecture organized by features.
   TypeScript ✅  |  Tests ✅  |  Package Manager: npm
   
🔍 Audit Results

🔴 CRITICAL (2)
  ├─ SEC001_HARDCODED_CREDENTIALS
  │  └─ src/config.ts:12 - Hardcoded API key detected
  │     💡 Fix: Move credentials to environment variables
  │
  └─ SEC002_SQL_INJECTION
     └─ src/db/queries.ts:45 - Unsafe SQL query construction
        💡 Fix: Use parameterized queries

🟠 HIGH (5)
  └─ ARCH001_CIRCULAR_DEPENDENCY
     └─ src/services/user.ts - Circular dependency detected
        💡 Fix: Refactor to remove circular dependency

🟡 MEDIUM (12)
  └─ TEST001_MISSING_TEST
     └─ src/utils/validator.ts - No test file found
        💡 Fix: Create src/utils/validator.test.ts

📊 Summary: 19 violations (2 critical, 5 high, 12 medium)
```

---

## 🎨 What It Detects

### 🛠️ Supported Frameworks (15+)

<table>
<tr>
<td width="50%">

**Frontend**
- ⚛️ React
- 🚀 Next.js
- 💚 Vue.js
- 🌊 Nuxt.js
- 🔺 Angular
- 🔥 Svelte

</td>
<td width="50%">

**Backend**
- 🚂 Express.js
- ⚡ Fastify
- 🦅 NestJS
- 🌐 Node.js

**Build Tools**
- ⚡ Vite
- 📦 Webpack

</td>
</tr>
</table>

### 🏗️ Architecture Patterns

```
✅ MVC (Model-View-Controller)
✅ Layered Architecture
✅ Clean Architecture  
✅ Modular/Feature-based
✅ Flat Structure
```

### 🔍 Code Quality Issues

| Category | Issues Detected |
|----------|-----------------|
| **🔴 Security** | Hardcoded credentials, API keys, SQL injection |
| **📐 Complexity** | High cyclomatic complexity, tight coupling |
| **💀 Dead Code** | Unused variables, functions, files |
| **🔗 Dependencies** | Broken imports, circular dependencies |
| **🎨 Style** | Naming conventions, console.log statements |
| **📝 Best Practices** | Empty catch blocks, excessive TODOs |
| **🔒 Type Safety** | Excessive 'any' types in TypeScript |

---

## 🔧 Advanced Features

### 🤖 AI Code Generation

Generate production-ready code from natural language:

```bash
repoforge generate "homepage for mobile shop"
repoforge generate "REST API for user management"
repoforge generate "product card component with TypeScript"
```

**Generated Code Includes:**
- ✅ Framework-aware structure
- ✅ Proper file organization
- ✅ Test files included
- ✅ TypeScript support
- ✅ Best practices applied

### ⚙️ Configuration System

Create `.repoforge/rules.json` to customize behavior:

```json
{
  "minSeverity": "MEDIUM",
  "failOnSeverity": "HIGH",
  "disabledRules": ["STYLE001_NAMING_CONVENTION"],
  "categories": ["Security", "Architecture"],
  "parallel": true
}
```

**Common Configurations:**

<details>
<summary><b>🔒 Strict CI/CD</b></summary>

```json
{
  "minSeverity": "MEDIUM",
  "failOnSeverity": "HIGH"
}
```
</details>

<details>
<summary><b>🛡️ Security-Only Audit</b></summary>

```json
{
  "categories": ["Security"],
  "failOnSeverity": "HIGH"
}
```
</details>

<details>
<summary><b>🎯 Gradual Adoption</b></summary>

```json
{
  "minSeverity": "CRITICAL",
  "failOnSeverity": "CRITICAL"
}
```
</details>

### 🎨 Custom Rules

Create team-specific validation rules:

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
      // Your validation logic
      return violations;
    }
  }
];
```

📖 See the [Rule Authoring Guide](docs/RULE_AUTHORING_GUIDE.md) for detailed instructions.

---

## 🚦 CI/CD Integration

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

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit
repoforge audit --min-severity HIGH --fail-on-severity CRITICAL
```

---

## 🤖 MCP Server Integration (Kiro IDE)

RepoForge integrates seamlessly with AI coding assistants through the Model Context Protocol (MCP).

### Quick Setup with Kiro

**Automated Setup:**

```bash
# Clone and setup
git clone https://github.com/Akshat050/repoforge.git
cd repoforge
npm install

# Run setup script
# On Windows:
setup-global-mcp.bat

# On Mac/Linux:
chmod +x setup-global-mcp.sh
./setup-global-mcp.sh
```

**Manual Configuration:**

Create `~/.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "repoforge": {
      "command": "npx",
      "args": ["-y", "repoforge-mcp"]
    }
  }
}
```

### 💬 Chat with Kiro

Once configured, just talk naturally:

```
💭 "Audit this repository"
💭 "Generate a user login page"
💭 "Show me security issues"
💭 "Create a manifest for this project"
💭 "What's the health status of this codebase?"
```

📖 See **[KIRO_CHAT_PROMPTS.md](KIRO_CHAT_PROMPTS.md)** for 50+ example prompts.

### Available MCP Tools

- `repoforge_audit_repo` - Full detailed audit with recommendations
- `repoforge_audit_summary` - Quick health check summary
- `repoforge_generate_code` - AI-powered code generation
- `repoforge_generate_manifest` - Generate repository manifest

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[Rule Authoring Guide](docs/RULE_AUTHORING_GUIDE.md)** | Create custom rules for your team |
| **[Configuration Examples](docs/CONFIGURATION_EXAMPLES.md)** | Sample configurations for common use cases |
| **[Rule Engine Design](kiro/specs/rule-engine/design.md)** | Architecture and technical details |
| **[Kiro Setup Guide](KIRO_GLOBAL_SETUP.md)** | Integrate with Kiro IDE |
| **[Chat Prompts](KIRO_CHAT_PROMPTS.md)** | Example prompts for AI assistants |
| **[Troubleshooting](KIRO_TROUBLESHOOTING.md)** | Common issues and solutions |

---

## ❓ FAQ

<details>
<summary><b>Do I need API keys or external services?</b></summary>

**No!** RepoForge runs 100% locally on your machine. No API keys, no sign-ups, no external dependencies.
</details>

<details>
<summary><b>Does it work offline?</b></summary>

**Yes!** RepoForge is a static analysis tool that works completely offline.
</details>

<details>
<summary><b>What languages does it support?</b></summary>

Currently JavaScript and TypeScript. Support for more languages coming soon!
</details>

<details>
<summary><b>Can I use it in CI/CD?</b></summary>

**Absolutely!** RepoForge is designed for CI/CD integration. Use `--fail-on-severity` to control when builds should fail.
</details>

<details>
<summary><b>How do I write custom rules?</b></summary>

See the [Rule Authoring Guide](docs/RULE_AUTHORING_GUIDE.md) for detailed instructions.
</details>

<details>
<summary><b>Is it free?</b></summary>

**Yes!** RepoForge is open source and completely free to use.
</details>

---

## 🗺️ Roadmap

### 🎯 Current Focus
- [x] TypeScript/JavaScript support
- [x] Rule engine with severity levels
- [x] MCP server integration
- [x] AI code generation
- [x] CI/CD integration

### 🔮 Coming Soon
- [ ] Python support
- [ ] Multi-language monorepo support
- [ ] VSCode extension
- [ ] Web dashboard
- [ ] Team collaboration features
- [ ] Performance benchmarking

### 💡 Future Ideas
- [ ] Java/Kotlin support
- [ ] Go support
- [ ] Rust support
- [ ] Machine learning for pattern detection
- [ ] Auto-fix capabilities

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **🐛 Report Bugs** - Open an issue with reproduction steps
2. **💡 Suggest Features** - Share your ideas in discussions
3. **📝 Improve Documentation** - Fix typos, add examples
4. **🔧 Submit PRs** - Fix bugs or add features

### Development Setup

```bash
# Clone the repository
git clone https://github.com/Akshat050/repoforge.git
cd repoforge

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Link globally for testing
npm link
```

---

## 🏆 Hackathon Project

<div align="center">

**🎃 Created for Kiroween 2024 - Frankenstein Category 🎃**

*Making code quality spooky fun!*

</div>

---

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Akshat**

- GitHub: [@Akshat050](https://github.com/Akshat050)
- LinkedIn: [Connect with me](http://www.linkedin.com/in/akshat-bhatt)
- Email: akshatbhatt30@gmail.com

---

## 🙏 Acknowledgments

- Built for the Kiroween 2024 Hackathon
- Inspired by the need for better code quality tools
- Thanks to all contributors and early testers

---

<div align="center">

### 💙 If RepoForge helped you find bugs and improve your code, please give it a ⭐

**[⬆ Back to Top](#-repoforge)**

</div>
