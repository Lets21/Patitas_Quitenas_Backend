import { describe, it, expect } from '@jest/globals';
import { ContactMessage } from '../models/ContactMessage';

describe('ContactMessage Model', () => {
  it('debería crear un mensaje de contacto con nombre, email y mensaje', () => {
    const msg = new ContactMessage({
      name: 'Juan',
      email: 'test@email.com',
      subject: 'Consulta',
      message: 'Hola',
      status: 'NEW'
    });
    expect(msg.name).toBe('Juan');
    expect(msg.email).toBe('test@email.com');
    expect(msg.message).toBe('Hola');
  });
});
