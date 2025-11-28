import { describe, it, expect } from '@jest/globals';
import { scoreApplication } from '../services/scoring/scoreApplication';

describe('Score Application Service', () => {
  it('debería ser una función', () => {
    expect(typeof scoreApplication).toBe('function');
  });
});
