#!/usr/bin/env node
/**
 * RepoForge CLI
 * Command-line interface for scanning, generating, and auditing repositories
 */
import { scanRepo } from '../core/fileScanner.js';
import { generateSkeleton } from '../core/skeletonGenerator.js';
import { auditRepo } from '../core/auditor.js';
const EMOJI_MAP = {
    ghost: '👻',
    curse: '🧿',
    zombie: '🧟'
};
function printUsage() {
    console.log(`Usage:
  repoforge init    - Generate a skeleton project
  repoforge audit   - Run spooky audits on the repository
  repoforge help    - Show this help message`);
}
function handleInit() {
    const result = generateSkeleton(process.cwd());
    console.log('[RepoForge] Skeleton created:');
    for (const file of result.created) {
        console.log(`  ${file}`);
    }
}
function handleAudit() {
    const repo = scanRepo(process.cwd());
    const issues = auditRepo(repo);
    if (issues.length === 0) {
        console.log('[RepoForge] No ghosts, curses, or zombies found. Repo looks clean.');
        return 0;
    }
    console.log(`[RepoForge] Found ${issues.length} issue(s):\n`);
    let hasCritical = false;
    for (const issue of issues) {
        const emoji = EMOJI_MAP[issue.type];
        console.log(`${emoji} [${issue.severity.toUpperCase()}] ${issue.id}`);
        console.log(`   File: ${issue.filePath}`);
        console.log(`   ${issue.message}\n`);
        if (issue.severity === 'high' || issue.severity === 'critical') {
            hasCritical = true;
        }
    }
    return hasCritical ? 1 : 0;
}
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    try {
        switch (command) {
            case 'init':
                handleInit();
                break;
            case 'audit': {
                const exitCode = handleAudit();
                process.exit(exitCode);
                break;
            }
            case 'help':
                printUsage();
                break;
            default:
                printUsage();
                process.exit(1);
        }
    }
    catch (err) {
        console.error('[RepoForge] Unexpected error:');
        console.error(err);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map