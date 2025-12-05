/**
 * Audit Rules - Migration of existing audit logic to Rule Engine
 * Converts ghost, curse, and zombie detection into proper rules
 */

import * as path from 'path';
import * as fs from 'fs';
import { Rule, RuleContext, Violation } from './types';

const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const TEST_SUFFIXES = [
  '.test.ts',
  '.spec.ts',
  '.test.tsx',
  '.spec.tsx',
  '.test.js',
  '.spec.js',
  '.test.jsx',
  '.spec.jsx',
];

function isCodeFile(filePath: string): boolean {
  return CODE_EXTENSIONS.some((ext) => filePath.endsWith(ext));
}

function isTestFile(filePath: string): boolean {
  return TEST_SUFFIXES.some((suffix) => filePath.endsWith(suffix));
}

function getTestVariants(filePath: string): string[] {
  const ext = path.extname(filePath);
  const baseName = filePath.slice(0, -ext.length);

  return [`${baseName}.test${ext}`, `${baseName}.spec${ext}`];
}

/**
 * 👻 GHOST_MISSING_TEST Rule
 * Detects code files in src/ with no matching test file
 */
export const GHOST_MISSING_TEST: Rule = {
  id: 'GHOST_MISSING_TEST',
  name: 'Missing Test File',
  category: 'Testing',
  severity: 'MEDIUM',
  description: 'Code files in main directories should have corresponding test files',
  tags: ['testing', 'coverage', 'ghost'],
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    const allPaths = new Set(context.allFiles);
    
    // Determine main code directories
    const codeDirectories = ['src/', 'lib/', 'core/'];
    const mainCodeDir = codeDirectories.find(dir => 
      context.allFiles.some(f => f.startsWith(dir))
    ) || 'src/';
    
    // Only check files in main code directory
    if (!context.filePath.startsWith(mainCodeDir)) {
      return violations;
    }
    
    // Skip if it's already a test file or type definition
    if (isTestFile(context.filePath) || context.filePath.endsWith('.d.ts')) {
      return violations;
    }
    
    // Skip if not a code file
    if (!isCodeFile(context.filePath)) {
      return violations;
    }
    
    // Check for test variants
    const testVariants = getTestVariants(context.filePath);
    
    // Also check for tests in tests/ or test/ directories
    const fileName = path.basename(context.filePath);
    const testDirVariants = [
      `tests/${fileName.replace(/\.(ts|js|tsx|jsx)$/, '.test$1')}`,
      `test/${fileName.replace(/\.(ts|js|tsx|jsx)$/, '.test$1')}`,
      `tests/${fileName.replace(/\.(ts|js|tsx|jsx)$/, '.spec$1')}`,
      `test/${fileName.replace(/\.(ts|js|tsx|jsx)$/, '.spec$1')}`,
    ];
    
    const hasTest = [...testVariants, ...testDirVariants].some((variant) => allPaths.has(variant));
    
    if (!hasTest) {
      const suggestedTestFile = path.basename(testVariants[0] ?? '');
      
      violations.push({
        ruleId: GHOST_MISSING_TEST.id,
        ruleName: GHOST_MISSING_TEST.name,
        severity: GHOST_MISSING_TEST.severity,
        category: GHOST_MISSING_TEST.category,
        message: `File "${context.filePath}" has no matching test file and is haunting the repo as a ghost.`,
        filePath: context.filePath,
        fixSuggestion: `Create a test file: ${suggestedTestFile}. Add unit tests to verify the functionality of this module.`,
        explanation: 'Code without tests is harder to maintain and refactor safely. Tests serve as documentation and catch regressions early.',
      });
    }
    
    return violations;
  },
};

// Helper functions for naming conventions
function isCamelCase(name: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/.test(name);
}

function isPascalCase(name: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

function isSnakeCase(name: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(name) && name.includes('_');
}

function isKebabCase(name: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(name) && name.includes('-');
}

/**
 * 🧿 CURSE_NAMING_SERVICE Rule
 * Services should use camelCase or PascalCase
 */
export const CURSE_NAMING_SERVICE: Rule = {
  id: 'CURSE_NAMING_SERVICE',
  name: 'Service Naming Convention',
  category: 'Style',
  severity: 'LOW',
  description: 'Service files should use camelCase or PascalCase naming',
  tags: ['naming', 'style', 'curse'],
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Only check files in services directory
    if (!context.filePath.includes('/services/') || !isCodeFile(context.filePath)) {
      return violations;
    }
    
    const baseName = path.basename(context.filePath, path.extname(context.filePath));
    
    if (!isCamelCase(baseName) && !isPascalCase(baseName)) {
      violations.push({
        ruleId: CURSE_NAMING_SERVICE.id,
        ruleName: CURSE_NAMING_SERVICE.name,
        severity: CURSE_NAMING_SERVICE.severity,
        category: CURSE_NAMING_SERVICE.category,
        message: `Service file "${context.filePath}" should use camelCase or PascalCase.`,
        filePath: context.filePath,
        fixSuggestion: 'Rename to follow camelCase (userService.ts) or PascalCase (UserService.ts) convention',
        explanation: 'Consistent naming conventions improve code readability and help developers quickly identify file types.',
      });
    }
    
    return violations;
  },
};

