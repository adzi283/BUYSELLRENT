const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@iiit.ac.in',
          password: 'password123',
          age: 20,
          contactNumber: '1234567890'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
    });

    it('should not register with non-IIIT email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@gmail.com',
          password: 'password123',
          age: 20,
          contactNumber: '1234567890'
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@iiit.ac.in',
        password: 'password123',
        age: 20,
        contactNumber: '1234567890'
      });
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@iiit.ac.in',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@iiit.ac.in',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });
}); 