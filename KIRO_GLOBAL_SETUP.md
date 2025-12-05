# RepoForge Global Setup for Kiro

This guide shows you how to make RepoForge available in **all your projects** through Kiro, not just the RepoForge repository itself.

## Two Approaches

### Approach 1: Global NPM Package (Recommended)
Install RepoForge globally so it works everywhere.

### Approach 2: User-Level MCP Config
Point to your local RepoForge installation from all workspaces.

---

## Approach 1: Global NPM Package (Recommended)

### Step 1: Install RepoForge Globally

```bash
# From the repoforge directory
npm install -g .

# Or if published to npm
npm install -g repoforge
```

### Step 2: Configure User-Level MCP

**Location:** `~/.kiro/settings/mcp.json` (global config for all workspaces)

**On Windows:** `C:\Users\YOUR_USERNAME\.kiro\settings\mcp.json`
**On Mac/Linux:** `~/.kiro/settings/mcp.json`

Create or edit this file:

```json
{
  "mcpServers": {
    "repoforge": {
      "command": "npx",
      "args": ["-y", "repoforge-mcp"],
      "env": {
        "NODE_ENV": "production"
      },
      "disabled": false,
      "autoApprove": [
        "repoforge_audit_repo",
        "repoforge_audit_summary",
        "repoforge_generate_code",
        "repoforge_generate_manifest"
      ],
      "description": "RepoForge - Intelligent repository auditor"
    }
  }
}
```

### Step 3: Add MCP Server Script to package.json

In your RepoForge `package.json`, add:

```json
{
  "name": "repoforge",
  "version": "1.0.0",
  "bin": {
    "repoforge": "./dist/cli/index.js",
    "repoforge-mcp": "./dist/mcp-server/index.js"
  },
  "files": [
    "dist/**/*",
    "package.json",
    "README.md"
  ]
}
```

### Step 4: Rebuild and Reinstall

```bash
# In repoforge directory
npm run build
npm install -g .
```

### Step 5: Test It

```bash
# Test the MCP server
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | repoforge-mcp
```

### Step 6: Restart Kiro

Close and reopen Kiro. RepoForge will now be available in **all your projects**!

---

## Approach 2: User-Level MCP Config (Point to Local Installation)

If you don't want to install globally, you can point to your local RepoForge installation.

### Step 1: Find Your RepoForge Path

```bash
# On Windows
cd D:\repoforge
pwd

# On Mac/Linux
cd ~/path/to/repoforge
pwd
```

### Step 2: Configure User-Level MCP

**Location:** `~/.kiro/settings/mcp.json`

```json
{
  "mcpServers": {
    "repoforge": {
      "command": "node",
      "args": ["D:/repoforge/dist/mcp-server/index.js"],
      "env": {
        "NODE_ENV": "production"
      },
      "disabled": false,
      "autoApprove": [
        "repoforge_audit_repo",
        "repoforge_audit_summary",
        "repoforge_generate_code",
        "repoforge_generate_manifest"
      ],
      "description": "RepoForge - Intelligent repository auditor"
    }
  }
}
```

**Important:** Use forward slashes `/` even on Windows, or escape backslashes `\\`.

### Step 3: Restart Kiro

Close and reopen Kiro. RepoForge will now be available in **all your projects**!

---

## Configuration Precedence

Kiro merges MCP configurations in this order:

1. **User config** (`~/.kiro/settings/mcp.json`) - Applies to all workspaces
2. **Workspace config** (`.kiro/settings/mcp.json`) - Applies to current workspace only

Workspace config **overrides** user config for the same server name.

---

## Recommended Setup

### For Development (Working on RepoForge itself):
Use **workspace config** (`.kiro/settings/mcp.json`) with relative or absolute path:
```json
{
  "mcpServers": {
    "repoforge": {
      "command": "node",
      "args": ["./dist/mcp-server/index.js"]
    }
  }
}
```

### For Using RepoForge in Other Projects:
Use **user config** (`~/.kiro/settings/mcp.json`) with global installation:
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

---

## Testing in Different Projects

### Test 1: Open Any Project

1. Open any project in Kiro (not the repoforge directory)
2. Check MCP Servers panel - "repoforge" should appear
3. In chat, say: "Audit this repository"
4. RepoForge should analyze that project!

### Test 2: Verify It Works

```bash
# Navigate to any project
cd ~/my-other-project

# Open in Kiro
code .

# In Kiro chat:
# "Audit this repository"
# "Generate a user login page"
```

---

## Publishing to NPM (Optional)

To make RepoForge available to everyone:

### Step 1: Prepare package.json

```json
{
  "name": "repoforge",
  "version": "1.0.0",
  "description": "Smart repository auditor with Rule Engine",
  "main": "./dist/cli/index.js",
  "bin": {
    "repoforge": "./dist/cli/index.js",
    "repoforge-mcp": "./dist/mcp-server/index.js"
  },
  "files": [
    "dist/**/*",
    "README.md",
    "LICENSE"
  ],
  "keywords": [
    "code-quality",
    "static-analysis",
    "mcp-server",
    "kiro",
    "audit",
    "linter"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/Akshat050/repoforge.git"
  }
}
```

### Step 2: Build and Publish

```bash
npm run build
npm publish
```

### Step 3: Anyone Can Install

```bash
npm install -g repoforge
```

Then configure in `~/.kiro/settings/mcp.json`:
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

---

## Troubleshooting

### Issue: "repoforge-mcp: command not found"

**Solution:** Install globally first:
```bash
cd /path/to/repoforge
npm run build
npm install -g .
```

### Issue: MCP server not appearing in other projects

**Solution:** Check user-level config exists:
```bash
# Windows
type %USERPROFILE%\.kiro\settings\mcp.json

# Mac/Linux
cat ~/.kiro/settings/mcp.json
```

### Issue: Different versions in different projects

**Solution:** Use workspace config to override:
- User config: Global version
- Workspace config: Development version

---

## Quick Setup Script

Save this as `setup-global-mcp.sh`:

```bash
#!/bin/bash

# Build RepoForge
echo "Building RepoForge..."
npm run build

# Install globally
echo "Installing globally..."
npm install -g .

# Create user MCP config directory
mkdir -p ~/.kiro/settings

# Create or update MCP config
cat > ~/.kiro/settings/mcp.json << 'EOF'
{
  "mcpServers": {
    "repoforge": {
      "command": "npx",
      "args": ["-y", "repoforge-mcp"],
      "disabled": false,
      "autoApprove": [
        "repoforge_audit_repo",
        "repoforge_audit_summary",
        "repoforge_generate_code",
        "repoforge_generate_manifest"
      ]
    }
  }
}
EOF

echo "✅ RepoForge is now available globally!"
echo "Restart Kiro to use it in any project."
```

Run it:
```bash
chmod +x setup-global-mcp.sh
./setup-global-mcp.sh
```

---

## Success Checklist

- [ ] RepoForge built successfully (`npm run build`)
- [ ] Installed globally (`npm install -g .`)
- [ ] User MCP config created (`~/.kiro/settings/mcp.json`)
- [ ] Kiro restarted
- [ ] MCP server appears in other projects
- [ ] "Audit this repository" works in other projects
- [ ] Hooks work (if copied to other projects)

---

## Next Steps

1. **Test in another project** - Open a different project and try "Audit this repository"
2. **Copy hooks to other projects** - Copy `.kiro/hooks/` to projects where you want automated audits
3. **Publish to npm** - Make RepoForge available to everyone
4. **Create a Kiro Power** - Package RepoForge as a Kiro Power for easy distribution

Enjoy using RepoForge across all your projects! 🚀