/**
 * 🧿 CURSE_NAMING_COMPONENT Rule
 * Components should use PascalCase
 */
export const CURSE_NAMING_COMPONENT: Rule = {
  id: 'CURSE_NAMING_COMPONENT',
  name: 'Component Naming Convention',
  category: 'Style',
  severity: 'MEDIUM',
  description: 'Component files should use PascalCase naming',
  tags: ['naming', 'style', 'curse', 'react'],
  frameworks: ['react', 'next', 'vue'],
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Only check component files
    const isComponent = (context.filePath.includes('/components/') || context.filePath.includes('/Component')) &&
                       (context.filePath.endsWith('.tsx') || context.filePath.endsWith('.jsx'));
    
    if (!isComponent) {
      return violations;
    }
    
    const baseName = path.basename(context.filePath, path.extname(context.filePath));
    
    if (!isPascalCase(baseName)) {
      violations.push({
        ruleId: CURSE_NAMING_COMPONENT.id,
        ruleName: CURSE_NAMING_COMPONENT.name,
        severity: CURSE_NAMING_COMPONENT.severity,
        category: CURSE_NAMING_COMPONENT.category,
        message: `Component "${context.filePath}" should use PascalCase naming.`,
        filePath: context.filePath,
        fixSuggestion: 'Rename component to PascalCase (Button.tsx, UserCard.tsx)',
        explanation: 'PascalCase is the standard convention for React components, making them easily distinguishable from regular functions and variables.',
      });
    }
    
    return violations;
  },
};

/**
 * 🧿 CURSE_NAMING_MODEL Rule
 * Models/Types should use PascalCase or camelCase
 */
export const CURSE_NAMING_MODEL: Rule = {
  id: 'CURSE_NAMING_MODEL',
  name: 'Model/Type Naming Convention',
  category: 'Style',
  severity: 'LOW',
  description: 'Model and type files should use PascalCase or camelCase naming',
  tags: ['naming', 'style', 'curse'],
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Only check model/type files
    const isModelFile = (context.filePath.includes('/models/') || context.filePath.includes('/types/')) &&
                        isCodeFile(context.filePath) &&
                        !context.filePath.endsWith('.d.ts');
    
    if (!isModelFile) {
      return violations;
    }
    
    const baseName = path.basename(context.filePath, path.extname(context.filePath));
    
    if (!isPascalCase(baseName) && !isCamelCase(baseName)) {
      violations.push({
        ruleId: CURSE_NAMING_MODEL.id,
        ruleName: CURSE_NAMING_MODEL.name,
        severity: CURSE_NAMING_MODEL.severity,
        category: CURSE_NAMING_MODEL.category,
        message: `Model/Type file "${context.filePath}" should use PascalCase or camelCase.`,
        filePath: context.filePath,
        fixSuggestion: 'Follow consistent naming convention: PascalCase (User.ts) or camelCase (user.ts)',
        explanation: 'Consistent naming helps developers understand the purpose and structure of data models at a glance.',
      });
    }
    
    return violations;
  },
};

/**
 * 🧿 CURSE_NAMING_UTIL Rule
 * Utils/Helpers should use camelCase or kebab-case
 */
export const CURSE_NAMING_UTIL: Rule = {
  id: 'CURSE_NAMING_UTIL',
  name: 'Utility Naming Convention',
  category: 'Style',
  severity: 'LOW',
  description: 'Utility files should use camelCase or kebab-case naming',
  tags: ['naming', 'style', 'curse'],
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Only check utility files
    const isUtilFile = (context.filePath.includes('/utils/') || context.filePath.includes('/helpers/')) &&
                       isCodeFile(context.filePath);
    
    if (!isUtilFile) {
      return violations;
    }
    
    const baseName = path.basename(context.filePath, path.extname(context.filePath));
    
    if (!isCamelCase(baseName) && !isKebabCase(baseName)) {
      violations.push({
        ruleId: CURSE_NAMING_UTIL.id,
        ruleName: CURSE_NAMING_UTIL.name,
        severity: CURSE_NAMING_UTIL.severity,
        category: CURSE_NAMING_UTIL.category,
        message: `Utility file "${context.filePath}" should use camelCase or kebab-case.`,
        filePath: context.filePath,
        fixSuggestion: 'Use camelCase (dateUtils.ts) or kebab-case (date-utils.ts) for utility files',
        explanation: 'Consistent naming conventions make utility files easy to locate and understand their purpose.',
      });
    }
    
    return violations;
  },
};

