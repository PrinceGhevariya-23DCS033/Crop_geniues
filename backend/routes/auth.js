/**
 * Auth Routes
 * 
 * POST /api/auth/register  — Create new user
 * POST /api/auth/login     — Login user
 * GET  /api/auth/me        — Get current user profile
 * PUT  /api/auth/profile    — Update profile
 * PUT  /api/auth/password   — Change password
 */

import { Router } from 'express';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect, generateToken } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, location } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      location: location || '',
    });

    // Create welcome notifications
    await Notification.insertMany([
      { user: user._id, text: 'Welcome to Crop Genius! Start by getting a crop recommendation.', type: 'info' },
      { user: user._id, text: 'New crop recommendation available for Kharif season', type: 'recommendation' },
      { user: user._id, text: 'Set up your profile to get personalized predictions', type: 'info' },
    ]);

    const token = generateToken(user._id);

    console.log(`✅ New user registered: ${user.email}`);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar,
        language: user.language,
        notifications: user.notifications,
      },
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Registration failed', detail: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    console.log(`✅ User logged in: ${user.email}`);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar,
        language: user.language,
        notifications: user.notifications,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ error: 'Login failed', detail: error.message });
  }
});

// GET /api/auth/me — Get current user
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        location: req.user.location,
        avatar: req.user.avatar,
        language: req.user.language,
        notifications: req.user.notifications,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// PUT /api/auth/profile — Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, location, language, avatar, notifications } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (location !== undefined) updates.location = location;
    if (language !== undefined) updates.language = language;
    if (avatar !== undefined) updates.avatar = avatar;
    if (notifications !== undefined) updates.notifications = notifications;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });

    console.log(`✅ Profile updated: ${user.email}`);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar,
        language: user.language,
        notifications: user.notifications,
      },
    });
  } catch (error) {
    console.error('❌ Profile update error:', error.message);
    res.status(500).json({ error: 'Failed to update profile', detail: error.message });
  }
});

// PUT /api/auth/password — Change password
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    console.log(`✅ Password changed: ${user.email}`);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('❌ Password change error:', error.message);
    res.status(500).json({ error: 'Failed to change password', detail: error.message });
  }
});

export { router as authRouter };
