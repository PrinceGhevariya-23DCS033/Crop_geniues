/**
 * Notification Model
 * Stores user notifications
 */

import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  text: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'info',
    enum: ['info', 'price', 'disease', 'recommendation', 'weather'],
  },
  read: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Virtual 'time' field for relative time display
notificationSchema.virtual('time').get(function () {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
});

notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