/**
 * 🧿 CURSE_NAMING_SNAKE_CASE Rule
 * Detect inappropriate snake_case in JS/TS files
 */
export const CURSE_NAMING_SNAKE_CASE: Rule = {
  id: 'CURSE_NAMING_SNAKE_CASE',
  name: 'Snake Case in JS/TS',
  category: 'Style',
  severity: 'LOW',
  description: 'JavaScript/TypeScript files should not use snake_case naming',
  tags: ['naming', 'style', 'curse'],
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Skip test files and node_modules
    if (isTestFile(context.filePath) || context.filePath.includes('node_modules')) {
      return violations;
    }
    
    // Only check code files
    if (!isCodeFile(context.filePath)) {
      return violations;
    }
    
    const baseName = path.basename(context.filePath, path.extname(context.filePath));
    
    if (isSnakeCase(baseName)) {
      violations.push({
        ruleId: CURSE_NAMING_SNAKE_CASE.id,
        ruleName: CURSE_NAMING_SNAKE_CASE.name,
        severity: CURSE_NAMING_SNAKE_CASE.severity,
        category: CURSE_NAMING_SNAKE_CASE.category,
        message: `File "${context.filePath}" uses snake_case naming. JavaScript/TypeScript typically uses camelCase or PascalCase.`,
        filePath: context.filePath,
        fixSuggestion: 'Convert to camelCase or PascalCase to follow JavaScript/TypeScript conventions',
        explanation: 'snake_case is uncommon in JavaScript/TypeScript ecosystems. Using camelCase or PascalCase aligns with community standards.',
      });
    }
    
    return violations;
  },
};

/**
 * 🧿 CURSE_MONOLITHIC_FILE Rule
 * Detect overly large files with context-aware thresholds
 */
export const CURSE_MONOLITHIC_FILE: Rule = {
  id: 'CURSE_MONOLITHIC_FILE',
  name: 'Monolithic File',
  category: 'Maintainability',
  severity: 'MEDIUM',
  description: 'Files should not exceed reasonable line count thresholds',
  tags: ['maintainability', 'size', 'curse'],
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Skip test files
    if (isTestFile(context.filePath)) {
      return violations;
    }
    
    // Only check files in main directories
    const mainDirs = ['src/', 'lib/', 'core/'];
    if (!mainDirs.some(dir => context.filePath.startsWith(dir))) {
      return violations;
    }
    
    // Only check code files
    if (!isCodeFile(context.filePath)) {
      return violations;
    }
    
    // Context-aware thresholds
    const THRESHOLDS = {
      component: 400,    // UI components
      controller: 500,   // Controllers/routes
      service: 600,      // Business logic services
      model: 400,        // Data models
      config: 800,       // Config files
      default: 500       // General threshold
    };
    
    const lowerPath = context.filePath.toLowerCase();
    let threshold = THRESHOLDS.default;
    
    if (lowerPath.includes('/component') || context.filePath.match(/\.(jsx|tsx)$/)) {
      threshold = THRESHOLDS.component;
    } else if (lowerPath.includes('/controller') || lowerPath.includes('/route')) {
      threshold = THRESHOLDS.controller;
    } else if (lowerPath.includes('/service')) {
      threshold = THRESHOLDS.service;
    } else if (lowerPath.includes('/model')) {
      threshold = THRESHOLDS.model;
    } else if (lowerPath.includes('config')) {
      threshold = THRESHOLDS.config;
    }
    
    const lineCount = context.fileContent.split(/\r?\n/).length;
    
    if (lineCount > threshold) {
      const severity = lineCount > threshold * 2 ? 'HIGH' : 'MEDIUM';
      
      violations.push({
        ruleId: CURSE_MONOLITHIC_FILE.id,
        ruleName: CURSE_MONOLITHIC_FILE.name,
        severity,
        category: CURSE_MONOLITHIC_FILE.category,
        message: `File "${context.filePath}" is monstrously long (${lineCount} lines, threshold: ${threshold}).`,
        filePath: context.filePath,
        fixSuggestion: 'Consider splitting this file into smaller, focused modules. Extract related functions into separate files, or break down large classes into smaller components.',
        explanation: 'Large files are harder to understand, test, and maintain. Breaking them into smaller modules improves code organization and makes the codebase more navigable.',
      });
    }
    
    return violations;
  },
};

