@echo off
REM RepoForge Hooks Installer for Windows
REM Copies RepoForge hooks to the current project

echo Installing RepoForge hooks...

REM Create hooks directory if it doesn't exist
if not exist ".kiro\hooks" mkdir ".kiro\hooks"

REM Copy all hook files
copy "%~dp0.kiro\hooks\*.yaml" ".kiro\hooks\" >nul

echo.
echo Installed hooks:
dir /b ".kiro\hooks"

echo.
echo RepoForge hooks are now available in this project!
echo.
echo Available hooks:
echo   - repoforge-spooky-audit - Say 'spooky audit' to trigger
echo   - repoforge-detailed-audit - Detailed audit with full context
echo   - repoforge-project-overview - Generate project overview
echo   - repoforge-auto-health-check - Auto health check
echo   - repoforge-generate-code - Code generation helper
echo.
echo Restart Kiro or reload the workspace to see the hooks.
pause
