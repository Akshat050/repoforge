# Kiro Workspace

This directory contains Kiro IDE integration files that enhance the development experience with AI-powered features.

## Directory Structure

```
.kiro/
├── hooks/              # Agent hooks for automation
├── settings/           # Kiro configuration
├── specs/              # Feature specifications
└── steering/           # AI agent steering rules
```

## What's Included

### 🪝 Hooks (`hooks/`)
Agent hooks that automatically trigger AI actions on specific events:
- `repoforge-spooky-audit.yaml` - Automated spooky audit on file save
- `repoforge-detailed-audit.yaml` - Detailed audit with full context
- `repoforge-project-overview.yaml` - Generate project overview

### ⚙️ Settings (`settings/`)
- `mcp.json` - MCP (Model Context Protocol) server configuration
  - Configures RepoForge as an MCP server for Kiro
  - Auto-approves common tools for seamless integration

### 📋 Specs (`specs/`)
Feature specifications following spec-driven development:
- `rule-engine/` - Complete Rule Engine specification
  - `requirements.md` - EARS-compliant requirements
  - `design.md` - Architecture and correctness properties
  - `tasks.md` - Implementation task list
- `repoforge.yaml` - Main RepoForge spec configuration
- `skeleton.yaml` - Skeleton generator spec

### 🎯 Steering (`steering/`)
AI agent guidance rules:
- `repoforge.md` - RepoForge-specific development guidelines
  - Coding standards
  - Testing requirements
  - Architecture patterns

## Why Include This in GitHub?

Including the `.kiro/` directory provides:

1. **Reproducible Development Environment**: Other developers using Kiro can get the same AI-powered experience
2. **Documentation**: Specs serve as living documentation of features
3. **Automation**: Hooks can be reused by team members
4. **MCP Integration**: Easy setup for RepoForge MCP server
5. **AI Context**: Steering rules help AI agents understand project conventions

## Using These Files

### For Kiro Users:
1. Clone the repository
2. Open in Kiro IDE
3. The hooks, specs, and steering rules will be automatically available
4. MCP server will be configured and ready to use

### For Non-Kiro Users:
- The specs in `.kiro/specs/` are valuable documentation even without Kiro
- Requirements and design documents follow industry standards (EARS, INCOSE)
- Can be read as markdown files in any editor

## Learn More

- [Kiro IDE Documentation](https://kiro.ai/docs)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Spec-Driven Development](https://kiro.ai/docs/specs)
