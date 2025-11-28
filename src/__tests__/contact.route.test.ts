import request from 'supertest';
import app from '../server';

describe('Rutas de contacto', () => {
  it('POST /api/v1/contact responde con error si faltan datos', async () => {
    const res = await request(app)
      .post('/api/v1/contact')
      .send({ email: '', message: '' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
