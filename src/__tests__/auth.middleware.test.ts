import { describe, it, expect } from '@jest/globals';
import { requireAuth } from '../middleware/auth';

describe('Auth Middleware', () => {
  it('debería ser una función', () => {
    expect(typeof requireAuth).toBe('function');
  });
});
