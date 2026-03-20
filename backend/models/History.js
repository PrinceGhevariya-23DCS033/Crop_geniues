/**
 * History Model
 * Stores prediction history entries per user
 */

import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  module: {
    type: String,
    required: true,
    enum: ['Crop Recommendation', 'Yield Prediction', 'Leaf Disease', 'Price Prediction'],
  },
  input: {
    type: String,
    required: true,
  },
  result: {
    type: String,
    required: true,
  },
  confidence: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: 'success',
    enum: ['success', 'warning', 'danger'],
  },
  // Store full prediction response for reference
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Virtual 'date' field that returns formatted date
historySchema.virtual('date').get(function () {
  return this.createdAt.toISOString().split('T')[0];
});

// Ensure virtuals are included in JSON
historySchema.set('toJSON', { virtuals: true });
historySchema.set('toObject', { virtuals: true });

const History = mongoose.model('History', historySchema);
export default History;
