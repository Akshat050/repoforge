@echo off
REM RepoForge Global MCP Setup Script for Windows
REM This script installs RepoForge globally and configures it for use in all Kiro workspaces

echo Building RepoForge...
call npm run build
if errorlevel 1 (
    echo Build failed!
    exit /b 1
)

echo Installing RepoForge globally...
call npm install -g .
if errorlevel 1 (
    echo Installation failed!
    exit /b 1
)

echo Configuring global MCP settings...

REM Create Kiro settings directory if it doesn't exist
if not exist "%USERPROFILE%\.kiro\settings" mkdir "%USERPROFILE%\.kiro\settings"

REM Create or update MCP config
(
echo {
echo   "mcpServers": {
echo     "repoforge": {
echo       "command": "npx",
echo       "args": ["-y", "repoforge-mcp"],
echo       "env": {
echo         "NODE_ENV": "production"
echo       },
echo       "disabled": false,
echo       "autoApprove": [
echo         "repoforge_audit_repo",
echo         "repoforge_audit_summary",
echo         "repoforge_generate_code",
echo         "repoforge_generate_manifest"
echo       ],
echo       "description": "RepoForge - Intelligent repository auditor with context memory"
echo     }
echo   }
echo }
) > "%USERPROFILE%\.kiro\settings\mcp.json"

echo.
echo RepoForge is now installed globally!
echo.
echo Next steps:
echo   1. Restart Kiro IDE
echo   2. Open any project
echo   3. In Kiro chat, say: 'Audit this repository'
echo.
echo RepoForge will now work in all your projects!
pause
