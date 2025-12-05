import { z } from "zod";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { scanRepo } from "../core/fileScanner.js";
import { auditRepo, smartAuditRepo } from "../core/auditor.js";
import type { RepoMap, Issue, AuditResult } from "../core/types.js";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Compute SDK root based on this file's location:
// dist/mcp-server/index.js -> project root -> node_modules/@modelcontextprotocol/sdk
const sdkRoot = path.join(
  __dirname,
  "..",        // dist/
  "..",        // project root
  "node_modules",
  "@modelcontextprotocol",
  "sdk"
);

// Dynamic import for CommonJS modules
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { McpServer } = require(
  path.join(sdkRoot, "dist", "cjs", "server", "mcp.js")
);
const { StdioServerTransport } = require(
  path.join(sdkRoot, "dist", "cjs", "server", "stdio.js")
);

// Create MCP server
const server = new McpServer({
  name: "repoforge-mcp",
  version: "1.0.0",
});


// Tool 1: full audit with JSON issues pretty-printed
server.tool(
  "repoforge_audit_repo",
  "Audit a repository for ghosts (missing tests), curses (naming issues), and zombies (misplaced code)",
  {
    root: z.string().optional().describe("Repository root path (defaults to current working directory)"),
  },
  async ({ root }: { root?: string }) => {
    const rootPath = root || process.cwd();
    const repo: RepoMap = scanRepo(rootPath);
    const result: AuditResult = await smartAuditRepo(repo);

    if (result.issues.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `✨ RepoForge Smart Audit: CLEAN\n\n` +
                  `📖 Project Overview:\n${result.explanation}\n\n` +
                  `📊 Technical Profile:\n` +
                  `  Type: ${result.profile.type}\n` +
                  `  Frameworks: ${result.profile.frameworks.join(', ')}\n` +
                  `  Architecture: ${result.profile.architecture}\n` +
                  `  TypeScript: ${result.profile.hasTypeScript ? '✅' : '❌'}\n` +
                  `  Tests: ${result.profile.hasTests ? '✅' : '❌'}\n` +
                  `  Confidence: ${result.profile.confidence}%\n\n` +
                  `🎉 No ghosts, curses, or zombies found!` +
                  (result.recommendations.length > 0 ? `\n\n💡 Suggestions for improvement:\n${result.recommendations.map(r => `  ${r}`).join('\n')}` : ''),
          },
        ],
      };
    }

    const summary = 
      `🔍 RepoForge Smart Audit Results\n\n` +
      `📖 Project Overview:\n${result.explanation}\n\n` +
      `📊 Technical Profile:\n` +
      `  Type: ${result.profile.type}\n` +
      `  Frameworks: ${result.profile.frameworks.join(', ')}\n` +
      `  Architecture: ${result.profile.architecture}\n` +
      `  TypeScript: ${result.profile.hasTypeScript ? '✅' : '❌'}\n` +
      `  Tests: ${result.profile.hasTests ? '✅' : '❌'}\n` +
      `  Package Manager: ${result.profile.packageManager}\n` +
      `  Detection Confidence: ${result.profile.confidence}%\n\n` +
      `📈 Issue Summary:\n` +
      `  👻 Ghosts (missing tests): ${result.summary.ghosts}\n` +
      `  🧿 Curses (structural issues): ${result.summary.curses}\n` +
      `  🧟 Zombies (misplaced code): ${result.summary.zombies}\n` +
      `  Total: ${result.summary.totalIssues}\n\n` +
      `💡 Smart Recommendations:\n${result.recommendations.map(r => `  ${r}`).join('\n')}\n\n` +
      `📋 Detailed Issues:\n${JSON.stringify(result.issues, null, 2)}`;

    return {
      content: [
        {
          type: "text",
          text: summary,
        },
      ],
    };
  }
);

// Tool 2: short summary (for quick answers in chat)
server.tool(
  "repoforge_audit_summary",
  "Get a quick summary of repository audit results by issue type",
  {
    root: z.string().optional().describe("Repository root path (defaults to current working directory)"),
  },
  async ({ root }: { root?: string }) => {
    const rootPath = root || process.cwd();
    const repo: RepoMap = scanRepo(rootPath);
    const result: AuditResult = await smartAuditRepo(repo);

    if (result.issues.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `✨ ${result.profile.type} project (${result.profile.frameworks.join(', ')}) - Clean!\n\n${result.explanation}`,
          },
        ],
      };
    }

    const text = 
      `📊 ${result.profile.type} project (${result.profile.frameworks.join(', ')})\n` +
      `${result.explanation}\n\n` +
      `Issues: ${result.summary.totalIssues} total\n` +
      `👻 Ghosts: ${result.summary.ghosts} | 🧿 Curses: ${result.summary.curses} | 🧟 Zombies: ${result.summary.zombies}\n\n` +
      `Top recommendations:\n${result.recommendations.slice(0, 3).map(r => `• ${r}`).join('\n')}`;

    return {
      content: [
        {
          type: "text",
          text,
        },
      ],
    };
  }
);