/**
 * 🧿 CURSE_MIXED_FRONTEND_BACKEND Rule
 * Detect mixed frontend/backend code in same folder
 */
export const CURSE_MIXED_FRONTEND_BACKEND: Rule = {
  id: 'CURSE_MIXED_FRONTEND_BACKEND',
  name: 'Mixed Frontend/Backend Layers',
  category: 'Architecture',
  severity: 'MEDIUM',
  description: 'Folders should not mix frontend and backend code',
  tags: ['architecture', 'layers', 'curse'],
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // This rule needs to analyze at folder level, not file level
    // We'll check if the current file's folder has mixed concerns
    
    if (!context.filePath.startsWith('src/') || !isCodeFile(context.filePath)) {
      return violations;
    }
    
    const folderPath = context.filePath.split('/').slice(0, -1).join('/');
    
    // Get all files in the same folder
    const folderFiles = context.allFiles.filter(f => {
      const fileFolder = f.split('/').slice(0, -1).join('/');
      return fileFolder === folderPath && isCodeFile(f);
    });
    
    // Classify files as frontend or backend
    let hasFrontend = false;
    let hasBackend = false;
    let exampleFrontend = '';
    let exampleBackend = '';
    
    for (const file of folderFiles) {
      const role = guessFileRole(file, context.fileContent);
      
      if (role === 'frontend' && !hasFrontend) {
        hasFrontend = true;
        exampleFrontend = file;
      }
      if (role === 'backend' && !hasBackend) {
        hasBackend = true;
        exampleBackend = file;
      }
    }
    
    // Only report once per folder (on the first file we encounter)
    if (hasFrontend && hasBackend && context.filePath === folderFiles[0]) {
      violations.push({
        ruleId: CURSE_MIXED_FRONTEND_BACKEND.id,
        ruleName: CURSE_MIXED_FRONTEND_BACKEND.name,
        severity: CURSE_MIXED_FRONTEND_BACKEND.severity,
        category: CURSE_MIXED_FRONTEND_BACKEND.category,
        message: `Folder "${folderPath}" mixes frontend and backend code.`,
        filePath: folderPath,
        fixSuggestion: `Consider separating layers into distinct directories (e.g., src/frontend/ and src/backend/). Example frontend: "${exampleFrontend}", backend: "${exampleBackend}".`,
        explanation: 'Mixing frontend and backend code in the same folder violates separation of concerns and makes the architecture harder to understand and maintain.',
      });
    }
    
    return violations;
  },
};

/**
 * Helper to guess if a file is frontend or backend
 */
type FileRole = 'frontend' | 'backend' | 'unknown';

function guessFileRole(filePath: string, fileContent: string): FileRole {
  const lowerPath = filePath.toLowerCase();
  
  // Path-based hints
  const frontendHints = [
    '/components/',
    '/pages/',
    '/hooks/',
    '/styles/',
    '/ui/',
    '/public/',
    '/assets/',
    '/frontend/',
    '/client/',
  ];
  const backendHints = [
    '/routes/',
    '/controllers/',
    '/services/',
    '/models/',
    '/api/',
    '/server/',
    '/backend/',
    '/db/',
    '/repositories/',
  ];
  
  if (frontendHints.some((h) => lowerPath.includes(h))) {
    return 'frontend';
  }
  if (backendHints.some((h) => lowerPath.includes(h))) {
    return 'backend';
  }
  
  // Content-based hints
  const lower = fileContent.toLowerCase();
  
  // Frontend keywords
  if (
    lower.includes(`from "react"`) ||
    lower.includes(`from 'react'`) ||
    lower.includes('reactdom') ||
    lower.includes('nextpage') ||
    lower.includes('jsx') ||
    lower.includes('tsx')
  ) {
    return 'frontend';
  }
  
  // Backend keywords
  if (
    lower.includes(`from "express"`) ||
    lower.includes(`from 'express'`) ||
    lower.includes("require('express')") ||
    lower.includes('require("express")') ||
    lower.includes('@nestjs/') ||
    lower.includes('fastify') ||
    lower.includes('koa')
  ) {
    return 'backend';
  }
  
  return 'unknown';
}

/**
 * 🧟 ZOMBIE_OUTSIDE_SRC Rule
 * Detect code files living outside standard directories
 */
