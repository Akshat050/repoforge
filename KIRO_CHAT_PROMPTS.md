# 🤖 Kiro Chat Prompts for RepoForge

This guide shows you exactly what to say in Kiro chat to use RepoForge's MCP tools on any repository.

## 🚀 Quick Reference

| What You Want | What to Say in Kiro Chat |
|---------------|--------------------------|
| Audit any repo | "Audit this repository" |
| Quick health check | "Give me a quick audit summary" |
| Generate code | "Generate a user login page" |
| Create manifest | "Generate a manifest for this project" |
| Deep analysis | "Run a deep audit with security checks" |
| Fix issues | "Audit this repo and help me fix the critical issues" |

---

## 📋 Detailed Prompts by Use Case

### 1. Repository Auditing

#### Basic Audit
```
Audit this repository
```
or
```
Run a RepoForge audit on this project
```
or
```
Check this codebase for ghosts, curses, and zombies
```

**What it does:**
- Detects project type and frameworks
- Finds missing tests (ghosts)
- Identifies structural issues (curses)
- Locates misplaced code (zombies)
- Provides smart recommendations

---

#### Quick Health Check
```
Give me a quick audit summary
```
or
```
What's the health status of this repository?
```
or
```
Show me a quick overview of code quality issues
```

**What it does:**
- Fast summary of issue counts
- Severity breakdown
- Quick health score

---

#### Deep Audit with Security
```
Run a deep audit with security checks
```
or
```
Audit this repo and check for security vulnerabilities
```
or
```
Do a comprehensive code quality analysis
```

**What it does:**
- All basic audit checks
- Code complexity analysis
- Security vulnerability scanning
- Hardcoded credentials detection
- Unused code detection
- Naming convention checks

---

### 2. Code Generation

#### Generate Components
```
Generate a user login page
```
or
```
Create a product card component
```
or
```
Generate a dashboard layout with sidebar
```

**What it does:**
- Creates framework-appropriate code
- Includes proper file structure
- Adds TypeScript types
- Generates test files
- Follows best practices

---

#### Generate API Endpoints
```
Generate a REST API for user management
```
or
```
Create an authentication API with JWT
```
or
```
Generate CRUD endpoints for products
```

**What it does:**
- Creates backend routes
- Adds validation
- Includes error handling
- Generates tests
- Framework-aware (Express, Fastify, etc.)

---

#### Generate Full Features
```
Generate a complete blog system with posts and comments
```
or
```
Create a shopping cart feature with checkout
```
or
```
Generate an admin panel for user management
```

**What it does:**
- Creates multiple related files
- Sets up proper architecture
- Includes database models
- Adds comprehensive tests
- Follows project conventions

---

### 3. Repository Documentation

#### Generate Manifest
```
Generate a manifest for this project
```
or
```
Create a JSON manifest of this repository
```
or
```
Generate repository documentation in YAML format
```

**What it does:**
- Creates machine-readable documentation
- Lists all dependencies
- Maps file structure
- Analyzes code metrics
- Exports as JSON or YAML

---

### 4. Issue Analysis & Fixing

#### Analyze Specific Issues
```
Audit this repo and show me all critical security issues
```
or
```
What are the high-severity problems in this codebase?
```
or
```
Show me all files missing tests
```

**What it does:**
- Filters by severity level
- Groups by category
- Provides detailed explanations
- Suggests fixes

---

#### Get Fix Recommendations
```
Audit this repo and help me fix the critical issues
```
or
```
What should I fix first in this codebase?
```
or
```
Show me the most important issues and how to fix them
```

**What it does:**
- Prioritizes issues by severity
- Provides step-by-step fix instructions
- Suggests code improvements
- Offers refactoring advice

---

### 5. Framework-Specific Analysis

#### React/Next.js Projects
```
Audit this React app for best practices
```
or
```
Check this Next.js project for common issues
```
or
```
Analyze this React codebase for performance problems
```

**What it does:**
- Applies React-specific rules
- Checks for async useEffect issues
- Detects server code in client components
- Validates component structure

---

#### Node.js Backend Projects
```
Audit this Express API for security issues
```
or
```
Check this Node.js backend for vulnerabilities
```
or
```
Analyze this API for missing input validation
```

