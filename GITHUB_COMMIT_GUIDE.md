# GitHub Commit Guide

## Quick Start

```bash
# Initialize git repository
git init

# Add all files (gitignore will handle exclusions)
git add .

# Commit
git commit -m "feat: Add Rule Engine with severity levels and property-based testing"

# Add your GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/repoforge.git

# Push to GitHub
git push -u origin main
```

## What Gets Committed

### ✅ Source Code (TypeScript)
- `cli/index.ts` - CLI entry point
- `mcp-server/index.ts` - MCP server
- `src/index.ts` - Main entry
- `core/**/*.ts` - All core modules including Rule Engine
- `tests/**/*.test.ts` - All test files

### ✅ Configuration
- `package.json` - Dependencies and scripts
- `package-lock.json` - Locked dependencies
- `tsconfig.json` - TypeScript config
- `.gitignore` - Git exclusions

### ✅ Documentation
- `README.md` - Main documentation
- `docs/CONFIGURATION_EXAMPLES.md` - Config examples
- `docs/RULE_AUTHORING_GUIDE.md` - Rule authoring guide

### ✅ Kiro Integration
- `.kiro/specs/` - Feature specifications (requirements, design, tasks)
- `.kiro/hooks/` - Agent hooks for automation
- `.kiro/settings/mcp.json` - MCP server configuration
- `.kiro/steering/` - Steering rules for AI agents

### ✅ RepoForge State
- `.repoforge/state.json` - Example state file

## What Gets Excluded (via .gitignore)

### ❌ Build Output
- `dist/` - Compiled JavaScript
- `*.js`, `*.d.ts`, `*.js.map` - Compiled files

### ❌ Dependencies
- `node_modules/` - NPM packages

### ❌ IDE Settings
- `.vscode/` - VS Code settings (optional, can include if you want)

### ❌ Generated Files
- `repoforge-manifest.json` - Dynamically generated
- `repoforge-manifest.yaml` - Dynamically generated

### ❌ Internal Documentation (Optional - you can include these if you want)
- `KIRO_*.md` - Kiro-specific docs
- `ARCHITECTURE_COMPLETE.md`
- `COMPLETION_SUMMARY.md`
- etc.

## File Count Summary

**Total files to commit:** ~70-80 files
- Core TypeScript files: ~30
- Rule Engine files: ~20
- Tests: ~10
- Config & docs: ~5
- Kiro workspace files: ~10-15
- RepoForge state: ~1

## Verify Before Pushing

```bash
# See what will be committed
git status

# See what's ignored
git status --ignored

# Review changes
git diff --cached
```

## Recommended Commit Message

```
feat: Add comprehensive Rule Engine with Kiro integration

- Implement Rule Registry for managing custom and built-in rules
- Add Rule Executor with parallel processing and error resilience
- Create Result Formatter with CLI, JSON, and MCP output
- Add 24 correctness properties with property-based testing
- Implement security rules (hardcoded credentials, SQL injection, etc.)
- Add framework-aware rules (React, Node.js)
- Support configurable severity thresholds and rule disabling
- Include comprehensive test suite (150+ tests)
- Add Kiro IDE integration (MCP server, hooks, specs, steering)
- Add documentation for rule authoring and configuration

Closes #[issue-number]
```

## Post-Push Checklist

- [ ] Verify README displays correctly on GitHub
- [ ] Check that .gitignore is working (no dist/ or node_modules/)
- [ ] Ensure package.json has correct repository URL
- [ ] Add GitHub topics/tags for discoverability
- [ ] Consider adding GitHub Actions for CI/CD
- [ ] Add LICENSE file if not present
