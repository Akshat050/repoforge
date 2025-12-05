#!/bin/bash

# RepoForge Global MCP Setup Script
# This script installs RepoForge globally and configures it for use in all Kiro workspaces

set -e

echo "🔨 Building RepoForge..."
npm run build

echo "📦 Installing RepoForge globally..."
npm install -g .

echo "⚙️  Configuring global MCP settings..."

# Create Kiro settings directory if it doesn't exist
mkdir -p ~/.kiro/settings

# Create or update MCP config
cat > ~/.kiro/settings/mcp.json << 'EOF'
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
      "description": "RepoForge - Intelligent repository auditor with context memory"
    }
  }
}
EOF

echo ""
echo "✅ RepoForge is now installed globally!"
echo ""
echo "📋 Next steps:"
echo "  1. Restart Kiro IDE"
echo "  2. Open any project"
echo "  3. In Kiro chat, say: 'Audit this repository'"
echo ""
echo "🎉 RepoForge will now work in all your projects!"
