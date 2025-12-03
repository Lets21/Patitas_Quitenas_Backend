import { describe, it, expect } from '@jest/globals';
import { SystemSettings } from '../models/SystemSettings';

describe('SystemSettings Model', () => {
  it('debería crear configuración con nombre y usuarios máximos', () => {
    const setting = new SystemSettings({
      systemName: 'maxScore',
      maxUsers: 100
    });
    expect(setting.systemName).toBe('maxScore');
    expect(setting.maxUsers).toBe(100);
  });
});
