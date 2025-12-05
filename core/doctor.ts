/**
 * RepoForge Doctor
 * Comprehensive health check with actionable recommendations
 */

import type { RepoMap, AuditResult, ProjectProfile } from './types.js';
import { loadState, getContextSummary, isStateStale } from './state.js';

export interface DoctorReport {
  overall: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  score: number; // 0-100
  sections: {
    structure: DoctorSection;
    testing: DoctorSection;
    codeQuality: DoctorSection;
    documentation: DoctorSection;
    architecture: DoctorSection;
  };
  fileIssues: {
    ghosts: FileIssue[];
    curses: FileIssue[];
    zombies: FileIssue[];
  };
  quickWins: string[];
  criticalIssues: string[];
  recommendations: string[];
  nextSteps: string[];
}

export interface DoctorSection {
  status: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  findings: string[];
  suggestions: string[];
}

export interface FileIssue {
  file: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestion?: string;
}

export function runDoctor(
  repo: RepoMap,
  profile: ProjectProfile,
  auditResult: AuditResult
): DoctorReport {
  // Check for existing state
  const state = loadState(repo.root);
  const hasContext = state !== null;
  const contextStale = state ? isStateStale(state) : false;
  
  // Analyze each section
  const structure = analyzeStructure(repo, profile, auditResult);
  const testing = analyzeTesting(repo, profile, auditResult);
  const codeQuality = analyzeCodeQuality(repo, profile, auditResult);
  const documentation = analyzeDocumentation(repo);
  const architecture = analyzeArchitecture(profile);
  
  // Calculate overall score
  const overallScore = Math.round(
    (structure.score + testing.score + codeQuality.score + 
     documentation.score + architecture.score) / 5
  );
  
  // Determine overall status
  let overall: DoctorReport['overall'];
  if (overallScore >= 90) overall = 'excellent';
  else if (overallScore >= 75) overall = 'good';
  else if (overallScore >= 60) overall = 'fair';
  else if (overallScore >= 40) overall = 'poor';
  else overall = 'critical';
  
  // Collect file-specific issues
  const fileIssues = collectFileIssues(auditResult);
  
  // Collect quick wins
  const quickWins = collectQuickWins(auditResult, profile);
  
  // Collect critical issues
  const criticalIssues = auditResult.issues
    .filter(i => i.severity === 'critical')
    .map(i => i.message);
  
  // Generate recommendations
  const recommendations = [
    ...auditResult.recommendations,
    ...generateAdditionalRecommendations(profile, auditResult)
  ];
  
  // Generate next steps
  const nextSteps = generateNextSteps(overall, criticalIssues, quickWins);
  
  return {
    overall,
    score: overallScore,
    sections: {
      structure,
      testing,
      codeQuality,
      documentation,
      architecture
    },
    fileIssues,
    quickWins,
    criticalIssues,
    recommendations,
    nextSteps
  };
}

function analyzeStructure(
  repo: RepoMap,
  profile: ProjectProfile,
  auditResult: AuditResult
): DoctorSection {
  const findings: string[] = [];
  const suggestions: string[] = [];
  let score = 100;
  
  // Check for zombies
  const zombies = auditResult.issues.filter(i => i.type === 'zombie').length;
  if (zombies > 0) {
    findings.push(`${zombies} file(s) in wrong locations`);
    suggestions.push('Move misplaced files to proper directories');
    score -= zombies * 5;
  } else {
    findings.push('All files properly organized');
  }
  
  // Check architecture
  if (profile.architecture === 'unknown') {
    findings.push('No clear architecture pattern detected');
    suggestions.push('Consider adopting MVC, Layered, or Modular architecture');
    score -= 15;
  } else {
    findings.push(`Using ${profile.architecture} architecture`);
  }
  
  // Check for build config
  if (!profile.hasBuildConfig) {
    findings.push('No build configuration found');
    suggestions.push('Add build tools (Vite, Webpack, or tsconfig.json)');
    score -= 10;
  }
  
  score = Math.max(0, score);
  
  let status: DoctorSection['status'];
  if (score >= 90) status = 'excellent';
  else if (score >= 75) status = 'good';
  else if (score >= 60) status = 'fair';
  else status = 'poor';
  
  return { status, score, findings, suggestions };
}

