/**
 * RepoForge Structure Summary
 * Turns a RepoMap into a human-readable description of the repo layout.
 */

import type { RepoMap } from "./types.js";

type FolderStats = {
  path: string;
  files: number;
  tests: number;
  code: number;
};

function isTestPath(p: string): boolean {
  return (
    p.endsWith(".test.ts") ||
    p.endsWith(".spec.ts") ||
    p.endsWith(".test.tsx") ||
    p.endsWith(".spec.tsx") ||
    p.endsWith(".test.js") ||
    p.endsWith(".spec.js") ||
    p.endsWith(".test.jsx") ||
    p.endsWith(".spec.jsx")
  );
}

function isCodePath(p: string): boolean {
  return (
    p.endsWith(".ts") ||
    p.endsWith(".tsx") ||
    p.endsWith(".js") ||
    p.endsWith(".jsx") ||
    p.endsWith(".py") ||
    p.endsWith(".java") ||
    p.endsWith(".go") ||
    p.endsWith(".rb") ||
    p.endsWith(".php") ||
    p.endsWith(".cs") ||
    p.endsWith(".cpp") ||
    p.endsWith(".c") ||
    p.endsWith(".rs")
  );
}

function collectFolderStats(repo: RepoMap): FolderStats[] {
  const map = new Map<string, FolderStats>();

  const files = repo.entries.filter((e) => e.kind === "file");

  for (const entry of files) {
    const filePath = entry.path;
    const segments = filePath.split("/");
    if (segments.length === 1) continue; // top-level file only

    const folderPath = segments.slice(0, -1).join("/");

    let stats = map.get(folderPath);
    if (!stats) {
      stats = {
        path: folderPath,
        files: 0,
        tests: 0,
        code: 0,
      };
      map.set(folderPath, stats);
    }

    stats.files += 1;
    if (isTestPath(filePath)) stats.tests += 1;
    if (isCodePath(filePath)) stats.code += 1;
  }

  return Array.from(map.values()).sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Guess which folders are frontend-ish vs backend-ish by name.
 */
function guessFrontendBackend(folders: FolderStats[]): {
  frontend: string[];
  backend: string[];
} {
  const frontend: string[] = [];
  const backend: string[] = [];

  const frontendHints = [
    "src/components",
    "src/pages",
    "src/hooks",
    "src/styles",
    "src/ui",
    "src/frontend",
    "src/client",
  ];
  const backendHints = [
    "src/routes",
    "src/controllers",
    "src/services",
    "src/models",
    "src/api",
    "src/server",
    "src/backend",
  ];

  for (const f of folders) {
    const p = f.path;
    if (frontendHints.some((h) => p.startsWith(h))) {
      frontend.push(p);
    }
    if (backendHints.some((h) => p.startsWith(h))) {
      backend.push(p);
    }
  }

  return {
    frontend: Array.from(new Set(frontend)),
    backend: Array.from(new Set(backend)),
  };
}

export function summarizeStructure(repo: RepoMap): string {
  const lines: string[] = [];

  lines.push(`Repo root: ${repo.root}`);
  lines.push(
    `Total: ${repo.totalFiles} files in ${repo.totalDirectories} directories`,
  );
  lines.push("");

  const folders = collectFolderStats(repo);

  // Group by top-level folder (src, tests, core, cli, etc.)
  const byTopLevel = new Map<string, FolderStats[]>();
  for (const f of folders) {
    const top = f.path.split("/")[0] ?? "";
    if (!byTopLevel.has(top)) byTopLevel.set(top, []);
    byTopLevel.get(top)!.push(f);
  }

  const sortedTop = Array.from(byTopLevel.keys()).sort();

  for (const top of sortedTop) {
    const group = byTopLevel.get(top)!;
    const totalFiles = group.reduce((sum, f) => sum + f.files, 0);
    const totalTests = group.reduce((sum, f) => sum + f.tests, 0);
    const totalCode = group.reduce((sum, f) => sum + f.code, 0);
    const nonTestCode = totalCode - totalTests;

    lines.push(`📂 ${top || "(root)"}:`);
    lines.push(`   Total: ${totalFiles} files`);
    if (totalCode > 0) {
      lines.push(`   Code: ${nonTestCode} source files`);
    }
    if (totalTests > 0) {
      lines.push(`   Tests: ${totalTests} test files`);
    }

    // Show a few important subfolders
    const important = group.filter((f) => f.path !== top && f.files > 0).slice(0, 5);

    if (important.length > 0) {
      lines.push(`   Key folders:`);
      for (const f of important) {
        const nonTest = f.code - f.tests;
        if (f.code > 0) {
          lines.push(`     • ${f.path.split('/').slice(1).join('/')}: ${nonTest} code, ${f.tests} tests`);
        } else {
          lines.push(`     • ${f.path.split('/').slice(1).join('/')}: ${f.files} files`);
        }
      }
    }

    lines.push("");
  }

  // High-level guidance section
  lines.push("💡 Navigation Guide:");

  if (byTopLevel.has("src")) {
    lines.push(
      "   • Start with src/ - contains main application code",
    );
  }
  if (byTopLevel.has("frontend")) {
    lines.push(
      "   • frontend/ - Next.js/React application (UI and pages)",
    );
  }
  if (byTopLevel.has("backend")) {
    lines.push(
      "   • backend/ - Server-side API and business logic",
    );
  }
  if (byTopLevel.has("tests") || byTopLevel.has("test")) {
    lines.push(
      "   • tests/ - Test files for quality assurance",
    );
  }
  if (byTopLevel.has("components")) {
    lines.push(
      "   • components/ - Reusable UI components",
    );
  }
  if (byTopLevel.has("lib") || byTopLevel.has("utils")) {
    lines.push(
      "   • lib/utils/ - Shared utilities and helper functions",
    );
  }

  return lines.join("\n");
}
