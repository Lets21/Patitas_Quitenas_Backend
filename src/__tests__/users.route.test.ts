import request from 'supertest';
import app from '../server';

describe('Rutas de usuarios', () => {
  it('GET /api/v1/users requiere autenticación', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
  });
});