function analyzeTesting(
  repo: RepoMap,
  profile: ProjectProfile,
  auditResult: AuditResult
): DoctorSection {
  const findings: string[] = [];
  const suggestions: string[] = [];
  let score = 100;
  
  if (!profile.hasTests) {
    findings.push('No test infrastructure found');
    suggestions.push('Add testing framework (Jest, Vitest, or Mocha)');
    score = 0;
  } else {
    findings.push('Test infrastructure exists');
    
    const ghosts = auditResult.issues.filter(i => i.type === 'ghost').length;
    if (ghosts > 0) {
      findings.push(`${ghosts} file(s) without tests`);
      suggestions.push('Add tests for untested files');
      score -= ghosts * 3;
    } else {
      findings.push('All files have test coverage');
    }
  }
  
  score = Math.max(0, score);
  
  let status: DoctorSection['status'];
  if (score >= 90) status = 'excellent';
  else if (score >= 70) status = 'good';
  else if (score >= 50) status = 'fair';
  else status = 'poor';
  
  return { status, score, findings, suggestions };
}

function analyzeCodeQuality(
  repo: RepoMap,
  profile: ProjectProfile,
  auditResult: AuditResult
): DoctorSection {
  const findings: string[] = [];
  const suggestions: string[] = [];
  let score = 100;
  
  const curses = auditResult.issues.filter(i => i.type === 'curse');
  const critical = curses.filter(i => i.severity === 'critical').length;
  const high = curses.filter(i => i.severity === 'high').length;
  const medium = curses.filter(i => i.severity === 'medium').length;
  
  if (critical > 0) {
    findings.push(`${critical} critical code quality issue(s)`);
    suggestions.push('Fix critical issues immediately (security risks!)');
    score -= critical * 20;
  }
  
  if (high > 0) {
    findings.push(`${high} high severity issue(s)`);
    suggestions.push('Address high severity issues soon');
    score -= high * 10;
  }
  
  if (medium > 0) {
    findings.push(`${medium} medium severity issue(s)`);
    suggestions.push('Refactor for better maintainability');
    score -= medium * 3;
  }
  
  if (curses.length === 0) {
    findings.push('No code quality issues detected');
  }
  
  score = Math.max(0, score);
  
  let status: DoctorSection['status'];
  if (score >= 90) status = 'excellent';
  else if (score >= 75) status = 'good';
  else if (score >= 60) status = 'fair';
  else status = 'poor';
  
  return { status, score, findings, suggestions };
}

function analyzeDocumentation(repo: RepoMap): DoctorSection {
  const findings: string[] = [];
  const suggestions: string[] = [];
  let score = 100;
  
  const hasReadme = repo.entries.some(e => 
    e.kind === 'file' && e.path.toLowerCase().includes('readme')
  );
  
  const hasLicense = repo.entries.some(e => 
    e.kind === 'file' && e.path.toLowerCase().includes('license')
  );
  
  const hasChangelog = repo.entries.some(e => 
    e.kind === 'file' && e.path.toLowerCase().includes('changelog')
  );
  
  const hasContributing = repo.entries.some(e => 
    e.kind === 'file' && e.path.toLowerCase().includes('contributing')
  );
  
  if (hasReadme) {
    findings.push('README file exists');
  } else {
    findings.push('No README file');
    suggestions.push('Add README.md with project overview');
    score -= 30;
  }
  
  if (hasLicense) {
    findings.push('License file exists');
  } else {
    findings.push('No license file');
    suggestions.push('Add LICENSE file');
    score -= 20;
  }
  
  if (!hasChangelog) {
    suggestions.push('Consider adding CHANGELOG.md');
    score -= 10;
  }
  
  if (!hasContributing) {
    suggestions.push('Consider adding CONTRIBUTING.md for contributors');
    score -= 10;
  }
  
  score = Math.max(0, score);
  
  let status: DoctorSection['status'];
  if (score >= 90) status = 'excellent';
  else if (score >= 70) status = 'good';
  else if (score >= 50) status = 'fair';
  else status = 'poor';
  
  return { status, score, findings, suggestions };
}

