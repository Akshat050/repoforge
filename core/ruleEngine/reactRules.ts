/**
 * React-Specific Rules
 * Rules for detecting common issues in React and Next.js applications
 */

import { Rule, RuleContext, Violation } from './types';

/**
 * Helper function to get line number from string index
 */
function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}

/**
 * Helper function to extract code snippet around a match
 */
function extractSnippet(content: string, index: number, contextLines: number = 2): string {
  const lines = content.split('\n');
  const lineNumber = getLineNumber(content, index);
  const startLine = Math.max(0, lineNumber - contextLines - 1);
  const endLine = Math.min(lines.length, lineNumber + contextLines);
  
  return lines.slice(startLine, endLine).join('\n');
}

/**
 * REACT001: Async useEffect Detection
 * Detects async functions directly in useEffect which can cause issues
 */
export const asyncUseEffectRule: Rule = {
  id: 'REACT001_ASYNC_USEEFFECT',
  name: 'Async useEffect',
  category: 'Architecture',
  severity: 'HIGH',
  description: 'Detects async functions directly in useEffect which can cause race conditions and cleanup issues',
  frameworks: ['react', 'next'],
  tags: ['react', 'hooks', 'async'],
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Only check React/JSX/TSX files
    if (!context.filePath.match(/\.(jsx|tsx)$/)) {
      return violations;
    }
    
    // Pattern for detecting async functions in useEffect
    // Matches: useEffect(async () => { ... })
    const asyncUseEffectPattern = /useEffect\s*\(\s*async\s*(?:\([^)]*\))?\s*=>/g;
    
    const matches = Array.from(context.fileContent.matchAll(asyncUseEffectPattern));
    
    for (const match of matches) {
      const matchIndex = match.index!;
      const lineNumber = getLineNumber(context.fileContent, matchIndex);
      
      violations.push({
        ruleId: asyncUseEffectRule.id,
        ruleName: asyncUseEffectRule.name,
        severity: asyncUseEffectRule.severity,
        category: asyncUseEffectRule.category,
        message: 'Async function used directly in useEffect',
        filePath: context.filePath,
        line: lineNumber,
        codeSnippet: extractSnippet(context.fileContent, matchIndex),
        fixSuggestion: 'Define an async function inside useEffect and call it immediately, or use .then() for promises. Example:\n\nuseEffect(() => {\n  const fetchData = async () => {\n    const result = await fetch(url);\n    setData(result);\n  };\n  fetchData();\n}, []);',
        explanation: 'Using async functions directly in useEffect is problematic because useEffect expects either no return value or a cleanup function. Async functions always return a Promise, which can cause React to treat it as a cleanup function. This can lead to race conditions, memory leaks, and unexpected behavior. The proper pattern is to define an async function inside useEffect and call it.',
        immediateAttention: false
      });
    }
    
    return violations;
  }
};

/**
 * REACT002: Server Code in Client Components
 * Detects server-side code (like database queries) in client components
 */
export const serverInClientRule: Rule = {
  id: 'REACT002_SERVER_IN_CLIENT',
  name: 'Server Code in Client Component',
  category: 'Architecture',
  severity: 'HIGH',
  description: 'Detects server-side code in client components which can expose sensitive data or cause runtime errors',
  frameworks: ['react', 'next'],
  tags: ['react', 'next', 'server', 'client'],
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Only check React/JSX/TSX files
    if (!context.filePath.match(/\.(jsx|tsx)$/)) {
      return violations;
    }
    
    // Check if file has 'use client' directive (Next.js 13+ client component)
    const hasUseClient = /['"]use client['"]/.test(context.fileContent);
    
    // If not explicitly a client component, skip (could be server component)
    if (!hasUseClient) {
      return violations;
    }
    
    // Patterns for detecting server-side code
    const serverPatterns = [
      { 
        regex: /\b(?:prisma|db|database)\s*\.\s*(?:query|execute|select|insert|update|delete|create|findMany|findUnique|findFirst)/gi,
        type: 'database query',
        explanation: 'Direct database queries should only be performed in server components or API routes'
      },
      {
        regex: /process\.env\.(?!NEXT_PUBLIC_)[A-Z_]+/g,
        type: 'server-side environment variable',
        explanation: 'Server-side environment variables (without NEXT_PUBLIC_ prefix) are not available in client components'
      },
      {
        regex: /\bfs\s*\.\s*(?:readFile|writeFile|readdir|stat|mkdir)/gi,
        type: 'filesystem operation',
        explanation: 'Filesystem operations can only be performed on the server'
      },
      {
        regex: /require\s*\(\s*['"](?:fs|path|crypto|os|child_process)['"]\s*\)/g,
        type: 'Node.js built-in module',
        explanation: 'Node.js built-in modules are not available in the browser'
      },
      {
        regex: /import\s+.*?\s+from\s+['"](?:fs|path|crypto|os|child_process)['"]/g,
        type: 'Node.js built-in module import',
        explanation: 'Node.js built-in modules are not available in the browser'
      }
    ];
    
    for (const pattern of serverPatterns) {
      const matches = Array.from(context.fileContent.matchAll(pattern.regex));
      
      for (const match of matches) {
        const matchIndex = match.index!;
        const lineNumber = getLineNumber(context.fileContent, matchIndex);
        
        violations.push({
          ruleId: serverInClientRule.id,
          ruleName: serverInClientRule.name,
          severity: serverInClientRule.severity,
          category: serverInClientRule.category,
          message: `Server-side code detected in client component: ${pattern.type}`,
          filePath: context.filePath,
          line: lineNumber,
          codeSnippet: extractSnippet(context.fileContent, matchIndex),
          fixSuggestion: `Move this ${pattern.type} to a server component, API route, or server action. In Next.js 13+, you can:\n1. Remove 'use client' directive to make this a server component\n2. Create an API route in app/api/ to handle the server logic\n3. Use Server Actions with 'use server' directive\n4. Fetch data from the client using fetch() to call your API`,
          explanation: `${pattern.explanation}. Client components run in the browser and cannot access server-only resources. This code will either fail at runtime or expose sensitive information if it somehow executes.`,
          immediateAttention: false
        });
      }
    }
    
    return violations;
  }
};

/**
 * Export all React rules as an array for easy registration
 */
export const reactRules: Rule[] = [
  asyncUseEffectRule,
  serverInClientRule,
];
