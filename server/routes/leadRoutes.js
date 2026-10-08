const express = require('express');
const router = express.Router();
const c = require('../controllers/leadController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.param('id', c.validateLeadId);

router.get('/', c.getLeads);
router.get('/stats', c.getLeadStats);
router.get('/filters', c.getFilterOptions);
router.get('/campaigns', c.getCampaignStats);
router.get('/export', c.exportLeads);
router.post('/', c.createLead);
router.post('/batch', c.batchImportLeads);

router.get('/:id', c.getLeadById);
router.patch('/:id/status', c.updateLeadStatus);
router.patch('/:id/assign', c.assignLead);
router.post('/:id/notes', c.addNote);
router.patch('/:id/followup', c.scheduleFollowUp);

module.exports = router;