function analyzeArchitecture(profile: ProjectProfile): DoctorSection {
  const findings: string[] = [];
  const suggestions: string[] = [];
  let score = 100;
  
  // TypeScript
  if (profile.hasTypeScript) {
    findings.push('Using TypeScript for type safety');
  } else {
    findings.push('Using plain JavaScript');
    suggestions.push('Consider migrating to TypeScript');
    score -= 15;
  }
  
  // Architecture pattern
  if (profile.architecture === 'unknown') {
    findings.push('No clear architecture pattern');
    suggestions.push('Define clear architecture (MVC, Layered, Clean)');
    score -= 20;
  } else if (profile.architecture === 'flat') {
    findings.push('Flat structure - may become hard to maintain');
    suggestions.push('Consider organizing into layers or modules');
    score -= 10;
  } else {
    findings.push(`Well-defined ${profile.architecture} architecture`);
  }
  
  // Framework detection
  if (profile.frameworks.length > 0 && profile.frameworks[0] !== 'none') {
    findings.push(`Using ${profile.frameworks.join(', ')}`);
  }
  
  score = Math.max(0, score);
  
  let status: DoctorSection['status'];
  if (score >= 90) status = 'excellent';
  else if (score >= 75) status = 'good';
  else if (score >= 60) status = 'fair';
  else status = 'poor';
  
  return { status, score, findings, suggestions };
}

function collectQuickWins(auditResult: AuditResult, profile: ProjectProfile): string[] {
  const wins: string[] = [];
  
  // Easy test additions
  const ghosts = auditResult.issues.filter(i => i.type === 'ghost');
  if (ghosts.length > 0 && ghosts.length <= 3) {
    wins.push(`Add tests for ${ghosts.length} file(s) - quick coverage boost`);
  }
  
  // Simple renames
  const namingIssues = auditResult.issues.filter(i => 
    i.id.includes('NAMING')
  );
  if (namingIssues.length > 0 && namingIssues.length <= 5) {
    wins.push(`Rename ${namingIssues.length} file(s) to follow conventions`);
  }
  
  // Add README if missing
  if (!auditResult.issues.some(i => i.message.includes('README'))) {
    // Already has README, no quick win here
  }
  
  return wins;
}

function generateAdditionalRecommendations(
  profile: ProjectProfile,
  auditResult: AuditResult
): string[] {
  const recs: string[] = [];
  
  // CI/CD recommendation
  const hasCI = auditResult.issues.some(i => i.message.includes('CI'));
  if (!hasCI) {
    recs.push('🚀 Set up CI/CD pipeline for automated quality checks');
  }
  
  // Linting recommendation
  recs.push('🔍 Add ESLint/Prettier for consistent code style');
  
  return recs;
}

function generateNextSteps(
  overall: DoctorReport['overall'],
  criticalIssues: string[],
  quickWins: string[]
): string[] {
  const steps: string[] = [];
  
  if (criticalIssues.length > 0) {
    steps.push('⚠️  URGENT: Fix critical security issues immediately');
  }
  
  if (quickWins.length > 0) {
    steps.push(`✨ Quick wins: ${quickWins[0]}`);
  }
  
  if (overall === 'excellent') {
    steps.push('🎉 Maintain current quality standards');
    steps.push('📚 Consider documenting best practices for team');
  } else if (overall === 'good') {
    steps.push('🔧 Address medium priority issues');
    steps.push('📈 Work towards excellent rating');
  } else {
    steps.push('🚨 Focus on critical and high priority issues first');
    steps.push('📋 Create action plan for improvements');
  }
  
  steps.push('💾 Run "repoforge audit" regularly to track progress');
  
  return steps;
}

function collectFileIssues(auditResult: AuditResult): DoctorReport['fileIssues'] {
  const ghosts: FileIssue[] = [];
  const curses: FileIssue[] = [];
  const zombies: FileIssue[] = [];
  
  // Collect ghosts (missing tests)
  auditResult.issues
    .filter(i => i.type === 'ghost')
    .forEach(issue => {
      ghosts.push({
        file: issue.filePath,
        issue: 'Missing test file',
        severity: issue.severity,
        suggestion: issue.suggestion || `Add ${issue.filePath.replace(/\.(ts|js|tsx|jsx)$/, '.test$1')}`
      });
    });
  
  // Collect curses (structural issues)
  auditResult.issues
    .filter(i => i.type === 'curse')
    .forEach(issue => {
      const issueType = issue.id.replace('CURSE_', '').replace(/_/g, ' ').toLowerCase();
      curses.push({
        file: issue.filePath,
        issue: issueType,
        severity: issue.severity,
        suggestion: issue.suggestion || issue.message
      });
    });
  
  // Collect zombies (misplaced code)
  auditResult.issues
    .filter(i => i.type === 'zombie')
    .forEach(issue => {
      zombies.push({
        file: issue.filePath,
        issue: 'Misplaced or dead code',
        severity: issue.severity,
        suggestion: issue.suggestion || 'Move to proper directory or remove if unused'
      });
    });
  
  return { ghosts, curses, zombies };
}