export const ZOMBIE_OUTSIDE_SRC: Rule = {
  id: 'ZOMBIE_OUTSIDE_SRC',
  name: 'Code Outside Standard Directories',
  category: 'Architecture',
  severity: 'LOW',
  description: 'Code files should be organized in standard directories',
  tags: ['architecture', 'organization', 'zombie'],
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Only check code files
    if (!isCodeFile(context.filePath)) {
      return violations;
    }
    
    // Skip build artifacts and node_modules
    const shouldSkip = (p: string) => 
      p.includes('/.next/') || p.startsWith('.next/') ||
      p.includes('/.nuxt/') || p.startsWith('.nuxt/') ||
      p.includes('/dist/') || p.startsWith('dist/') ||
      p.includes('/build/') || p.startsWith('build/') ||
      p.includes('/out/') || p.startsWith('out/') ||
      p.includes('/node_modules/') || p.startsWith('node_modules/') ||
      p.endsWith('.d.ts');
    
    if (shouldSkip(context.filePath)) {
      return violations;
    }
    
    // Detect framework-specific structures
    const isNextJS = context.allFiles.some(f => 
      f.includes('next.config.js') || f.includes('next.config.ts') || 
      f.startsWith('app/') || f.includes('/app/')
    );
    const isNuxt = context.allFiles.some(f => 
      f.includes('nuxt.config.js') || f.includes('nuxt.config.ts')
    );
    
    // Check for alternative structures
    const hasAlternativeStructure = context.allFiles.some(f => 
      f.startsWith('core/') || f.startsWith('packages/') || f.startsWith('apps/') ||
      f.startsWith('cli/') || f.startsWith('mcp-server/')
    );
    
    // Framework-valid directories
    const validPatterns: string[] = ['src/', 'tests/', 'test/', '__tests__/'];
    if (isNextJS) {
      validPatterns.push('app/', 'pages/', 'components/', 'lib/', 'public/', 
                        'styles/', 'utils/', 'hooks/', 'types/');
    }
    if (isNuxt) {
      validPatterns.push('pages/', 'components/', 'layouts/', 'middleware/', 
                        'plugins/', 'store/', 'assets/', 'static/', 'composables/');
    }
    if (hasAlternativeStructure) {
      validPatterns.push('core/', 'packages/', 'apps/', 'cli/', 'mcp-server/');
    }
    
    // Check if path is in a valid directory
    const isInValidDir = (p: string): boolean => {
      return validPatterns.some(pattern => 
        p.startsWith(pattern) || p.includes(`/${pattern}`)
      );
    };
    
    // Valid root config files
    const validRootFiles = new Set([
      'next.config.js', 'next.config.ts', 'nuxt.config.js', 'nuxt.config.ts',
      'vite.config.js', 'vite.config.ts', 'webpack.config.js', 'tailwind.config.js',
      'postcss.config.js', 'playwright.config.ts', 'vitest.config.ts', 'jest.config.js',
      'next-env.d.ts', 'index.ts', 'index.js', 'main.ts', 'app.ts'
    ]);
    
    const fileName = context.filePath.split('/').pop() || '';
    
    // Allow valid config files
    if (validRootFiles.has(fileName)) {
      return violations;
    }
    
    // Check if file is in valid directory
    if (isInValidDir(context.filePath)) {
      return violations;
    }
    
    // File is a zombie!
    const suggestion = isNextJS || isNuxt || hasAlternativeStructure 
      ? 'Consider organizing it into the appropriate directory for your framework.'
      : 'Move it to src/ or another standard directory to improve project organization.';
    
    violations.push({
      ruleId: ZOMBIE_OUTSIDE_SRC.id,
      ruleName: ZOMBIE_OUTSIDE_SRC.name,
      severity: ZOMBIE_OUTSIDE_SRC.severity,
      category: ZOMBIE_OUTSIDE_SRC.category,
      message: `Code file "${context.filePath}" is outside standard directories.`,
      filePath: context.filePath,
      fixSuggestion: suggestion,
      explanation: 'Code files outside standard directories make the project structure harder to understand and navigate. Organizing code in conventional locations improves maintainability.',
    });
    
    return violations;
  },
};

// Export all audit rules as an array for easy registration
export const AUDIT_RULES: Rule[] = [
  GHOST_MISSING_TEST,
  CURSE_NAMING_SERVICE,
  CURSE_NAMING_COMPONENT,
  CURSE_NAMING_MODEL,
  CURSE_NAMING_UTIL,
  CURSE_NAMING_SNAKE_CASE,
  CURSE_MONOLITHIC_FILE,
  CURSE_MIXED_FRONTEND_BACKEND,
  ZOMBIE_OUTSIDE_SRC,
];

