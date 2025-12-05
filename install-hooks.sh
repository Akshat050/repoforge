#!/bin/bash

# RepoForge Hooks Installer
# Copies RepoForge hooks to the current project

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR=".kiro/hooks"

echo "📦 Installing RepoForge hooks..."

# Create hooks directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Copy all hook files
cp "$SCRIPT_DIR/.kiro/hooks/"*.yaml "$TARGET_DIR/"

echo "✅ Installed hooks:"
ls -1 "$TARGET_DIR"

echo ""
echo "🎉 RepoForge hooks are now available in this project!"
echo ""
echo "Available hooks:"
echo "  • repoforge-spooky-audit - Say 'spooky audit' to trigger"
echo "  • repoforge-detailed-audit - Detailed audit with full context"
echo "  • repoforge-project-overview - Generate project overview"
echo "  • repoforge-auto-health-check - Auto health check"
echo "  • repoforge-generate-code - Code generation helper"
echo ""
echo "Restart Kiro or reload the workspace to see the hooks."
