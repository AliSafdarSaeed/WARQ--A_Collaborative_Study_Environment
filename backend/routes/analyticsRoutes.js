const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/authMiddleware');

// Track user activity
router.post('/track', authenticate, analyticsController.trackActivity);
// Get analytics for a user
router.get('/user/:userId', authenticate, analyticsController.getAnalytics);

module.exports = router;