// Tool 3: AI-powered code generation
server.tool(
  "repoforge_generate_code",
  "Generate code from natural language prompts with proper structure and tests",
  {
    prompt: z.string().describe("What to generate (e.g., 'user authentication API', 'product card component')"),
    root: z.string().optional().describe("Target directory (defaults to current working directory)"),
  },
  async ({ prompt, root }: { prompt: string; root?: string }) => {
    const rootPath = root || process.cwd();
    
    // Import dynamically
    const { scanRepo } = await import("../core/fileScanner.js");
    const { smartAuditRepo } = await import("../core/auditor.js");
    const { generateCode } = await import("../core/codeGenerator.js");
    
    const repo = scanRepo(rootPath);
    const auditResult = await smartAuditRepo(repo);
    
    const result = generateCode(
      { prompt },
      auditResult.profile,
      rootPath
    );
    
    const summary = 
      `🤖 RepoForge Code Generation\n\n` +
      `📝 Prompt: "${prompt}"\n\n` +
      `🔍 Project Context:\n` +
      `  Type: ${auditResult.profile.type}\n` +
      `  Frameworks: ${auditResult.profile.frameworks.join(', ')}\n` +
      `  Language: ${auditResult.profile.hasTypeScript ? 'TypeScript' : 'JavaScript'}\n\n` +
      `✨ Generated Files:\n${result.structure}\n\n` +
      `📖 ${result.explanation}\n\n` +
      `📋 Next Steps:\n${result.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n` +
      `💡 To create these files, run:\n` +
      `   repoforge generate "${prompt}"`;

    return {
      content: [
        {
          type: "text",
          text: summary,
        },
      ],
    };
  }
);

// Tool 4: Generate repository manifest
server.tool(
  "repoforge_generate_manifest",
  "Generate a machine-readable manifest describing the entire repository structure, dependencies, and metadata",
  {
    root: z.string().optional().describe("Repository root path (defaults to current working directory)"),
    format: z.enum(['json', 'yaml']).optional().describe("Output format (json or yaml, defaults to json)"),
  },
  async ({ root, format }: { root?: string; format?: 'json' | 'yaml' }) => {
    const rootPath = root || process.cwd();
    const outputFormat = format || 'json';
    
    // Import dynamically
    const { scanRepo } = await import("../core/fileScanner.js");
    const { generateManifest, manifestToJSON, manifestToYAML } = await import("../core/manifestGenerator.js");
    
    const repo = scanRepo(rootPath);
    const manifest = generateManifest(repo);
    
    const output = outputFormat === 'yaml' ? manifestToYAML(manifest) : manifestToJSON(manifest);
    
    const summary = 
      `📋 RepoForge Repository Manifest\n\n` +
      `📦 Repository: ${manifest.repository.name}\n` +
      `📊 Type: ${manifest.profile.type}\n` +
      `🔧 Frameworks: ${manifest.profile.frameworks.join(', ')}\n` +
      `📁 Files: ${manifest.repository.totalFiles}\n` +
      `💾 Size: ${(manifest.repository.totalSize / 1024).toFixed(2)} KB\n` +
      `🗣️ Languages: ${manifest.languages.map(l => `${l.language} (${l.percentage}%)`).join(', ')}\n` +
      `🧪 Test Coverage: ${manifest.quality.testCoverage}%\n` +
      `📖 Documentation: README ${manifest.documentation.readme ? '✅' : '❌'}, License: ${manifest.documentation.license || '❌'}\n\n` +
      `📄 Full Manifest (${outputFormat.toUpperCase()}):\n\n` +
      `\`\`\`${outputFormat}\n${output}\n\`\`\`\n\n` +
      `💡 This manifest can be used for:\n` +
      `  • AI-powered code understanding\n` +
      `  • Automated documentation\n` +
      `  • Project onboarding\n` +
      `  • Dependency analysis\n` +
      `  • Architecture visualization`;

    return {
      content: [
        {
          type: "text",
          text: summary,
        },
      ],
    };
  }
);

// Connect via stdio (required by Kiro)
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("[RepoForge MCP] Fatal error:", err);
  process.exit(1);
});
