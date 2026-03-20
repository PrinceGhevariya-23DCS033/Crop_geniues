/**
 * Notification Routes
 * 
 * GET    /api/notifications         — Get user's notifications
 * PUT    /api/notifications/:id/read — Mark one as read
 * PUT    /api/notifications/read-all — Mark all as read
 * DELETE /api/notifications/:id      — Delete one notification
 */

import { Router } from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formatted = notifications.map(n => {
      // Calculate relative time
      const now = new Date();
      const diffMs = now - new Date(n.createdAt);
      const diffMins = Math.floor(diffMs / 60000);
      let time;
      if (diffMins < 1) time = 'Just now';
      else if (diffMins < 60) time = `${diffMins}m ago`;
      else if (diffMins < 1440) time = `${Math.floor(diffMins / 60)}h ago`;
      else time = `${Math.floor(diffMins / 1440)}d ago`;

      return {
        id: n._id,
        text: n.text,
        type: n.type,
        read: n.read,
        time,
        createdAt: n.createdAt,
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('❌ Notifications fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export { router as notificationRouter };
