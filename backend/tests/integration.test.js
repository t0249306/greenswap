const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Plant = require('../models/Plant');
const ExchangeRequest = require('../models/ExchangeRequest');
const Message = require('../models/Message');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('API Integration Tests', () => {
  let user1Token;
  let user2Token;
  let user1Id;
  let plant1Id;
  let plant2Id;
  let requestId;

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/register')
        .send({ username: 'user1', password: 'password123' });
      expect(res.statusCode).toBe(201);
      expect(res.body.token).toBeDefined();
      user1Token = res.body.token;
      user1Id = res.body.user.id;
    });

    it('should fail to register with duplicate username', async () => {
      const res = await request(app)
        .post('/register')
        .send({ username: 'user1', password: 'password123' });
      expect(res.statusCode).toBe(400);
    });

    it('should register a second user', async () => {
      const res = await request(app)
        .post('/register')
        .send({ username: 'user2', password: 'password123' });
      expect(res.statusCode).toBe(201);
      user2Token = res.body.token;
    });

    it('should login successfully', async () => {
      const res = await request(app)
        .post('/login')
        .send({ username: 'user1', password: 'password123' });
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('should fail login with wrong credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({ username: 'user1', password: 'wrongpassword' });
      expect(res.statusCode).toBe(401);
    });

    it('should return 500 on login error', async () => {
      const findOneSpy = jest.spyOn(User, 'findOne').mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      const res = await request(app)
        .post('/login')
        .send({ username: 'user1', password: 'password123' });
      expect(res.statusCode).toBe(500);
      findOneSpy.mockRestore();
    });
  });

  describe('Auth Middleware', () => {
    it('should return 401 for unauthorized access', async () => {
      const res = await request(app).get('/plants/my');
      expect(res.statusCode).toBe(401);
    });

    it('should return 401 for invalid token', async () => {
      const res = await request(app)
        .get('/plants/my')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Plant Management', () => {
    it('should create a plant', async () => {
      const res = await request(app)
        .post('/plants')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Monstera', species: 'Monstera Deliciosa', description: 'Green' });
      expect(res.statusCode).toBe(201);
      plant1Id = res.body._id;
    });

    it('should create another plant for second user', async () => {
      const res = await request(app)
        .post('/plants')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ name: 'Cactus', species: 'Desert', description: 'Spiky' });
      expect(res.statusCode).toBe(201);
      plant2Id = res.body._id;
    });

    it('should fail to create plant without required fields', async () => {
      const res = await request(app)
        .post('/plants')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Incomplete' });
      expect(res.statusCode).toBe(400);
    });

    it('should return 400 on plant save error', async () => {
      const saveSpy = jest.spyOn(Plant.prototype, 'save').mockImplementationOnce(() => {
        throw new Error('Save error');
      });
      const res = await request(app)
        .post('/plants')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Error', species: 'Error' });
      expect(res.statusCode).toBe(400);
      saveSpy.mockRestore();
    });

    it('should get all plants', async () => {
      const res = await request(app).get('/plants');
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 500 on get all plants error', async () => {
      const findSpy = jest.spyOn(Plant, 'find').mockReturnValueOnce({
        populate: jest.fn().mockImplementationOnce(() => {
          throw new Error('Find error');
        })
      });
      const res = await request(app).get('/plants');
      expect(res.statusCode).toBe(500);
      findSpy.mockRestore();
    });

    it('should get my plants', async () => {
      const res = await request(app)
        .get('/plants/my')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });

  describe('Exchange Requests', () => {
    it('should create an exchange request', async () => {
      const res = await request(app)
        .post('/exchange-request')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ targetPlantId: plant1Id, offeredPlantId: plant2Id, message: 'Swap?' });
      expect(res.statusCode).toBe(201);
      requestId = res.body._id;
    });

    it('should fail to create request without targetPlantId', async () => {
      const res = await request(app)
        .post('/exchange-request')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ offeredPlantId: plant2Id });
      expect(res.statusCode).toBe(400);
    });

    it('should get exchange requests', async () => {
      const res = await request(app)
        .get('/exchange-requests')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.incoming.length).toBe(1);
    });

    it('should fail to update status with invalid value', async () => {
      const res = await request(app)
        .put(`/exchange-requests/${requestId}/status`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'maybe' });
      expect(res.statusCode).toBe(400);
    });

    it('should update request status', async () => {
      const res = await request(app)
        .put(`/exchange-requests/${requestId}/status`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'accepted' });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('accepted');
    });

    it('should return 404 if request not found', async () => {
      const res = await request(app)
        .put(`/exchange-requests/${new mongoose.Types.ObjectId()}/status`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'accepted' });
      expect(res.statusCode).toBe(404);
    });

    it('should return 403 if not authorized to update status', async () => {
      const res = await request(app)
        .put(`/exchange-requests/${requestId}/status`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ status: 'rejected' });
      expect(res.statusCode).toBe(403);
    });

    it('should return 500 on update status error', async () => {
      const findByIdSpy = jest.spyOn(ExchangeRequest, 'findById').mockImplementationOnce(() => {
        throw new Error('DB error');
      });
      const res = await request(app)
        .put(`/exchange-requests/${requestId}/status`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'rejected' });
      expect(res.statusCode).toBe(500);
      findByIdSpy.mockRestore();
    });
  });

  describe('Messages', () => {
    it('should send and get messages', async () => {
      await request(app)
        .post(`/exchange-requests/${requestId}/messages`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ text: 'Hello' });
      
      const res = await request(app)
        .get(`/exchange-requests/${requestId}/messages`)
        .set('Authorization', `Bearer ${user1Token}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].text).toBe('Hello');
    });

    it('should fail to send message to non-existent request', async () => {
      const res = await request(app)
        .post(`/exchange-requests/${new mongoose.Types.ObjectId()}/messages`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ text: 'Hi' });
      expect(res.statusCode).toBe(404);
    });

    it('should return 403 if sender is not part of exchange', async () => {
       // Register user3
       const regRes = await request(app)
         .post('/register')
         .send({ username: 'user3', password: 'password' });
       const user3Token = regRes.body.token;

       const res = await request(app)
         .post(`/exchange-requests/${requestId}/messages`)
         .set('Authorization', `Bearer ${user3Token}`)
         .send({ text: 'Intruder' });
       expect(res.statusCode).toBe(403);
    });

    it('should return 500 on get messages error', async () => {
      const findSpy = jest.spyOn(Message, 'find').mockImplementationOnce(() => {
        throw new Error('DB error');
      });
      const res = await request(app)
        .get(`/exchange-requests/${requestId}/messages`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.statusCode).toBe(500);
      findSpy.mockRestore();
    });

    it('should return 500 on send message error', async () => {
      const findByIdSpy = jest.spyOn(ExchangeRequest, 'findById').mockImplementationOnce(() => {
        throw new Error('DB error');
      });
      const res = await request(app)
        .post(`/exchange-requests/${requestId}/messages`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ text: 'Error' });
      expect(res.statusCode).toBe(500);
      findByIdSpy.mockRestore();
    });
  });
});
