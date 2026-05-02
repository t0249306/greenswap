const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User');
const Plant = require('./models/Plant');
const ExchangeRequest = require('./models/ExchangeRequest');
const Message = require('./models/Message');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/plants_db';

// Функция сидирования
async function seedDatabase() {
  try {
    const count = await Plant.countDocuments();
    if (count === 0) {
      console.log('Seeding initial plants...');
      let systemUser = await User.findOne({ username: 'system' });
      if (!systemUser) {
        systemUser = new User({ username: 'system', password: 'securepassword123' });
        await systemUser.save();
      }
      
      const plantsToSeed = [
        { name: 'Фикус Бенджамина', species: 'Ficus', description: 'Неприхотливое комнатное растение', imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d40?auto=format&fit=crop&q=80&w=400', owner: systemUser._id },
        { name: 'Монстера Деликатесная', species: 'Monstera', description: 'Крупное растение с резными листьями', imageUrl: 'https://images.unsplash.com/photo-1618220179428-22790b46a0eb?auto=format&fit=crop&q=80&w=400', owner: systemUser._id },
        { name: 'Кактус Эхинопсис', species: 'Cactus', description: 'Колючий друг на подоконнике', imageUrl: 'https://images.unsplash.com/photo-1551893665-f843f600794e?auto=format&fit=crop&q=80&w=400', owner: systemUser._id }
      ];
      
      await Plant.insertMany(plantsToSeed);
      console.log('Database seeded successfully');
    }
  } catch (err) {
    console.error('Seeding error:', err);
  }
}

// Подключаемся к реальной БД только если мы не в тестовом окружении
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGO_URI)
    .then(async () => {
      console.log('Connected to MongoDB');
      await seedDatabase();
    })
    .catch(err => console.error('MongoDB connection error:', err));
}

// POST /register
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.status(201).json({ token, user: { id: user._id, username, rating: user.rating } });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed' });
  }
});

// POST /login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ token, user: { id: user._id, username, rating: user.rating } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Middleware for auth
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /plants/my
app.get('/plants/my', authMiddleware, async (req, res) => {
  try {
    const plants = await Plant.find({ owner: req.userId }).populate('owner', 'username rating');
    res.json(plants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your plants' });
  }
});

// POST /plants
app.post('/plants', authMiddleware, async (req, res) => {
  try {
    const { name, species, description, imageUrl } = req.body;
    if (!name || !species) {
      return res.status(400).json({ error: 'Name and species are required' });
    }
    const plant = new Plant({ name, species, description, imageUrl, owner: req.userId });
    await plant.save();
    res.status(201).json(plant);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create plant' });
  }
});

// GET /plants
app.get('/plants', async (req, res) => {
  try {
    const plants = await Plant.find().populate('owner', 'username rating');
    res.json(plants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plants' });
  }
});

// POST /exchange-request
app.post('/exchange-request', authMiddleware, async (req, res) => {
  try {
    const { targetPlantId, offeredPlantId, message } = req.body;
    
    if (!targetPlantId) {
      return res.status(400).json({ error: 'targetPlantId is required' });
    }

    const exchangeRequest = new ExchangeRequest({
      requester: req.userId,
      targetPlant: targetPlantId,
      offeredPlant: offeredPlantId,
      message
    });

    await exchangeRequest.save();
    res.status(201).json(exchangeRequest);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create exchange request' });
  }
});

// GET /exchange-requests
app.get('/exchange-requests', authMiddleware, async (req, res) => {
  try {
    const myPlants = await Plant.find({ owner: req.userId }).select('_id');
    const myPlantIds = myPlants.map(p => p._id);
    
    const incoming = await ExchangeRequest.find({ targetPlant: { $in: myPlantIds } })
      .populate('requester', 'username')
      .populate('targetPlant', 'name species imageUrl')
      .populate('offeredPlant', 'name species imageUrl');
      
    const outgoing = await ExchangeRequest.find({ requester: req.userId })
      .populate('targetPlant', 'name species imageUrl owner')
      .populate('offeredPlant', 'name species imageUrl');
      
    res.json({ incoming, outgoing });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exchange requests' });
  }
});

// PUT /exchange-requests/:id/status
app.put('/exchange-requests/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const request = await ExchangeRequest.findById(req.params.id).populate('targetPlant');
    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    if (request.targetPlant.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to update this request' });
    }
    
    request.status = status;
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// GET /exchange-requests/:id/messages
app.get('/exchange-requests/:id/messages', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ exchangeRequest: req.params.id })
      .populate('sender', 'username')
      .sort('createdAt');
    res.json(messages);
  } catch (error) {
    console.error('GET messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
  }
});

// POST /exchange-requests/:id/messages
app.post('/exchange-requests/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const request = await ExchangeRequest.findById(req.params.id).populate('targetPlant');
    
    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    const isRequester = request.requester.toString() === req.userId;
    const isOwner = request.targetPlant.owner.toString() === req.userId;
    
    if (!isRequester && !isOwner) {
       return res.status(403).json({ error: 'Not part of this exchange' });
    }
    
    const message = new Message({
      exchangeRequest: request._id,
      sender: req.userId,
      text
    });
    
    await message.save();
    await message.populate('sender', 'username');
    
    res.status(201).json(message);
  } catch (error) {
    console.error('POST messages error:', error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

// Экспортируем app для тестов, а если файл запущен напрямую — стартуем сервер
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

