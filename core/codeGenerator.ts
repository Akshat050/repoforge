/**
 * RepoForge Code Generator
 * AI-powered code generation following best practices
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ProjectProfile } from './types.js';

export interface GenerateRequest {
  prompt: string;
  type?: 'component' | 'page' | 'api' | 'service' | 'model' | 'test' | 'auto';
  framework?: string;
}

export interface GenerateResult {
  files: GeneratedFile[];
  structure: string;
  explanation: string;
  nextSteps: string[];
}

export interface GeneratedFile {
  path: string;
  content: string;
  description: string;
}

export function generateCode(
  request: GenerateRequest,
  profile: ProjectProfile,
  targetDir: string
): GenerateResult {
  const { prompt, type = 'auto' } = request;
  
  // Detect what to generate from prompt
  const detectedType = type === 'auto' ? detectTypeFromPrompt(prompt) : type;
  
  // Generate based on project profile and type
  const files = generateFiles(prompt, detectedType, profile, targetDir);
  
  // Create structure explanation
  const structure = explainStructure(files, profile);
  
  // Generate explanation
  const explanation = generateExplanation(prompt, detectedType, profile);
  
  // Suggest next steps
  const nextSteps = generateNextSteps(detectedType, profile);
  
  return {
    files,
    structure,
    explanation,
    nextSteps
  };
}

function detectTypeFromPrompt(prompt: string): string {
  const lower = prompt.toLowerCase();
  
  // Check for full website/app
  if (lower.includes('website') || lower.includes('web app') || lower.includes('application')) {
    return 'page'; // Generate main page for website
  }
  if (lower.includes('homepage') || lower.includes('landing page') || lower.includes('home page')) {
    return 'page';
  }
  if (lower.includes('page') || lower.includes('screen')) {
    return 'page';
  }
  if (lower.includes('component') || lower.includes('button') || lower.includes('card')) {
    return 'component';
  }
  if (lower.includes('api') || lower.includes('endpoint') || lower.includes('route')) {
    return 'api';
  }
  if (lower.includes('service') || lower.includes('business logic')) {
    return 'service';
  }
  if (lower.includes('model') || lower.includes('schema') || lower.includes('database')) {
    return 'model';
  }
  if (lower.includes('test')) {
    return 'test';
  }
  
  return 'page'; // default to page for websites
}

function generateFiles(
  prompt: string,
  type: string,
  profile: ProjectProfile,
  targetDir: string
): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  
  // Determine base path based on project structure
  const basePath = determineBasePath(type, profile, targetDir);
  
  // Generate based on type
  switch (type) {
    case 'page':
      files.push(...generatePage(prompt, profile, basePath));
      break;
    case 'component':
      files.push(...generateComponent(prompt, profile, basePath));
      break;
    case 'api':
      files.push(...generateAPI(prompt, profile, basePath));
      break;
    case 'service':
      files.push(...generateService(prompt, profile, basePath));
      break;
    case 'model':
      files.push(...generateModel(prompt, profile, basePath));
      break;
    case 'test':
      files.push(...generateTest(prompt, profile, basePath));
      break;
  }
  
  return files;
}

function determineBasePath(type: string, profile: ProjectProfile, targetDir: string): string {
  // Check if Next.js
  if (profile.frameworks.includes('next')) {
    if (type === 'page') return path.join(targetDir, 'app');
    if (type === 'component') return path.join(targetDir, 'components');
    if (type === 'api') return path.join(targetDir, 'app', 'api');
  }
  
  // Check if React
  if (profile.frameworks.includes('react')) {
    if (type === 'component') return path.join(targetDir, 'src', 'components');
    if (type === 'page') return path.join(targetDir, 'src', 'pages');
  }
  
  // Backend
  if (profile.type === 'backend') {
    if (type === 'api') return path.join(targetDir, 'src', 'routes');
    if (type === 'service') return path.join(targetDir, 'src', 'services');
    if (type === 'model') return path.join(targetDir, 'src', 'models');
  }
  
  // Default
  return path.join(targetDir, 'src');
}

function generatePage(prompt: string, profile: ProjectProfile, basePath: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const isTS = profile.hasTypeScript;
  const ext = isTS ? 'tsx' : 'jsx';
  
  // Extract page name from prompt
  const pageName = extractName(prompt, 'home');
  const displayName = capitalize(pageName);
  
  // Check if it's a full website request
  const isFullWebsite = prompt.toLowerCase().includes('website') || 
                        prompt.toLowerCase().includes('web app');
  
  // Generate Next.js page
  if (profile.frameworks.includes('next')) {
    const content = `${isTS ? "import type { Metadata } from 'next';\n\n" : ''}export ${isTS ? 'const metadata: Metadata = ' : 'const metadata = '}{
  title: '${displayName} - ${prompt}',
  description: '${prompt}',
};

export default function ${displayName}Page() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">${displayName}</h1>
          <p className="text-xl mb-8">${prompt}</p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
            Get Started
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* TODO: Add feature cards */}
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Feature 1</h3>
              <p>Description of feature 1</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Feature 2</h3>
              <p>Description of feature 2</p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Feature 3</h3>
              <p>Description of feature 3</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl mb-8">Join us today!</p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700">
            Sign Up Now
          </button>
        </div>
      </section>
    </main>
  );
}
`;
    
    files.push({
      path: path.join(basePath, 'page.' + ext),
      content,
      description: `${isFullWebsite ? 'Homepage' : 'Page'} for ${pageName}`
    });
  } else {
    // Regular React page with more structure
    const content = `import React from 'react';
