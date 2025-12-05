/**
 * Unit Tests for Framework-Specific Rules
 * Tests for React and Node.js specific rules
 */

import { describe, it, expect } from 'vitest';
import { reactRules } from './reactRules';
import { nodeRules } from './nodeRules';
import { RuleContext } from './types';

describe('React Rules', () => {
  const mockContext = (filePath: string, fileContent: string): RuleContext => ({
    filePath,
    fileContent,
    projectProfile: {
      type: 'frontend',
      frameworks: ['react'],
      architecture: 'modular',
      hasTests: true,
      hasTypeScript: true,
      hasBuildConfig: true,
      packageManager: 'npm',
      confidence: 90
    },
    allFiles: [filePath]
  });

  describe('REACT001: Async useEffect', () => {
    it('should detect async function in useEffect', () => {
      const code = `
        import { useEffect } from 'react';
        
        function MyComponent() {
          useEffect(async () => {
            const data = await fetchData();
            setData(data);
          }, []);
        }
      `;
      
      const context = mockContext('Component.tsx', code);
      const violations = reactRules[0].check(context);
      
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].ruleId).toBe('REACT001_ASYNC_USEEFFECT');
      expect(violations[0].severity).toBe('HIGH');
    });

    it('should not flag correct useEffect pattern', () => {
      const code = `
        import { useEffect } from 'react';
        
        function MyComponent() {
          useEffect(() => {
            const fetchData = async () => {
              const data = await fetch(url);
              setData(data);
            };
            fetchData();
          }, []);
        }
      `;
      
      const context = mockContext('Component.tsx', code);
      const violations = reactRules[0].check(context);
      
      expect(violations.length).toBe(0);
    });

    it('should only check React files', () => {
      const code = `
        useEffect(async () => {
          await something();
        }, []);
      `;
      
      const context = mockContext('file.ts', code);
      const violations = reactRules[0].check(context);
      
      expect(violations.length).toBe(0);
    });
  });

  describe('REACT002: Server Code in Client', () => {
    it('should detect database query in client component', () => {
      const code = `'use client';

export default function Page() {
  const data = db.query('SELECT * FROM users');
  return <div>{data}</div>;
}`;
      
      const context = mockContext('page.tsx', code);
      const violations = reactRules[1].check(context);
      
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].ruleId).toBe('REACT002_SERVER_IN_CLIENT');
      expect(violations[0].severity).toBe('HIGH');
    });

    it('should detect server env var in client component', () => {
      const code = `
        'use client';
        
        export default function Page() {
          const secret = process.env.DATABASE_URL;
          return <div>Secret: {secret}</div>;
        }
      `;
      
      const context = mockContext('page.tsx', code);
      const violations = reactRules[1].check(context);
      
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('server-side environment variable');
    });

    it('should allow NEXT_PUBLIC_ env vars in client', () => {
      const code = `
        'use client';
        
        export default function Page() {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          return <div>API: {apiUrl}</div>;
        }
      `;
      
      const context = mockContext('page.tsx', code);
      const violations = reactRules[1].check(context);
      
      expect(violations.length).toBe(0);
    });

    it('should not check server components', () => {
      const code = `
        export default async function Page() {
          const data = await prisma.user.findMany();
          return <div>{data}</div>;
        }
      `;
      
      const context = mockContext('page.tsx', code);
      const violations = reactRules[1].check(context);
      
      expect(violations.length).toBe(0);
    });
  });
});

describe('Node.js Rules', () => {
  const mockContext = (filePath: string, fileContent: string): RuleContext => ({
    filePath,
    fileContent,
    projectProfile: {
      type: 'backend',
      frameworks: ['express'],
      architecture: 'layered',
      hasTests: true,
      hasTypeScript: true,
      hasBuildConfig: true,
      packageManager: 'npm',
      confidence: 90
    },
    allFiles: [filePath]
  });

  describe('NODE001: Missing Input Validation', () => {
    it('should detect unvalidated request body usage', () => {
      const code = `
        app.post('/user', (req, res) => {
          const email = req.body.email;
          const user = createUser(email);
          res.json(user);
        });
      `;
      
      const context = mockContext('routes/user.ts', code);
      const violations = nodeRules[0].check(context);
      
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].ruleId).toBe('NODE001_MISSING_INPUT_VALIDATION');
      expect(violations[0].severity).toBe('HIGH');
    });

    it('should not flag when validation library is present', () => {
      const code = `
        import { z } from 'zod';
        
        app.post('/user', (req, res) => {
          const schema = z.object({ email: z.string().email() });
          const validated = schema.parse(req.body);
          const user = createUser(validated.email);
          res.json(user);
        });
      `;
      
      const context = mockContext('routes/user.ts', code);
      const violations = nodeRules[0].check(context);
      
      expect(violations.length).toBe(0);
    });

    it('should only check route files', () => {
      const code = `
        const email = req.body.email;
      `;
      
      const context = mockContext('utils/helper.ts', code);
      const violations = nodeRules[0].check(context);
      
      expect(violations.length).toBe(0);
    });
  });

  describe('NODE002: Inconsistent Status Codes', () => {
    it('should detect 200 used for errors', () => {
      const code = `
        app.get('/user/:id', (req, res) => {
          if (!user) {
            return res.status(200).json({ error: 'User not found' });
          }
        });
      `;
      
      const context = mockContext('routes/user.ts', code);
      const violations = nodeRules[1].check(context);
      
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].ruleId).toBe('NODE002_INCONSISTENT_STATUS_CODES');
      expect(violations[0].message).toContain('200 OK used for error responses');
    });

    it('should detect 204 with response body', () => {
      const code = `
        app.delete('/user/:id', (req, res) => {
          deleteUser(id);
          res.status(204).json({ message: 'Deleted' });
        });
      `;
      
      const context = mockContext('routes/user.ts', code);
      const violations = nodeRules[1].check(context);
      
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('204 No Content with response body');
    });

    it('should detect 200 in catch block', () => {
      const code = `
        app.get('/user/:id', async (req, res) => {
          try {
            const user = await getUser(id);
            res.json(user);
          } catch (error) {
            res.status(200).json({ error: error.message });
          }
        });
      `;
      
      const context = mockContext('routes/user.ts', code);
      const violations = nodeRules[1].check(context);
      
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].message).toContain('200 OK');
    });

    it('should only check route files', () => {
      const code = `
        res.status(200).json({ error: 'test' });
      `;
      
      const context = mockContext('utils/helper.ts', code);
      const violations = nodeRules[1].check(context);
      
      expect(violations.length).toBe(0);
    });
  });
});
