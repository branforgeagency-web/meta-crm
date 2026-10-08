const express = require('express');
const router = express.Router();
const { verifyWebhook, receiveWebhook, refreshLeadFromMeta, getMetaConfig } = require('../controllers/metaController');
const { protect, adminOnly } = require('../middleware/auth');

// Public endpoints called by Meta servers
router.get('/webhook', verifyWebhook);
router.post('/webhook', receiveWebhook);

// Admin endpoints
router.get('/config', protect, adminOnly, getMetaConfig);
router.post('/leads/:id/refresh', protect, refreshLeadFromMeta);

module.exports = router;
