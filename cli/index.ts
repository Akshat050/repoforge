#!/usr/bin/env node

/**
 * RepoForge CLI
 * Command-line interface for scanning, generating, and auditing repositories
 */

import { scanRepo } from '../core/fileScanner.js';
import { generateSkeleton } from '../core/skeletonGenerator.js';
import { smartAuditRepo, auditRepoWithCode } from '../core/auditor.js';
import { summarizeStructure } from "../core/structureSummary.js";
import { analyzeFlow } from '../core/flowAnalyzer.js';
import { generateCode } from '../core/codeGenerator.js';
import { generateManifest, manifestToJSON, manifestToYAML } from '../core/manifestGenerator.js';
import { runDoctor } from '../core/doctor.js';
import { loadState, saveState, createState, updateStateWithAudit, getContextSummary } from '../core/state.js';
import { RuleRegistry } from '../core/ruleEngine/RuleRegistry.js';
import { ConfigLoader } from '../core/ruleEngine/ConfigLoader.js';
import * as fs from 'fs';
import * as path from 'path';

import type { AuditResult } from '../core/types.js';
import type { RuleEngineConfig, Severity } from '../core/ruleEngine/types.js';

const EMOJI_MAP = {
  ghost: '👻',
  curse: '🧿',
  zombie: '🧟'
};

/**
 * Parse CLI flags for audit command
 */
function parseAuditFlags(flags: string[]): { deep: boolean; config: Partial<RuleEngineConfig> } {
  const config: Partial<RuleEngineConfig> = {
    disabledRules: [],
    categories: []
  };
  let deep = false;

  for (let i = 0; i < flags.length; i++) {
    const flag = flags[i];

    if (flag === '--deep') {
      deep = true;
    } else if (flag === '--min-severity') {
      const value = flags[++i];
      if (value && isValidSeverity(value)) {
        config.minSeverity = value as Severity;
      } else {
        console.error(`Error: Invalid severity level '${value}'. Must be one of: CRITICAL, HIGH, MEDIUM, LOW, SUGGESTION`);
        process.exit(1);
      }
    } else if (flag === '--fail-on-severity') {
      const value = flags[++i];
      if (value && isValidSeverity(value)) {
        config.failOnSeverity = value as Severity;
      } else {
        console.error(`Error: Invalid severity level '${value}'. Must be one of: CRITICAL, HIGH, MEDIUM, LOW, SUGGESTION`);
        process.exit(1);
      }
    } else if (flag === '--disable-rule') {
      const ruleId = flags[++i];
      if (ruleId) {
        config.disabledRules!.push(ruleId);
      } else {
        console.error('Error: --disable-rule requires a rule ID');
        process.exit(1);
      }
    } else if (flag === '--category') {
      const category = flags[++i];
      if (category && isValidCategory(category)) {
        config.categories!.push(category as any);
      } else {
        console.error(`Error: Invalid category '${category}'. Must be one of: Security, Testing, Architecture, Performance, Style, Maintainability`);
        process.exit(1);
      }
    }
  }

  return { deep, config };
}

/**
 * Check if a string is a valid severity level
 */
function isValidSeverity(severity: string): boolean {
  const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SUGGESTION'];
  return validSeverities.includes(severity.toUpperCase());
}

/**
 * Check if a string is a valid category
 */
function isValidCategory(category: string): boolean {
  const validCategories = ['Security', 'Testing', 'Architecture', 'Performance', 'Style', 'Maintainability'];
  return validCategories.includes(category);
}

function printUsage(): void {
  console.log(`Usage:
  repoforge init                    - Generate a skeleton project
  repoforge generate "<prompt>"     - AI-powered code generation
  repoforge audit                   - Run spooky audits (structure only)
  repoforge audit --deep            - Run deep audit including code analysis
  repoforge audit [options]         - Run audit with configuration options
  repoforge doctor                  - Comprehensive health check with recommendations
  repoforge map                     - Describe the structure and flow
  repoforge manifest [--format]     - Generate machine-readable manifest (json/yaml)
  repoforge rules list              - List all available rules with their status
  repoforge kiro-setup              - Setup Kiro IDE integration (MCP + hooks)
  repoforge help                    - Show this help message

Audit Options:
  --min-severity <level>            - Only report violations at or above this severity
                                      (CRITICAL, HIGH, MEDIUM, LOW, SUGGESTION)
  --fail-on-severity <level>        - Exit with error code if violations at or above this level
  --disable-rule <rule-id>          - Disable specific rule(s) (can be used multiple times)
  --category <category>             - Filter violations by category (can be used multiple times)
                                      (Security, Testing, Architecture, Performance, Style, Maintainability)
  --deep                            - Include code analysis
  
Examples:
  repoforge generate "homepage for mobile shop"
  repoforge generate "user authentication API"
  repoforge generate "product card component"
  repoforge audit --min-severity HIGH
  repoforge audit --fail-on-severity CRITICAL
  repoforge audit --disable-rule GHOST_MISSING_TEST --disable-rule CURSE_NAMING_KEBAB
  repoforge manifest --json         - Generate JSON manifest
  repoforge manifest --yaml         - Generate YAML manifest
  repoforge doctor                  - Full health check
  repoforge kiro-setup              - Setup Kiro integration`);
}