**What it does:**
- Applies backend-specific rules
- Checks for SQL injection risks
- Validates input handling
- Checks status code consistency

---

### 6. CI/CD & Quality Gates

#### Pre-commit Checks
```
Audit this repo and tell me if it's safe to commit
```
or
```
Check if there are any critical issues before I push
```
or
```
Run a quality check before deployment
```

**What it does:**
- Runs comprehensive audit
- Highlights blocking issues
- Suggests fixes before commit
- Provides quality score

---

### 7. Project Understanding

#### Explain Project Structure
```
Explain what this project does
```
or
```
Give me an overview of this codebase
```
or
```
What kind of application is this?
```

**What it does:**
- Analyzes project type
- Identifies frameworks
- Explains architecture
- Lists key features
- Provides technical summary

---

## 🎯 Advanced Prompts

### Combining Multiple Actions
```
Audit this repository, then generate a user authentication system
```
or
```
Check this codebase for issues, then create a manifest
```
or
```
Analyze this project and generate missing test files
```

---

### Contextual Requests
```
I'm working on #File src/components/Header.tsx - audit just this file
```
or
```
Audit the #Folder src/api directory for security issues
```
or
```
Check #Codebase for all hardcoded credentials
```

---

### Iterative Improvements
```
Audit this repo, show me the top 5 issues, and help me fix them one by one
```
or
```
Run an audit, prioritize by severity, and create a fix plan
```
or
```
Check for issues, explain each one, and generate fixed code
```

---

## 💡 Pro Tips

### 1. Be Specific About Severity
```
Show me only CRITICAL and HIGH severity issues
```
```
What are the low-priority suggestions for improvement?
```

### 2. Focus on Categories
```
Audit for security issues only
```
```
Check for architectural problems
```
```
Find all style and naming violations
```

### 3. Request Explanations
```
Audit this repo and explain each issue in detail
```
```
Why is this code flagged as a problem?
```
```
Explain the security risks in this file
```

### 4. Get Learning Value
```
Audit this repo and teach me about the issues you find
```
```
What are the best practices I'm missing?
```
```
Show me examples of how to fix these issues
```

---

## 🔧 Setup Required (One-Time)

Before using these prompts, ensure RepoForge MCP is configured in your Kiro workspace:

1. Check `.kiro/settings/mcp.json` exists with RepoForge configuration
2. Build RepoForge: `npm run build`
3. Restart Kiro or reconnect MCP servers

If you cloned a repo with `.kiro/` directory, the MCP configuration is already there!

---

## 📊 Example Conversation Flow

**You:** "Audit this repository"

**Kiro:** *Runs audit and shows results*
```
Found 15 issues:
- 2 CRITICAL (hardcoded API keys)
- 5 HIGH (missing input validation)
- 8 MEDIUM (missing tests)
```

**You:** "Help me fix the critical issues first"

**Kiro:** *Provides detailed fix instructions*

**You:** "Generate the fixed code for the API key issue"

**Kiro:** *Generates secure code using environment variables*

**You:** "Now audit again to verify the fix"

**Kiro:** *Runs audit, confirms issue is resolved*

---

## 🎓 Learning Prompts

Use these to understand your codebase better:

```
Audit this repo and explain the architecture pattern it uses
```
```
What frameworks and libraries is this project using?
```
```
Show me the code flow from entry point to API endpoints
```
```
What are the main features of this application?
```
```
Explain the directory structure and why it's organized this way
```

---

## 🚨 Emergency Prompts

When you need quick answers:

```
Is there anything critical I need to fix right now?
```
```
Are there any security vulnerabilities in this code?
```
```
What's the biggest problem with this codebase?
```
```
Should I refactor anything before adding new features?
```

---

## 📝 Notes

- **Natural Language**: Kiro understands natural language, so feel free to ask in your own words
- **Context Aware**: Kiro knows which files you have open and can focus on those
- **Iterative**: You can have a conversation - ask follow-up questions
- **Multi-Repo**: Works on any repository you open in Kiro

---

## 🎉 Try It Now!

Open any project in Kiro and try:
```
Audit this repository and show me what needs improvement
```

That's it! Kiro will use RepoForge's MCP tools to analyze your code and provide actionable insights.
