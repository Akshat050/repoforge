# Kiro Integration Troubleshooting

## MCP Server Connection Issues

### Problem: "MCP error -32000: Connection closed"

**Symptoms:**
- Kiro shows "repoforge: Connect... Retry" in MCP Servers panel
- Error logs show: `npm error 404 'repoforge-mcp' is not in this registry`
- MCP connection closes immediately

**Solution:**

1. **Ensure the project is built:**
   ```bash
   npm run build
   ```

2. **Check the MCP configuration path:**
   - Open `.kiro/settings/mcp.json`
   - Verify the path to `dist/mcp-server/index.js` is correct
   - Use absolute path if relative path doesn't work:
   ```json
   {
     "mcpServers": {
       "repoforge": {
         "command": "node",
         "args": ["D:/repoforge/dist/mcp-server/index.js"]
       }
     }
   }
   ```

3. **Reconnect the MCP server:**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "MCP: Reconnect Server"
   - Select "repoforge"

4. **Verify the MCP server works manually:**
   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node ./dist/mcp-server/index.js
   ```
   
   Should output:
   ```json
   {"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{"listChanged":true}},"serverInfo":{"name":"repoforge-mcp","version":"1.0.0"}},"jsonrpc":"2.0","id":1}
   ```

---

## Hooks Not Appearing

### Problem: Agent Hooks section is empty or hooks don't trigger

**Symptoms:**
- "AGENT HOOKS" section in left sidebar is empty
- Hooks don't trigger when expected
- No response when saying "spooky audit"

**Solution:**

1. **Check hooks directory exists:**
   ```bash
   ls .kiro/hooks
   ```
   
   Should show:
   - `repoforge-auto-health-check.yaml`
   - `repoforge-detailed-audit.yaml`
   - `repoforge-generate-code.yaml`
   - `repoforge-project-overview.yaml`
   - `repoforge-spooky-audit.yaml`

2. **Verify hook file format:**
   - Open any hook file (e.g., `.kiro/hooks/repoforge-spooky-audit.yaml`)
   - Ensure it has proper YAML structure:
   ```yaml
   id: repoforge-spooky-audit
   description: Run a RepoForge audit
   trigger:
     type: message_pattern
     pattern: "(?i)spooky audit"
   actions:
     - type: mcp_call
       server: repoforge
       tool: repoforge_audit_summary
   ```

3. **Reload Kiro workspace:**
   - Close and reopen the workspace folder
   - Or restart Kiro IDE

4. **Check if MCP server is connected:**
   - Hooks that use `mcp_call` require the MCP server to be connected
   - Fix MCP connection first (see above)

---

## Build Errors

### Problem: TypeScript compilation fails

**Symptoms:**
- `npm run build` shows errors
- Test files causing type errors

**Solution:**

1. **Exclude test files from build:**
   - Check `tsconfig.json` has:
   ```json
   {
     "exclude": [
       "**/*.test.ts",
       "node_modules",
       "dist"
     ]
   }
   ```

2. **Clean and rebuild:**
   ```bash
   rm -rf dist
   npm run build
   ```

3. **Check for missing dependencies:**
   ```bash
   npm install
   ```

---

## Testing MCP Tools

### Test Individual Tools

**Test audit:**
```bash
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"repoforge_audit_summary","arguments":{"root":"."}}}' | node ./dist/mcp-server/index.js
```

**Test code generation:**
```bash
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"repoforge_generate_code","arguments":{"prompt":"user login page","root":"."}}}' | node ./dist/mcp-server/index.js
```

**Test manifest generation:**
```bash
echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"repoforge_generate_manifest","arguments":{"root":".","format":"json"}}}' | node ./dist/mcp-server/index.js
```

---

## Common Issues

### Issue: "Cannot find module '@modelcontextprotocol/sdk'"

**Solution:**
```bash
npm install
npm run build
```

### Issue: Hooks trigger but MCP call fails

**Solution:**
1. Check MCP server is connected (green indicator)
2. Verify tool names match in hook file:
   - `repoforge_audit_repo`
   - `repoforge_audit_summary`
   - `repoforge_generate_code`
   - `repoforge_generate_manifest`

### Issue: Relative paths don't work

**Solution:**
Use absolute paths in `.kiro/settings/mcp.json`:
```json
{
  "mcpServers": {
    "repoforge": {
      "command": "node",
      "args": ["/absolute/path/to/repoforge/dist/mcp-server/index.js"]
    }
  }
}
```

---

## Verification Checklist

Before asking for help, verify:

- [ ] `npm install` completed successfully
- [ ] `npm run build` completed without errors
- [ ] `dist/mcp-server/index.js` file exists
- [ ] `.kiro/settings/mcp.json` has correct path
- [ ] MCP server responds to manual test (see above)
- [ ] Kiro workspace is open in the repoforge directory
- [ ] MCP server shows as connected in Kiro (not "Connect... Retry")

---

## Getting Help

If issues persist:

1. **Check Kiro logs:**
   - Open Output panel in Kiro
   - Select "Kiro" or "MCP Logs" from dropdown
   - Look for error messages

2. **Check npm logs:**
   - Error messages often reference log files
   - Example: `C:\Users\DELL\AppData\Local\npm-cache\_logs\2025-12-05T05_56_17_046Z-debug-0.log`

3. **Verify Node.js version:**
   ```bash
   node --version
   ```
   Should be v18 or higher

4. **Test in a fresh terminal:**
   - Close all terminals
   - Open new terminal
   - Try commands again

---

## Quick Fix Script

Run this to fix most common issues:

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build

# Test MCP server
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node ./dist/mcp-server/index.js

# If successful, reconnect in Kiro
echo "✅ MCP server is working! Now reconnect in Kiro (Ctrl+Shift+P -> MCP: Reconnect Server)"
```

---

## Success Indicators

You'll know everything is working when:

✅ MCP server shows green "connected" status in Kiro
✅ Hooks appear in "AGENT HOOKS" section
✅ Saying "audit this repository" in chat triggers RepoForge
✅ Hooks trigger automatically (e.g., "spooky audit" works)
✅ No error messages in Kiro output panel