function handleInit(): void {
  const result = generateSkeleton(process.cwd());
  
  console.log('[RepoForge] Skeleton created:');
  for (const file of result.created) {
    console.log(`  ${file}`);
  }
}

async function handleGenerate(prompt: string): Promise<void> {
  if (!prompt) {
    console.error('❌ Error: Please provide a prompt');
    console.log('Example: repoforge generate "homepage for mobile shop"');
    process.exit(1);
  }
  
  console.log('\n🤖 RepoForge AI Code Generator\n');
  console.log(`📝 Prompt: "${prompt}"\n`);
  
  const targetDir = process.cwd();
  const repo = scanRepo(targetDir);
  const result: AuditResult = await smartAuditRepo(repo);
  
  console.log('🔍 Analyzing project...');
  console.log(`   Type: ${result.profile.type}`);
  console.log(`   Frameworks: ${result.profile.frameworks.join(', ')}`);
  console.log(`   Language: ${result.profile.hasTypeScript ? 'TypeScript' : 'JavaScript'}\n`);
  
  // Check if project is empty/new
  const hasPackageJson = fs.existsSync(path.join(targetDir, 'package.json'));
  const hasReactSetup = repo.entries.some(e => 
    e.path.includes('App.') || e.path.includes('main.') || e.path.includes('index.html')
  );
  
  if (!hasPackageJson || !hasReactSetup) {
    console.log('⚠️  Empty project detected! Setting up complete React project first...\n');
    
    // Initialize React project
    try {
      console.log('📦 Creating package.json...');
      const packageJson = {
        name: path.basename(targetDir).toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          '@vitejs/plugin-react': '^4.2.0',
          vite: '^5.0.0',
          '@testing-library/react': '^14.0.0',
          '@testing-library/jest-dom': '^6.1.0',
          vitest: '^1.0.0'
        }
      };
      
      fs.writeFileSync(
        path.join(targetDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      console.log('   ✅ package.json created\n');
      
      // Create vite.config.js
      console.log('⚙️  Creating vite.config.js...');
      const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;
      fs.writeFileSync(path.join(targetDir, 'vite.config.js'), viteConfig);
      console.log('   ✅ vite.config.js created\n');
      
      // Create index.html
      console.log('📄 Creating index.html...');
      const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${prompt}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
      fs.writeFileSync(path.join(targetDir, 'index.html'), indexHtml);
      console.log('   ✅ index.html created\n');
      
      // Create src directory
      const srcDir = path.join(targetDir, 'src');
      if (!fs.existsSync(srcDir)) {
        fs.mkdirSync(srcDir, { recursive: true });
      }
      
      // Create main.jsx
      console.log('📄 Creating src/main.jsx...');
      const mainJsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
      fs.writeFileSync(path.join(srcDir, 'main.jsx'), mainJsx);
      console.log('   ✅ src/main.jsx created\n');
      
      // Create index.css
      console.log('🎨 Creating src/index.css...');
      const indexCss = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
}
`;
      fs.writeFileSync(path.join(srcDir, 'index.css'), indexCss);
      console.log('   ✅ src/index.css created\n');
      
      console.log('✨ React project setup complete!\n');
      console.log('📦 Run "npm install" to install dependencies\n');
      console.log('🚀 Then run "npm run dev" to start the development server\n');
      
      // Re-scan after setup
      result.profile.frameworks = ['react'];
      result.profile.type = 'frontend';
      
    } catch (error) {
      console.error('❌ Failed to setup React project:', error);
      process.exit(1);
    }
  }
  
  console.log('⚙️  Generating code...\n');
  
  const generated = generateCode(
    { prompt },
    result.profile,
    targetDir
  );
  
  console.log('✨ Generated Files:\n');
  console.log(generated.structure);
  console.log();
  
  console.log('📖 Explanation:\n');
  console.log(`   ${generated.explanation}\n`);
  
  // Create files
  let createdCount = 0;
  let mainComponentName = '';
  let mainComponentPath = '';
  
  for (const file of generated.files) {
    const fullPath = file.path;
    const dir = path.dirname(fullPath);
    
    try {
      // Create directory if needed
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write file
      fs.writeFileSync(fullPath, file.content, 'utf-8');
      console.log(`   ✅ Created: ${path.relative(targetDir, fullPath)}`);
      createdCount++;
      
      // Track main component
      if (file.path.endsWith('.jsx') && !file.path.includes('test')) {
        mainComponentName = path.basename(file.path, '.jsx');
        mainComponentPath = './' + path.relative(path.join(targetDir, 'src'), file.path).replace(/\\/g, '/').replace('.jsx', '');
      }
    } catch (error) {
      console.error(`   ❌ Failed to create: ${file.path}`);
    }
  }
  
  // Create or update App.jsx to use the generated component
  if (mainComponentName && mainComponentPath) {
    const appPath = path.join(targetDir, 'src', 'App.jsx');
    const appContent = `import React from 'react';
import ${mainComponentName} from '${mainComponentPath}';

function App() {
  return <${mainComponentName} />;
}

export default App;
`;
    
    try {
      fs.writeFileSync(appPath, appContent);
      console.log(`   ✅ Created: src/App.jsx (imports ${mainComponentName})`);
      createdCount++;
    } catch (error) {
      console.error('   ❌ Failed to create App.jsx');
    }
  }
  
  console.log();
  console.log(`🎉 Successfully created ${createdCount} file(s)!\n`);
  
  console.log('📋 Next Steps:\n');
  generated.nextSteps.forEach((step, i) => {
    console.log(`   ${i + 1}. ${step}`);
  });
  console.log();
}

async function handleAudit(deep: boolean = false, cliConfig?: Partial<RuleEngineConfig>): Promise<number> {
  const repo = scanRepo(process.cwd());
  
  // Load existing state
  const existingState = loadState(repo.root);
  
  if (deep) {
    console.log('\n🔬 Running DEEP audit (structure + code analysis)...\n');
  }
  
  // Pass CLI config to audit (now uses rule engine)
  const result: AuditResult = await smartAuditRepo(repo, cliConfig);
  
  // Add code analysis if deep mode
  if (deep) {
    console.log('🔬 Analyzing code quality...\n');
    const allIssues = await auditRepoWithCode(repo);
    const codeIssues = allIssues.filter(issue => 
      !result.issues.some(existing => 
        existing.id === issue.id && existing.filePath === issue.filePath
      )
    );
    
    const newCodeIssues = codeIssues.length - result.issues.length;
    if (newCodeIssues > 0) {
      console.log(`   ✅ Found ${newCodeIssues} additional code quality issues\n`);
    } else {
      console.log(`   ✅ No code quality issues detected\n`);
    }
    
    result.issues = allIssues;
    
    // Recalculate summary
    result.summary.totalIssues = result.issues.length;
    result.summary.ghosts = result.issues.filter(i => i.type === 'ghost').length;
    result.summary.curses = result.issues.filter(i => i.type === 'curse').length;
    result.summary.zombies = result.issues.filter(i => i.type === 'zombie').length;
    result.summary.critical = result.issues.filter(i => i.severity === 'critical').length;
    result.summary.high = result.issues.filter(i => i.severity === 'high').length;
    result.summary.medium = result.issues.filter(i => i.severity === 'medium').length;
    result.summary.low = result.issues.filter(i => i.severity === 'low').length;
  }
  
  // Print human-friendly explanation
  console.log('\n📖 What is this project?');
  console.log(`   ${result.explanation}\n`);
  
  // Print technical profile
  console.log('📊 Technical Details:');
  console.log(`   Type: ${result.profile.type}`);
  console.log(`   Frameworks: ${result.profile.frameworks.join(', ')}`);
  console.log(`   Architecture: ${result.profile.architecture}`);
  console.log(`   TypeScript: ${result.profile.hasTypeScript ? '✅' : '❌'}`);
  console.log(`   Tests: ${result.profile.hasTests ? '✅' : '❌'}`);
  console.log(`   Package Manager: ${result.profile.packageManager}`);
  console.log(`   Detection Confidence: ${result.profile.confidence}%\n`);
  
  // Print summary header
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 AUDIT SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (result.issues.length === 0) {
    console.log('✨ Excellent! No issues found.\n');
    console.log('Your project follows good practices:');
    console.log('  ✅ All code files have test coverage');
    console.log('  ✅ Files are properly organized');
    console.log('  ✅ No structural issues detected');
    if (deep) {
      console.log('\n  🔬 Deep Analysis Results:');
      console.log('  ✅ No high complexity functions');
      console.log('  ✅ No excessive imports (tight coupling)');
      console.log('  ✅ No console.log statements in code');
      console.log('  ✅ No empty catch blocks');
      console.log('  ✅ No hardcoded credentials (security)');
      console.log('  ✅ No excessive TODO/FIXME comments');
    }
    console.log();
    
    if (result.recommendations.length > 0) {
      console.log('💡 Suggestions for further improvement:');
      result.recommendations.forEach(rec => console.log(`   ${rec}`));
      console.log();
    }
    return 0;
  }
  
  // Issue breakdown
  console.log(`🔍 Found ${result.summary.totalIssues} issue(s):\n`);
  
  console.log('By Type:');
  console.log(`   👻 Ghosts (missing tests):     ${result.summary.ghosts}`);
  console.log(`   🧿 Curses (structural issues): ${result.summary.curses}`);
  console.log(`   🧟 Zombies (misplaced code):   ${result.summary.zombies}\n`);
  
  console.log('By Severity:');
  if (result.summary.critical > 0) console.log(`   🔴 Critical: ${result.summary.critical}`);
  if (result.summary.high > 0) console.log(`   🟠 High:     ${result.summary.high}`);
  if (result.summary.medium > 0) console.log(`   🟡 Medium:   ${result.summary.medium}`);
  if (result.summary.low > 0) console.log(`   🟢 Low:      ${result.summary.low}`);
  console.log();
  
  // Group issues by severity
  const criticalIssues = result.issues.filter(i => i.severity === 'critical');
  const highIssues = result.issues.filter(i => i.severity === 'high');
  const mediumIssues = result.issues.filter(i => i.severity === 'medium');
  const lowIssues = result.issues.filter(i => i.severity === 'low');
  
  let hasCritical = criticalIssues.length > 0 || highIssues.length > 0;
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 DETAILED ISSUES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Show critical first
  if (criticalIssues.length > 0) {
    console.log('🔴 CRITICAL ISSUES:\n');
    for (const issue of criticalIssues) {
      const emoji = EMOJI_MAP[issue.type];
      console.log(`${emoji} ${issue.id}`);
      console.log(`   File: ${issue.filePath}`);
      console.log(`   ${issue.message}`);
      if (issue.suggestion) console.log(`   💡 ${issue.suggestion}`);
      console.log();
    }
  }
  
  // Show high severity
  if (highIssues.length > 0) {
    console.log('🟠 HIGH SEVERITY:\n');
    for (const issue of highIssues) {
      const emoji = EMOJI_MAP[issue.type];
      console.log(`${emoji} ${issue.id}`);
      console.log(`   File: ${issue.filePath}`);
      console.log(`   ${issue.message}`);
      if (issue.suggestion) console.log(`   💡 ${issue.suggestion}`);
      console.log();
    }
  }
  
  // Show medium (limit to first 10)
  if (mediumIssues.length > 0) {
    console.log('🟡 MEDIUM SEVERITY:\n');
    const showCount = Math.min(mediumIssues.length, 10);
    for (let i = 0; i < showCount; i++) {
      const issue = mediumIssues[i];
      const emoji = EMOJI_MAP[issue.type];
      console.log(`${emoji} ${issue.id} - ${issue.filePath}`);
      console.log(`   ${issue.message}\n`);
    }
    if (mediumIssues.length > 10) {
      console.log(`   ... and ${mediumIssues.length - 10} more medium issues\n`);
    }
  }
  
  // Show low (just count)
  if (lowIssues.length > 0) {
    console.log(`🟢 LOW SEVERITY: ${lowIssues.length} minor issues (run with -v for details)\n`);
  }
  
  // Print recommendations
  if (result.recommendations.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 SMART RECOMMENDATIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    result.recommendations.forEach(rec => console.log(`   ${rec}`));
    console.log();
  }
  
  // Print action items
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 NEXT STEPS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (result.summary.critical > 0) {
    console.log('   ⚠️  URGENT: Fix critical issues immediately (security risks!)');
  }
  if (result.summary.high > 0) {
    console.log('   🔥 High priority: Address high severity issues soon');
  }
  if (result.summary.ghosts > 5) {
    console.log('   📝 Add tests for critical business logic first');
  }
  if (result.summary.curses > 0) {
    console.log('   🔧 Refactor structural issues to improve maintainability');
  }
  if (result.summary.zombies > 0) {
    console.log('   📁 Organize misplaced files into proper directories');
  }
  
  if (!deep && result.summary.totalIssues > 0) {
    console.log('\n   💡 Run "repoforge audit --deep" for code quality analysis');
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Save state for context memory
  const state = existingState || createState(result.profile, result.recommendations);
  const updatedState = updateStateWithAudit(state, result.issues, deep, deep ? 'audit --deep' : 'audit');
  saveState(repo.root, updatedState);
  
  // Check if we should fail based on failOnSeverity config
  if (cliConfig?.failOnSeverity) {
    const severityOrder: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SUGGESTION'];
    const thresholdIndex = severityOrder.indexOf(cliConfig.failOnSeverity);
    
    // Map old severity to new severity for comparison
    const severityMap: Record<string, Severity> = {
      'critical': 'CRITICAL',
      'high': 'HIGH',
      'medium': 'MEDIUM',
      'low': 'LOW'
    };
    
    const shouldFail = result.issues.some(issue => {
      const mappedSeverity = severityMap[issue.severity];
      if (!mappedSeverity) return false;
      
      const issueIndex = severityOrder.indexOf(mappedSeverity);
      return issueIndex !== -1 && issueIndex <= thresholdIndex;
    });
    
    return shouldFail ? 1 : 0;
  }
  
  // Default behavior: fail on critical/high
  return hasCritical ? 1 : 0;
}

async function handleMap(): Promise<void> {
  const root = process.cwd();
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🗺️  REPOSITORY MAP & FLOW ANALYSIS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const repo = scanRepo(root);
  const result: AuditResult = await smartAuditRepo(repo);
  const flowAnalysis = analyzeFlow(repo, result.profile);
  
  // 1. Project Overview
  console.log('📖 WHAT IS THIS PROJECT?\n');
  console.log(`   ${result.explanation}\n`);
  
  // 2. Technical Stack
  console.log('🔧 TECHNICAL STACK\n');
  console.log(`   Type: ${result.profile.type}`);
  console.log(`   Frameworks: ${result.profile.frameworks.join(', ')}`);
  console.log(`   Language: ${result.profile.hasTypeScript ? 'TypeScript' : 'JavaScript'}`);
  console.log(`   Package Manager: ${result.profile.packageManager}`);
  console.log(`   Tests: ${result.profile.hasTests ? 'Yes ✅' : 'No ❌'}\n`);
  
  // 3. Architecture & Flow
  if (flowAnalysis) {
    console.log('🏗️  ARCHITECTURE & CODE FLOW\n');
    console.log(`   Pattern: ${flowAnalysis.architecture.pattern}`);
    console.log(`   ${flowAnalysis.architecture.explanation}\n`);
    
    if (flowAnalysis.architecture.layers.length > 0) {
      console.log('   Layers detected:');
      flowAnalysis.architecture.layers.forEach((layer: string) => console.log(`     • ${layer}`));
      console.log();
    }
    
    // Entry points
    if (flowAnalysis.entryPoints.length > 0) {
      console.log('   📍 Entry Points:');
      flowAnalysis.entryPoints.slice(0, 5).forEach((ep: any) => {
        console.log(`     • ${ep.file} - ${ep.description}`);
      });
      console.log();
    }
    
    // Data flow
    if (flowAnalysis.dataFlow.patterns.length > 0) {
      console.log('   🔄 Data Flow:');
      flowAnalysis.dataFlow.patterns.forEach((p: string) => console.log(`     • ${p}`));
      console.log();
    }
    
    // API endpoints
    if (flowAnalysis.apiEndpoints.length > 0) {
      console.log('   🌐 API Endpoints (sample):');
      flowAnalysis.apiEndpoints.slice(0, 5).forEach((ep: any) => {
        console.log(`     • ${ep.path} (${ep.file})`);
      });
      console.log();
    }
    
    // Dependencies
    if (flowAnalysis.dependencies.external.length > 0) {
      console.log('   📦 Key Dependencies:');
      flowAnalysis.dependencies.external.slice(0, 8).forEach((dep: string) => {
        console.log(`     • ${dep}`);
      });
      console.log();
    }
  }
  
  // 4. Directory Structure
  console.log('📁 DIRECTORY STRUCTURE\n');
  const summary = summarizeStructure(repo);
  console.log(summary);
  console.log();
  
  // 5. Health Check & Recommendations
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💊 HEALTH CHECK & RECOMMENDATIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (result.issues.length === 0) {
    console.log('✨ Excellent! No structural issues found.\n');
    console.log('   Your project follows good practices:');
    console.log('   ✅ Clean organization');
    console.log('   ✅ Proper file structure');
    console.log('   ✅ Test coverage present\n');
  } else {
    console.log(`⚠️  Found ${result.summary.totalIssues} issues:\n`);
    console.log(`   👻 ${result.summary.ghosts} files without tests`);
    console.log(`   🧿 ${result.summary.curses} structural issues`);
    console.log(`   🧟 ${result.summary.zombies} misplaced files\n`);
  }
  
  // Architecture suggestions
  if (flowAnalysis && flowAnalysis.architecture.suggestions.length > 0) {
    console.log('   💡 Architecture Suggestions:');
    flowAnalysis.architecture.suggestions.forEach((s: string) => console.log(`     • ${s}`));
    console.log();
  }
  
  // General recommendations
  if (result.recommendations.length > 0) {
    console.log('   🎯 Recommendations:');
    result.recommendations.slice(0, 5).forEach(rec => console.log(`     ${rec}`));
    console.log();
  }
  
  console.log('   📝 Next Steps:');
  if (result.issues.length > 0) {
    console.log('     • Run "repoforge audit" for detailed issue analysis');
  }
  console.log('     • Run "repoforge audit --deep" for code quality check');
  console.log();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

function handleManifest(format: 'json' | 'yaml' = 'json'): void {
  console.log('\n📋 Generating Repository Manifest...\n');
  
  const repo = scanRepo(process.cwd());
  const manifest = generateManifest(repo);
  
  const output = format === 'yaml' ? manifestToYAML(manifest) : manifestToJSON(manifest);
  const fileName = `repoforge-manifest.${format}`;
  const filePath = path.join(process.cwd(), fileName);
  
  try {
    fs.writeFileSync(filePath, output, 'utf-8');
    console.log(`✅ Manifest generated: ${fileName}\n`);
    
    // Print summary
    console.log('📊 Manifest Summary:\n');
    console.log(`   Repository: ${manifest.repository.name}`);
    console.log(`   Type: ${manifest.profile.type}`);
    console.log(`   Frameworks: ${manifest.profile.frameworks.join(', ')}`);
    console.log(`   Total Files: ${manifest.repository.totalFiles}`);
    console.log(`   Total Size: ${(manifest.repository.totalSize / 1024).toFixed(2)} KB`);
    console.log(`   Languages: ${manifest.languages.map(l => l.language).join(', ')}`);
    console.log(`   Test Coverage: ${manifest.quality.testCoverage}%`);
    console.log(`   Has Linting: ${manifest.quality.hasLinting ? '✅' : '❌'}`);
    console.log(`   Has CI/CD: ${manifest.quality.hasCI ? '✅' : '❌'}`);
    console.log();
    
    console.log('📖 Documentation:');
    console.log(`   README: ${manifest.documentation.readme ? '✅' : '❌'}`);
    console.log(`   License: ${manifest.documentation.license || '❌'}`);
    console.log();
    
    console.log(`💡 Use this manifest for:`);
    console.log(`   • AI-powered code understanding`);
    console.log(`   • Automated documentation generation`);
    console.log(`   • Project onboarding`);
    console.log(`   • Dependency analysis`);
    console.log(`   • Architecture visualization\n`);
    
  } catch (error) {
    console.error('❌ Failed to write manifest file:', error);
    process.exit(1);
  }
}

async function handleDoctor(): Promise<void> {
  console.log('\n🏥 RepoForge Doctor - Comprehensive Health Check\n');
  
  const root = process.cwd();
  const repo = scanRepo(root);
  
  // Load existing state
  const existingState = loadState(root);
  
  const auditResult: AuditResult = await smartAuditRepo(repo);
  const doctorReport = runDoctor(repo, auditResult.profile, auditResult);
  
  // Show overall status
  const statusEmoji = {
    excellent: '🎉',
    good: '✅',
    fair: '⚠️',
    poor: '🔴',
    critical: '🚨'
  };
  
  console.log(`${statusEmoji[doctorReport.overall]} Overall Health: ${doctorReport.overall.toUpperCase()}`);
  console.log(`📊 Score: ${doctorReport.score}/100\n`);
  
  // Show critical issues first
  if (doctorReport.criticalIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES:\n');
    doctorReport.criticalIssues.forEach(issue => {
      console.log(`   ⚠️  ${issue}`);
    });
    console.log();
  }
  
  // Show sections
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 HEALTH CHECK SECTIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const sections = [
    { name: 'Structure', data: doctorReport.sections.structure },
    { name: 'Testing', data: doctorReport.sections.testing },
    { name: 'Code Quality', data: doctorReport.sections.codeQuality },
    { name: 'Documentation', data: doctorReport.sections.documentation },
    { name: 'Architecture', data: doctorReport.sections.architecture }
  ];
  
  sections.forEach(({ name, data }) => {
    const emoji = data.status === 'excellent' ? '🎉' : 
                  data.status === 'good' ? '✅' : 
                  data.status === 'fair' ? '⚠️' : '🔴';
    
    console.log(`${emoji} ${name}: ${data.status} (${data.score}/100)`);
    data.findings.forEach(f => console.log(`   • ${f}`));
    if (data.suggestions.length > 0) {
      console.log(`   💡 Suggestions:`);
      data.suggestions.forEach(s => console.log(`      - ${s}`));
    }
    console.log();
  });
  
  // Show quick wins
  if (doctorReport.quickWins.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ QUICK WINS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    doctorReport.quickWins.forEach(win => console.log(`   ⚡ ${win}`));
    console.log();
  }
  
  // Show recommendations
  // Show file-specific issues
  const hasFileIssues = doctorReport.fileIssues.ghosts.length > 0 || 
                        doctorReport.fileIssues.curses.length > 0 || 
                        doctorReport.fileIssues.zombies.length > 0;
  
  if (hasFileIssues) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📁 FILES WITH ISSUES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Show ghosts
    if (doctorReport.fileIssues.ghosts.length > 0) {
      console.log('👻 Ghosts (Missing Tests):\n');
      doctorReport.fileIssues.ghosts.forEach(issue => {
        console.log(`   📄 ${issue.file}`);
        console.log(`      Issue: ${issue.issue}`);
        if (issue.suggestion) console.log(`      💡 ${issue.suggestion}`);
        console.log();
      });
    }
    
    // Show curses
    if (doctorReport.fileIssues.curses.length > 0) {
      console.log('🧿 Curses (Structural Issues):\n');
      doctorReport.fileIssues.curses.slice(0, 5).forEach(issue => {
        const severityEmoji = issue.severity === 'critical' ? '🔴' : 
                             issue.severity === 'high' ? '🟠' : 
                             issue.severity === 'medium' ? '🟡' : '🟢';
        console.log(`   ${severityEmoji} ${issue.file}`);
        console.log(`      Issue: ${issue.issue}`);
        if (issue.suggestion) console.log(`      💡 ${issue.suggestion.substring(0, 80)}${issue.suggestion.length > 80 ? '...' : ''}`);
        console.log();
      });
      if (doctorReport.fileIssues.curses.length > 5) {
        console.log(`   ... and ${doctorReport.fileIssues.curses.length - 5} more curse(s)\n`);
      }
    }
    
    // Show zombies
    if (doctorReport.fileIssues.zombies.length > 0) {
      console.log('🧟 Zombies (Misplaced Code):\n');
      doctorReport.fileIssues.zombies.forEach(issue => {
        console.log(`   📄 ${issue.file}`);
        console.log(`      Issue: ${issue.issue}`);
        if (issue.suggestion) console.log(`      💡 ${issue.suggestion}`);
        console.log();
      });
    }
  }
  
  if (doctorReport.recommendations.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 RECOMMENDATIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    doctorReport.recommendations.slice(0, 5).forEach(rec => console.log(`   ${rec}`));
    console.log();
  }
  
  // Show next steps
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 NEXT STEPS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  doctorReport.nextSteps.forEach((step, i) => console.log(`   ${i + 1}. ${step}`));
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Save state for context memory
  const state = existingState || createState(auditResult.profile, auditResult.recommendations);
  const updatedState = updateStateWithAudit(state, auditResult.issues, false, 'doctor');
  saveState(root, updatedState);
}

function handleKiroSetup(): void {
  console.log('\n🎃 RepoForge Kiro Setup\n');
  console.log('Setting up Kiro IDE integration...\n');
  
  const root = process.cwd();
  const kiroDir = path.join(root, '.kiro');
  const settingsDir = path.join(kiroDir, 'settings');
  const hooksDir = path.join(kiroDir, 'hooks');
  const specsDir = path.join(kiroDir, 'specs');
  const steeringDir = path.join(kiroDir, 'steering');
  
  // Create directories
  [kiroDir, settingsDir, hooksDir, specsDir, steeringDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created: ${path.relative(root, dir)}/`);
    } else {
      console.log(`⏭️  Exists: ${path.relative(root, dir)}/`);
    }
  });
  
  // Create MCP configuration
  const mcpConfigPath = path.join(settingsDir, 'mcp.json');
  if (!fs.existsSync(mcpConfigPath)) {
    const mcpConfig = {
      mcpServers: {
        repoforge: {
          command: "npx",
          args: ["repoforge-mcp"],
          env: {},
          disabled: false,
          autoApprove: [
            "repoforge_audit_repo",
            "repoforge_audit_summary",
            "repoforge_generate_code",
            "repoforge_generate_manifest"
          ],
          disabledTools: []
        }
      }
    };
    fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
    console.log(`✅ Created: .kiro/settings/mcp.json`);
  } else {
    console.log(`⏭️  Exists: .kiro/settings/mcp.json`);
  }
  
  // Create hook
  const hookPath = path.join(hooksDir, 'repoforge-spooky-audit.yaml');
  if (!fs.existsSync(hookPath)) {
    const hookContent = `id: repoforge-spooky-audit
description: Run a RepoForge audit when the user asks for a spooky audit or spook check.
trigger:
  type: message_pattern
  pattern: "(?i)spooky audit|spook check|repoforge audit"
actions:
  - type: mcp_call
    server: repoforge
    tool: repoforge_audit_summary
    args:
      root: "."
  - type: reply
    template: |
      I ran RepoForge on this repo. Here is the spooky summary:

      {{tool_output}}
`;
    fs.writeFileSync(hookPath, hookContent);
    console.log(`✅ Created: .kiro/hooks/repoforge-spooky-audit.yaml`);
  } else {
    console.log(`⏭️  Exists: .kiro/hooks/repoforge-spooky-audit.yaml`);
  }
  
  // Create spec
  const specPath = path.join(specsDir, 'repoforge.yaml');
  if (!fs.existsSync(specPath)) {
    const specContent = `id: repoforge
name: RepoForge – Spooky Repo Auditor
summary: >
  CLI and MCP tool that audits a codebase for ghosts (missing tests),
  curses (structural issues), and zombies (misplaced code).

capabilities:
  cli:
    commands:
      - name: audit
        description: Scan the repo for ghosts, curses, and zombies
      - name: doctor
        description: Comprehensive health check with recommendations
      - name: map
        description: Summarize the repo structure
  mcp:
    server: repoforge
    tools:
      - name: repoforge_audit_repo
        description: Full audit with detailed issue list
      - name: repoforge_audit_summary
        description: Quick health check summary
      - name: repoforge_generate_code
        description: AI-powered code generation
      - name: repoforge_generate_manifest
        description: Generate repository manifest
`;
    fs.writeFileSync(specPath, specContent);
    console.log(`✅ Created: .kiro/specs/repoforge.yaml`);
  } else {
    console.log(`⏭️  Exists: .kiro/specs/repoforge.yaml`);
  }
  
  // Create steering
  const steeringPath = path.join(steeringDir, 'repoforge.md');
  if (!fs.existsSync(steeringPath)) {
    const steeringContent = `# RepoForge Steering

You have access to RepoForge MCP tools for codebase analysis.

## When to use RepoForge tools

Use **repoforge_audit_repo** for detailed analysis.
Use **repoforge_audit_summary** for quick health checks.
Use **repoforge_generate_code** for AI code generation.
Use **repoforge_generate_manifest** for documentation.

## Issue types

- **Ghosts** 👻 - Files missing tests
- **Curses** 🧿 - Structural issues, naming, complexity
- **Zombies** 🧟 - Misplaced code, dead code

Always explain results in plain language and provide actionable next steps.
`;
    fs.writeFileSync(steeringPath, steeringContent);
    console.log(`✅ Created: .kiro/steering/repoforge.md`);
  } else {
    console.log(`⏭️  Exists: .kiro/steering/repoforge.md`);
  }
  
  console.log('\n🎉 Kiro IDE integration setup complete!\n');
  console.log('Next steps:');
  console.log('  1. Restart Kiro IDE or reconnect MCP servers');
  console.log('  2. Open this project in Kiro IDE');
  console.log('  3. Try: "Run a spooky audit" in chat\n');
}


