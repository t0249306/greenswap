const mongoose = require('mongoose');

const exchangeRequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetPlant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true },
  offeredPlant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  message: { type: String },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ExchangeRequest', exchangeRequestSchema);
