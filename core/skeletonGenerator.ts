/**
 * RepoForge Skeleton Generator
 * Generates project skeletons based on YAML specs
 */

import * as fs from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';

interface SkeletonConfig {
  name: string;
  description?: string;
  folders: string[];
  entrypoint: string;
  tests?: {
    pattern: string;
  };
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function generateSkeleton(targetPath: string): { created: string[] } {
  const created: string[] = [];
  
  const specPath = path.join(process.cwd(), '.kiro', 'specs', 'skeleton.yaml');
  
  if (!fs.existsSync(specPath)) {
    throw new Error(`Skeleton spec not found at: ${specPath}`);
  }
  
  const specContent = fs.readFileSync(specPath, 'utf-8');
  const config = yaml.load(specContent) as SkeletonConfig;
  
  // Create all folders
  for (const folder of config.folders) {
    const folderPath = path.join(targetPath, folder);
    ensureDir(folderPath);
  }
  
  // Ensure entrypoint exists
  const entrypointPath = path.join(targetPath, config.entrypoint);
  if (!fs.existsSync(entrypointPath)) {
    ensureDir(path.dirname(entrypointPath));
    const entrypointContent = `import * as http from 'http';

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', message: 'RepoForge skeleton alive' }));
});

server.listen(PORT, () => {
  console.log(\`Server listening on port \${PORT}\`);
});
`;
    fs.writeFileSync(entrypointPath, entrypointContent, 'utf-8');
    created.push(path.relative(targetPath, entrypointPath));
  }
  
  // Create src/routes/health.ts if missing
  const healthRoutePath = path.join(targetPath, 'src', 'routes', 'health.ts');
  if (!fs.existsSync(healthRoutePath)) {
    ensureDir(path.dirname(healthRoutePath));
    const healthContent = `export function health(): { status: string; message: string } {
  return { status: 'ok', message: 'healthy' };
}
`;
    fs.writeFileSync(healthRoutePath, healthContent, 'utf-8');
    created.push(path.relative(targetPath, healthRoutePath));
  }
  
  // Create tests/health.test.ts if missing
  const healthTestPath = path.join(targetPath, 'tests', 'health.test.ts');
  if (!fs.existsSync(healthTestPath)) {
    ensureDir(path.dirname(healthTestPath));
    const testContent = `import { health } from '../src/routes/health';

describe('health', () => {
  it('should return ok status', () => {
    const result = health();
    expect(result.status).toBe('ok');
  });
});
`;
    fs.writeFileSync(healthTestPath, testContent, 'utf-8');
    created.push(path.relative(targetPath, healthTestPath));
  }
  
  return { created };
}