function handleRulesList(): void {
  console.log('\n📋 RepoForge Rules\n');
  
  const root = process.cwd();
  
  // Load configuration to get disabled rules
  const config = ConfigLoader.loadConfig(root);
  const disabledRuleIds = config.disabledRules || [];
  
  // Create registry and load all built-in rules
  const registry = new RuleRegistry();
  
  // Import and register all built-in rules
  // Note: In a real implementation, we'd dynamically load these
  // For now, we'll just show the structure
  
  const rulesWithStatus = registry.getAllWithStatus(disabledRuleIds);
  
  if (rulesWithStatus.length === 0) {
    console.log('No rules registered.\n');
    return;
  }
  
  // Group by category
  const byCategory: Record<string, typeof rulesWithStatus> = {};
  for (const rule of rulesWithStatus) {
    if (!byCategory[rule.category]) {
      byCategory[rule.category] = [];
    }
    byCategory[rule.category].push(rule);
  }
  
  // Display rules by category
  const categories = Object.keys(byCategory).sort();
  
  for (const category of categories) {
    console.log(`\n${category}:`);
    console.log('─'.repeat(50));
    
    const rules = byCategory[category];
    for (const rule of rules) {
      const statusIcon = rule.disabled ? '❌' : '✅';
      const statusText = rule.disabled ? '(DISABLED)' : '';
      const severityColor = 
        rule.severity === 'CRITICAL' ? '\x1b[91m' :
        rule.severity === 'HIGH' ? '\x1b[31m' :
        rule.severity === 'MEDIUM' ? '\x1b[33m' :
        rule.severity === 'LOW' ? '\x1b[36m' : '\x1b[90m';
      
      console.log(`  ${statusIcon} ${rule.id} ${statusText}`);
      console.log(`     ${rule.name}`);
      console.log(`     Severity: ${severityColor}${rule.severity}\x1b[0m`);
      console.log(`     ${rule.description}`);
      console.log();
    }
  }
  
  // Summary
  const totalRules = rulesWithStatus.length;
  const disabledCount = rulesWithStatus.filter(r => r.disabled).length;
  const enabledCount = totalRules - disabledCount;
  
  console.log('─'.repeat(50));
  console.log(`\nTotal: ${totalRules} rules (${enabledCount} enabled, ${disabledCount} disabled)\n`);
  
  if (disabledCount > 0) {
    console.log('💡 To enable a disabled rule, remove it from .repoforge/rules.json\n');
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  const subcommand = args[1];
  const flags = args.slice(1);
  
  try {
    switch (command) {
      case 'init':
        handleInit();
        break;
      
      case 'generate': {
        const prompt = flags.join(' ');
        await handleGenerate(prompt);
        break;
      }
      
      case 'audit': {
        const { deep, config } = parseAuditFlags(flags);
        const exitCode = await handleAudit(deep, config);
        process.exit(exitCode);
        break;
      }
      
      case 'doctor':
        await handleDoctor();
        break;
      
      case 'map':
        await handleMap();
        break;
      
      case 'manifest': {
        const format = flags.includes('--yaml') ? 'yaml' : 'json';
        handleManifest(format);
        break;
      }
      
      case 'rules':
        if (subcommand === 'list') {
          handleRulesList();
        } else {
          console.error('Unknown rules subcommand. Use: repoforge rules list');
          process.exit(1);
        }
        break;
      
      case 'kiro-setup':
        handleKiroSetup();
        break;

      case 'help':
        printUsage();
        break;
      
      default:
        printUsage();
        process.exit(1);
    }
  } catch (err) {
    console.error('[RepoForge] Unexpected error:');
    console.error(err);
    process.exit(1);
  }
}

main();
