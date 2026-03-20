/**
 * History Routes
 * 
 * GET    /api/history          — Get user's prediction history
 * POST   /api/history          — Add a history entry
 * DELETE /api/history/:id      — Delete a single entry
 * DELETE /api/history          — Clear all history
 * GET    /api/history/stats    — Get dashboard stats from actual data
 */

import { Router } from 'express';
import History from '../models/History.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// All routes require auth
router.use(protect);

// GET /api/history — list user's history (newest first)
router.get('/', async (req, res) => {
  try {
    const { module, search, limit = 100 } = req.query;

    const filter = { user: req.user._id };
    if (module && module !== 'All') {
      filter.module = module;
    }
    if (search) {
      filter.$or = [
        { result: { $regex: search, $options: 'i' } },
        { module: { $regex: search, $options: 'i' } },
        { input: { $regex: search, $options: 'i' } },
      ];
    }

    const history = await History.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    // Add formatted date
    const formatted = history.map(h => ({
      id: h._id,
      module: h.module,
      input: h.input,
      result: h.result,
      confidence: h.confidence,
      status: h.status,
      date: h.createdAt ? new Date(h.createdAt).toISOString().split('T')[0] : '',
      metadata: h.metadata,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('❌ History fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// POST /api/history — add entry
router.post('/', async (req, res) => {
  try {
    const { module, input, result, confidence, status, metadata } = req.body;

    if (!module || !input || !result) {
      return res.status(400).json({ error: 'module, input, and result are required' });
    }

    const entry = await History.create({
      user: req.user._id,
      module,
      input,
      result,
      confidence: confidence || '',
      status: status || 'success',
      metadata: metadata || {},
    });

    res.status(201).json({
      id: entry._id,
      module: entry.module,
      input: entry.input,
      result: entry.result,
      confidence: entry.confidence,
      status: entry.status,
      date: entry.createdAt.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('❌ History add error:', error.message);
    res.status(500).json({ error: 'Failed to save history entry' });
  }
});

// DELETE /api/history/:id — delete one entry
router.delete('/:id', async (req, res) => {
  try {
    const entry = await History.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!entry) {
      return res.status(404).json({ error: 'History entry not found' });
    }

    res.json({ message: 'Entry deleted' });
  } catch (error) {
    console.error('❌ History delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// DELETE /api/history — clear all history for user
router.delete('/', async (req, res) => {
  try {
    const result = await History.deleteMany({ user: req.user._id });
    res.json({ message: `Deleted ${result.deletedCount} entries` });
  } catch (error) {
    console.error('❌ History clear error:', error.message);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

// GET /api/history/stats — dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get counts by module
    const [totalCount, moduleStats, recentPredictions] = await Promise.all([
      History.countDocuments({ user: userId }),
      History.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$module', count: { $sum: 1 } } },
      ]),
      History.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(1)
        .lean(),
    ]);

    const stats = {
      totalPredictions: totalCount,
      byModule: {},
      lastPrediction: recentPredictions[0] || null,
    };

    moduleStats.forEach(m => {
      stats.byModule[m._id] = m.count;
    });

    res.json(stats);
  } catch (error) {
    console.error('❌ Stats error:', error.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export { router as historyRouter };
