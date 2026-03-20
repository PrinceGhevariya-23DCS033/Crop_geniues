/**
 * Auth Middleware
 * Verifies JWT token and attaches user to request
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = () => process.env.JWT_SECRET || 'crop-genius-secret-key-2026';

/**
 * Protect routes — requires valid JWT
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET());
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ error: 'Not authorized, token invalid' });
  }
};

/**
 * Optional auth — attaches user if token present, continues otherwise
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET());
      req.user = await User.findById(decoded.id);
    }
  } catch {
    // Silently continue without user
  }
  next();
};

/**
 * Generate JWT token
 */
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET(), { expiresIn: '30d' });
};
