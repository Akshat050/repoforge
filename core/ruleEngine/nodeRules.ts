/**
 * Node.js Backend-Specific Rules
 * Rules for detecting common issues in Node.js backend applications
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
 * NODE001: Missing Input Validation
 * Detects API endpoints that don't validate user input
 */
export const missingInputValidationRule: Rule = {
  id: 'NODE001_MISSING_INPUT_VALIDATION',
  name: 'Missing Input Validation',
  category: 'Security',
  severity: 'HIGH',
  description: 'Detects API endpoints that directly use request parameters without validation',
  frameworks: ['express', 'fastify', 'nest'],
  tags: ['node', 'backend', 'validation', 'security'],
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Only check TypeScript/JavaScript files that look like route handlers
    if (!context.filePath.match(/\.(ts|js)$/) || 
        !context.filePath.match(/(?:routes?|controllers?|handlers?|api)\//i)) {
      return violations;
    }
    
    // Pattern for detecting route handlers
    const routeHandlerPatterns = [
      // Express: app.get/post/put/delete/patch
      /(?:app|router)\s*\.\s*(?:get|post|put|delete|patch|all)\s*\(/g,
      // Fastify: fastify.get/post/put/delete/patch
      /fastify\s*\.\s*(?:get|post|put|delete|patch|all)\s*\(/g,
      // NestJS: @Get/@Post/@Put/@Delete/@Patch decorators
      /@(?:Get|Post|Put|Delete|Patch|All)\s*\(/g,
    ];
    
    let hasRouteHandler = false;
    for (const pattern of routeHandlerPatterns) {
      if (pattern.test(context.fileContent)) {
        hasRouteHandler = true;
        break;
      }
    }
    
    if (!hasRouteHandler) {
      return violations;
    }
    
    // Patterns for detecting unvalidated input usage
    const unvalidatedInputPatterns = [
      {
        regex: /(?:req\.body|req\.params|req\.query)\s*\.\s*\w+(?!\s*(?:&&|\|\||\.(?:trim|toLowerCase|toUpperCase|toString|match|test|validate|check|sanitize)))/g,
        type: 'direct property access',
        context: 'request parameter'
      },
      {
        regex: /(?:const|let|var)\s+\{\s*\w+(?:\s*,\s*\w+)*\s*\}\s*=\s*(?:req\.body|req\.params|req\.query)(?!\s*;?\s*(?:\/\/.*?validate|\/\*.*?validate))/g,
        type: 'destructured parameters',
        context: 'request object'
      }
    ];
    
    // Look for validation libraries being used
    const hasValidation = 
      /\b(?:joi|yup|zod|validator|express-validator|class-validator|ajv)\b/i.test(context.fileContent) ||
      /\.validate\(/.test(context.fileContent) ||
      /\.check\(/.test(context.fileContent) ||
      /\.sanitize\(/.test(context.fileContent);
    
    // If validation library is present, be less strict
    if (hasValidation) {
      return violations;
    }
    
    for (const pattern of unvalidatedInputPatterns) {
      const matches = Array.from(context.fileContent.matchAll(pattern.regex));
      
      for (const match of matches) {
        const matchIndex = match.index!;
        const lineNumber = getLineNumber(context.fileContent, matchIndex);
        
        // Check if there's validation nearby (within 5 lines)
        const lines = context.fileContent.split('\n');
        const startCheck = Math.max(0, lineNumber - 5);
        const endCheck = Math.min(lines.length, lineNumber + 5);
        const nearbyLines = lines.slice(startCheck, endCheck).join('\n');
        
        const hasNearbyValidation = 
          /\b(?:validate|check|sanitize|schema|assert|ensure|verify)\b/i.test(nearbyLines) ||
          /if\s*\(.*?(?:typeof|instanceof|Array\.isArray|isNaN|!.*?\.length)\s*\)/.test(nearbyLines);
        
        if (!hasNearbyValidation) {
          violations.push({
            ruleId: missingInputValidationRule.id,
            ruleName: missingInputValidationRule.name,
            severity: missingInputValidationRule.severity,
            category: missingInputValidationRule.category,
            message: `Unvalidated ${pattern.context} used: ${pattern.type}`,
            filePath: context.filePath,
            line: lineNumber,
            codeSnippet: extractSnippet(context.fileContent, matchIndex),
            fixSuggestion: 'Validate and sanitize all user input before using it. Use a validation library like Zod, Joi, or Yup:\n\nconst schema = z.object({\n  email: z.string().email(),\n  age: z.number().min(0).max(120)\n});\n\nconst validated = schema.parse(req.body);\n\nOr use express-validator:\n\napp.post(\'/user\',\n  body(\'email\').isEmail(),\n  body(\'age\').isInt({ min: 0, max: 120 }),\n  (req, res) => { ... }\n);',
            explanation: 'Using unvalidated user input can lead to security vulnerabilities including injection attacks, type confusion, and unexpected application behavior. Always validate input types, formats, ranges, and sanitize strings before using them in your application logic, database queries, or responses.',
            immediateAttention: false
          });
        }
      }
    }
    
    return violations;
  }
};

/**
 * NODE002: Inconsistent Status Codes
 * Detects inconsistent or incorrect HTTP status code usage
 */
export const inconsistentStatusCodesRule: Rule = {
  id: 'NODE002_INCONSISTENT_STATUS_CODES',
  name: 'Inconsistent HTTP Status Codes',
  category: 'Architecture',
  severity: 'MEDIUM',
  description: 'Detects incorrect or inconsistent HTTP status code usage in API responses',
  frameworks: ['express', 'fastify', 'nest'],
  tags: ['node', 'backend', 'http', 'api'],
  
  check: (context: RuleContext): Violation[] => {
    const violations: Violation[] = [];
    
    // Only check TypeScript/JavaScript files that look like route handlers
    if (!context.filePath.match(/\.(ts|js)$/) || 
        !context.filePath.match(/(?:routes?|controllers?|handlers?|api)\//i)) {
      return violations;
    }
    
    // Patterns for detecting incorrect status code usage
    const incorrectPatterns = [
      {
        regex: /\.status\s*\(\s*200\s*\).*?(?:error|fail|invalid|unauthorized|forbidden)/gi,
        issue: '200 OK used for error responses',
        suggestion: 'Use appropriate error status codes: 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Internal Server Error)'
      },
      {
        regex: /\.status\s*\(\s*201\s*\)(?!.*?(?:create|insert|add|new|register|signup))/gi,
        issue: '201 Created used for non-creation operations',
        suggestion: 'Use 201 only for successful resource creation. Use 200 for updates or other successful operations'
      },
      {
        regex: /\.status\s*\(\s*204\s*\).*?\.(?:json|send)\s*\(/gi,
        issue: '204 No Content with response body',
        suggestion: '204 status code should not include a response body. Use 200 if you need to send data'
      },
      {
        regex: /\.status\s*\(\s*(?:400|401|403|404|500)\s*\).*?\.json\s*\(\s*\{\s*(?!.*?(?:error|message|status))/gi,
        issue: 'Error response without error message',
        suggestion: 'Error responses should include an error message or description in the body'
      },
      {
        regex: /catch\s*\([^)]*\)\s*\{[^}]*\.status\s*\(\s*200\s*\)/g,
        issue: '200 OK in error handler',
        suggestion: 'Use 500 (Internal Server Error) or appropriate error status code in catch blocks'
      },
      {
        regex: /\.status\s*\(\s*(?:301|302|303|307|308)\s*\)(?!.*?\.(?:redirect|location))/gi,
        issue: 'Redirect status code without redirect',
        suggestion: 'Redirect status codes (3xx) should be accompanied by a Location header or redirect method'
      }
    ];
    
    for (const pattern of incorrectPatterns) {
      const matches = Array.from(context.fileContent.matchAll(pattern.regex));
      
      for (const match of matches) {
        const matchIndex = match.index!;
        const lineNumber = getLineNumber(context.fileContent, matchIndex);
        
        violations.push({
          ruleId: inconsistentStatusCodesRule.id,
          ruleName: inconsistentStatusCodesRule.name,
          severity: inconsistentStatusCodesRule.severity,
          category: inconsistentStatusCodesRule.category,
          message: pattern.issue,
          filePath: context.filePath,
          line: lineNumber,
          codeSnippet: extractSnippet(context.fileContent, matchIndex),
          fixSuggestion: pattern.suggestion,
          explanation: 'HTTP status codes communicate the result of a request to clients. Using incorrect status codes can break client error handling, caching behavior, and API contracts. Follow REST conventions: 2xx for success, 3xx for redirects, 4xx for client errors, 5xx for server errors.',
          immediateAttention: false
        });
      }
    }
    
    return violations;
  }
};

/**
 * Export all Node.js rules as an array for easy registration
 */
export const nodeRules: Rule[] = [
  missingInputValidationRule,
  inconsistentStatusCodesRule,
];
