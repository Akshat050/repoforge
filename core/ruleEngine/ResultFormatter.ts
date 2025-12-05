/**
 * Result Formatter
 * Formats rule engine results for different output formats (CLI, JSON, MCP)
 */

import { RuleEngineResult, Violation, Severity, RuleCategory } from './types';

// ANSI color codes for CLI output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Severity colors
  critical: '\x1b[91m', // Bright red
  high: '\x1b[31m',     // Red
  medium: '\x1b[33m',   // Yellow
  low: '\x1b[36m',      // Cyan
  suggestion: '\x1b[90m', // Gray
  
  // Other colors
  green: '\x1b[32m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
};

export class ResultFormatter {
  /**
   * Format results for CLI output with colors and grouping
   */
  formatCLI(result: RuleEngineResult): string {
    const lines: string[] = [];
    
    // Header
    lines.push('');
    lines.push(`${colors.bold}${colors.blue}RepoForge Rule Engine Results${colors.reset}`);
    lines.push('='.repeat(50));
    lines.push('');
    
    // Summary statistics
    lines.push(this.generateSummary(result));
    lines.push('');
    
    // Group violations by severity
    const groupedBySeverity = this.groupBySeverity(result.violations);
    
    // Display violations in severity order
    const severityOrder: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SUGGESTION'];
    
    for (const severity of severityOrder) {
      const violations = groupedBySeverity.get(severity);
      if (!violations || violations.length === 0) continue;
      
      const color = this.getSeverityColor(severity);
      lines.push(`${colors.bold}${color}${severity} (${violations.length})${colors.reset}`);
      lines.push('-'.repeat(50));
      
      for (const violation of violations) {
        lines.push(this.formatViolation(violation));
        lines.push('');
      }
    }
    
    // Footer
    if (result.violations.length === 0) {
      lines.push(`${colors.green}${colors.bold}✓ No violations found!${colors.reset}`);
      lines.push('');
    }
    
    return lines.join('\n');
  }
  
  /**
   * Format a single violation for CLI display
   */
  private formatViolation(violation: Violation): string {
    const lines: string[] = [];
    const color = this.getSeverityColor(violation.severity);
    
    // Add immediate attention flag for CRITICAL violations
    const attentionFlag = violation.immediateAttention ? ' ⚠️  IMMEDIATE ATTENTION REQUIRED' : '';
    
    // Rule name and ID
    lines.push(`  ${colors.bold}${violation.ruleName}${colors.reset} ${colors.dim}(${violation.ruleId})${colors.reset}${attentionFlag}`);
    
    // Location
    const location = violation.line 
      ? `${violation.filePath}:${violation.line}${violation.column ? `:${violation.column}` : ''}`
      : violation.filePath;
    lines.push(`  ${colors.dim}${location}${colors.reset}`);
    
    // Message
    lines.push(`  ${violation.message}`);
    
    // Code snippet if available
    if (violation.codeSnippet) {
      lines.push(`  ${colors.dim}Code:${colors.reset}`);
      lines.push(`    ${colors.dim}${violation.codeSnippet}${colors.reset}`);
    }
    
    // Fix suggestion
    lines.push(`  ${colors.green}Fix:${colors.reset} ${violation.fixSuggestion}`);
    
    return lines.join('\n');
  }
  
  /**
   * Format results as JSON
   */
  formatJSON(result: RuleEngineResult): string {
    return JSON.stringify(result, null, 2);
  }
  
  /**
   * Format results for MCP response
   */
  formatMCP(result: RuleEngineResult): object {
    return {
      violations: result.violations,
      summary: result.summary,
      executionTime: result.executionTime,
      filesScanned: result.filesScanned,
      rulesExecuted: result.rulesExecuted,
    };
  }
  
  /**
   * Generate summary statistics
   */
  generateSummary(result: RuleEngineResult): string {
    const lines: string[] = [];
    
    lines.push(`${colors.bold}Summary${colors.reset}`);
    lines.push(`  Total violations: ${result.summary.total}`);
    lines.push(`  Files scanned: ${result.filesScanned}`);
    lines.push(`  Rules executed: ${result.rulesExecuted}`);
    lines.push(`  Execution time: ${result.executionTime}ms`);
    lines.push('');
    
    // Severity breakdown
    if (result.summary.total > 0) {
      lines.push(`${colors.bold}By Severity:${colors.reset}`);
      const severityOrder: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SUGGESTION'];
      for (const severity of severityOrder) {
        const count = result.summary.bySeverity[severity] || 0;
        if (count > 0) {
          const color = this.getSeverityColor(severity);
          lines.push(`  ${color}${severity}:${colors.reset} ${count}`);
        }
      }
      lines.push('');
      
      // Category breakdown
      lines.push(`${colors.bold}By Category:${colors.reset}`);
      const categories = Object.entries(result.summary.byCategory)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);
      
      for (const [category, count] of categories) {
        lines.push(`  ${category}: ${count}`);
      }
    }
    
    return lines.join('\n');
  }
  
  /**
   * Group violations by severity
   */
  groupBySeverity(violations: Violation[]): Map<Severity, Violation[]> {
    const grouped = new Map<Severity, Violation[]>();
    
    for (const violation of violations) {
      const existing = grouped.get(violation.severity) || [];
      existing.push(violation);
      grouped.set(violation.severity, existing);
    }
    
    return grouped;
  }
  
  /**
   * Group violations by category
   */
  groupByCategory(violations: Violation[]): Map<RuleCategory, Violation[]> {
    const grouped = new Map<RuleCategory, Violation[]>();
    
    for (const violation of violations) {
      const existing = grouped.get(violation.category) || [];
      existing.push(violation);
      grouped.set(violation.category, existing);
    }
    
    return grouped;
  }
  
  /**
   * Group violations by file
   */
  groupByFile(violations: Violation[]): Map<string, Violation[]> {
    const grouped = new Map<string, Violation[]>();
    
    for (const violation of violations) {
      const existing = grouped.get(violation.filePath) || [];
      existing.push(violation);
      grouped.set(violation.filePath, existing);
    }
    
    return grouped;
  }
  
  /**
   * Get ANSI color code for a severity level
   */
  private getSeverityColor(severity: Severity): string {
    switch (severity) {
      case 'CRITICAL': return colors.critical;
      case 'HIGH': return colors.high;
      case 'MEDIUM': return colors.medium;
      case 'LOW': return colors.low;
      case 'SUGGESTION': return colors.suggestion;
      default: return colors.white;
    }
  }
}