import './styles.css';

function ${displayName}() {
  return (
    <div className="${pageName}-page">
      {/* Hero Section */}
      <header className="hero">
        <h1>${displayName}</h1>
        <p>${prompt}</p>
        <button className="cta-button">Get Started</button>
      </header>

      {/* Main Content */}
      <main className="content">
        <section className="features">
          <h2>Features</h2>
          <div className="feature-grid">
            {/* TODO: Add your features here */}
            <div className="feature-card">
              <h3>Feature 1</h3>
              <p>Description</p>
            </div>
            <div className="feature-card">
              <h3>Feature 2</h3>
              <p>Description</p>
            </div>
            <div className="feature-card">
              <h3>Feature 3</h3>
              <p>Description</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2024 ${displayName}. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default ${displayName};
`;
    
    files.push({
      path: path.join(basePath, `${displayName}.${ext}`),
      content,
      description: `${isFullWebsite ? 'Homepage' : 'Page'} component for ${pageName}`
    });
    
    // Add basic CSS
    files.push({
      path: path.join(basePath, 'styles.css'),
      content: `.${pageName}-page {
  min-height: 100vh;
}

.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 80px 20px;
  text-align: center;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.cta-button {
  background: white;
  color: #667eea;
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  margin-top: 20px;
}

.features {
  padding: 60px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  margin-top: 40px;
}

.feature-card {
  padding: 30px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.footer {
  background: #333;
  color: white;
  padding: 30px;
  text-align: center;
}
`,
      description: 'Styles for the page'
    });
  }
  
  // Generate test file
  const testFileName = profile.frameworks.includes('next') ? 'page' : displayName;
  files.push({
    path: path.join(basePath, `${testFileName}.test.${ext}`),
    content: `import { render, screen } from '@testing-library/react';
import ${displayName} from './${testFileName}';

describe('${displayName}', () => {
  it('renders the hero section', () => {
    render(<${displayName} />);
    expect(screen.getByText(/get started/i)).toBeInTheDocument();
  });
  
  it('renders features section', () => {
    render(<${displayName} />);
    expect(screen.getByText(/features/i)).toBeInTheDocument();
  });
});
`,
    description: `Test file for ${pageName}`
  });
  
  return files;
}

function generateComponent(prompt: string, profile: ProjectProfile, basePath: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const isTS = profile.hasTypeScript;
  const ext = isTS ? 'tsx' : 'jsx';
  
  const componentName = extractName(prompt, 'component');
  const fileName = `${componentName}.${ext}`;
  
  const content = `${isTS ? "import React from 'react';\n\n" : ''}${isTS ? `interface ${componentName}Props {
  // Add props here
}

` : ''}export ${isTS ? 'const ' : 'function '}${componentName}${isTS ? `: React.FC<${componentName}Props> = (props) => ` : '(props) '}${isTS ? '' : '{'}{
  return (
    <div className="${componentName.toLowerCase()}">
      {/* TODO: Implement ${prompt} */}
      <p>${componentName} Component</p>
    </div>
  );
}${isTS ? ';' : ''}

export default ${componentName};
`;
  
  files.push({
    path: path.join(basePath, componentName, fileName),
    content,
    description: `React component for ${componentName}`
  });
  
  // Generate test
  files.push({
    path: path.join(basePath, componentName, `${componentName}.test.${ext}`),
    content: `import { render } from '@testing-library/react';
import ${componentName} from './${fileName.replace(/\.(tsx|jsx)$/, '')}';

describe('${componentName}', () => {
  it('renders correctly', () => {
    const { container } = render(<${componentName} />);
    expect(container).toBeInTheDocument();
  });
});
`,
    description: `Test for ${componentName}`
  });
  
  return files;
}

function generateAPI(prompt: string, profile: ProjectProfile, basePath: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const isTS = profile.hasTypeScript;
  const ext = isTS ? 'ts' : 'js';
  
  const routeName = extractName(prompt, 'route');
  
  // Next.js API route
  if (profile.frameworks.includes('next')) {
    const content = `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request${isTS ? ': NextRequest' : ''}) {
  try {
    // TODO: Implement ${prompt}
    return NextResponse.json({ message: 'Success' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request${isTS ? ': NextRequest' : ''}) {
  try {
    const body = await request.json();
    // TODO: Implement ${prompt}
    return NextResponse.json({ message: 'Created', data: body }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
`;
    
    files.push({
      path: path.join(basePath, routeName, `route.${ext}`),
      content,
      description: `Next.js API route for ${routeName}`
    });
  } else {
    // Express route
    const content = `${isTS ? "import { Router, Request, Response } from 'express';\n\n" : "const express = require('express');\n\n"}const router = ${isTS ? 'Router()' : 'express.Router()'};

// GET ${routeName}
router.get('/${routeName}', async (req${isTS ? ': Request' : ''}, res${isTS ? ': Response' : ''}) => {
  try {
    // TODO: Implement ${prompt}
    res.json({ message: 'Success' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST ${routeName}
router.post('/${routeName}', async (req${isTS ? ': Request' : ''}, res${isTS ? ': Response' : ''}) => {
  try {
    const data = req.body;
    // TODO: Implement ${prompt}
    res.status(201).json({ message: 'Created', data });
  } catch (error) {
    res.status(400).json({ error: 'Bad Request' });
  }
});

${isTS ? 'export default router;' : 'module.exports = router;'}
`;
    
    files.push({
      path: path.join(basePath, `${routeName}.${ext}`),
      content,
      description: `Express route for ${routeName}`
    });
  }
  
  return files;
}

function generateService(prompt: string, profile: ProjectProfile, basePath: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const isTS = profile.hasTypeScript;
  const ext = isTS ? 'ts' : 'js';
  
  const serviceName = extractName(prompt, 'service');
  
  const content = `${isTS ? `export interface ${capitalize(serviceName)}Data {
  // Define data structure
}

` : ''}export class ${capitalize(serviceName)}Service {
  async getAll()${isTS ? ': Promise<' + capitalize(serviceName) + 'Data[]>' : ''} {
    // TODO: Implement ${prompt}
    return [];
  }
  
  async getById(id${isTS ? ': string' : ''})${isTS ? ': Promise<' + capitalize(serviceName) + 'Data | null>' : ''} {
    // TODO: Implement get by ID
    return null;
  }
  
  async create(data${isTS ? ': Partial<' + capitalize(serviceName) + 'Data>' : ''})${isTS ? ': Promise<' + capitalize(serviceName) + 'Data>' : ''} {
    // TODO: Implement create
    throw new Error('Not implemented');
  }
  
  async update(id${isTS ? ': string' : ''}, data${isTS ? ': Partial<' + capitalize(serviceName) + 'Data>' : ''})${isTS ? ': Promise<' + capitalize(serviceName) + 'Data>' : ''} {
    // TODO: Implement update
    throw new Error('Not implemented');
  }
  
  async delete(id${isTS ? ': string' : ''})${isTS ? ': Promise<void>' : ''} {
    // TODO: Implement delete
  }
}

export default new ${capitalize(serviceName)}Service();
`;
  
  files.push({
    path: path.join(basePath, `${serviceName}Service.${ext}`),
    content,
    description: `Service class for ${serviceName} business logic`
  });
  
  return files;
}

function generateModel(prompt: string, profile: ProjectProfile, basePath: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const isTS = profile.hasTypeScript;
  const ext = isTS ? 'ts' : 'js';
  
  const modelName = extractName(prompt, 'model');
  
  const content = `${isTS ? `export interface ${capitalize(modelName)} {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  // TODO: Add fields for ${prompt}
}

export interface Create${capitalize(modelName)}Input {
  // TODO: Add required fields
}

export interface Update${capitalize(modelName)}Input {
  // TODO: Add updatable fields
}
` : `// ${capitalize(modelName)} Model
// TODO: Define model structure for ${prompt}
`}
export default ${isTS ? capitalize(modelName) : `{}`};
`;
  
  files.push({
    path: path.join(basePath, `${modelName}.${ext}`),
    content,
    description: `Data model for ${modelName}`
  });
  
  return files;
}

function generateTest(prompt: string, profile: ProjectProfile, basePath: string): GeneratedFile[] {
  // Test generation logic
  return [];
}

function extractName(prompt: string, type: string): string {
  const lower = prompt.toLowerCase();
  
  // Remove common words
  const stopWords = ['a', 'an', 'the', 'for', 'of', 'in', 'to', 'build', 'create', 'make', 
                     'generate', 'up', 'using', 'with', 'website', 'app', 'application'];
  
  const words = lower.split(' ').filter(w => 
    w.length > 2 && !stopWords.includes(w)
  );
  
  // Look for key terms
  if (lower.includes('f1') || lower.includes('racing')) {
    return 'racing';
  }
  if (lower.includes('shop') || lower.includes('store')) {
    return 'shop';
  }
  if (lower.includes('auth') || lower.includes('login')) {
    return 'auth';
  }
  if (lower.includes('dashboard')) {
    return 'dashboard';
  }
  if (lower.includes('profile')) {
    return 'profile';
  }
  
  // Take first meaningful word or combine first two
  if (words.length >= 2) {
    return words[0] + capitalize(words[1]);
  }
  
  return words[0] || type;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function explainStructure(files: GeneratedFile[], profile: ProjectProfile): string {
  const lines = ['Generated file structure:'];
  
  for (const file of files) {
    lines.push(`  📄 ${file.path}`);
    lines.push(`     ${file.description}`);
  }
  
  return lines.join('\n');
}

function generateExplanation(prompt: string, type: string, profile: ProjectProfile): string {
  return `Generated ${type} based on: "${prompt}"\n` +
         `Framework: ${profile.frameworks.join(', ')}\n` +
         `Language: ${profile.hasTypeScript ? 'TypeScript' : 'JavaScript'}\n` +
         `Following ${profile.architecture} architecture pattern.`;
}

function generateNextSteps(type: string, profile: ProjectProfile): string[] {
  const steps = [
    'Review generated files and customize as needed',
    'Add proper TypeScript types and interfaces',
    'Implement TODO sections with actual logic',
    'Run tests to ensure everything works',
    'Run "repoforge audit" to check for issues'
  ];
  
  if (type === 'component' || type === 'page') {
    steps.push('Add styling (CSS/Tailwind)');
    steps.push('Add props and state management');
  }
  
  if (type === 'api') {
    steps.push('Add input validation');
    steps.push('Add error handling');
    steps.push('Connect to database/service');
  }
  
  return steps;
}
