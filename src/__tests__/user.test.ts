import { describe, it, expect } from '@jest/globals';
import { User } from '../models/User';

// Ejemplo básico de test unitario

describe('User Model', () => {
  it('debería crear un usuario con nombre y email', () => {
    const user = new User({
      email: 'juan@email.com',
      password: '123456',
      role: 'ADOPTANTE',
      profile: {
        firstName: 'Juan',
        lastName: 'Pérez'
      },
      status: 'ACTIVE',
      isActive: true
    });
    expect(user.profile.firstName).toBe('Juan');
    expect(user.email).toBe('juan@email.com');
  });
});

// Aquí podrías agregar más tests unitarios y de integración
