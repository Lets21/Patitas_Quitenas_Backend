import request from 'supertest';
import app from '../server';

describe('Rutas de autenticación', () => {
  it('POST /api/v1/auth/login responde con error si faltan datos', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: '', password: '' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
