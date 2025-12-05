import { describe, it, expect } from 'vitest';
import { health } from '../src/routes/health';

describe('health', () => {
  it('should return ok status', () => {
    const result = health();
    expect(result.status).toBe('ok');
  });
});
