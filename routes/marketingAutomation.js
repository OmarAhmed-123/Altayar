const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createCampaign,
  getCampaigns,
  getCampaignDetails,
  updateCampaign,
  scheduleCampaign,
  startCampaign,
  pauseCampaign,
  getCampaignStatistics,
  createAutomatedTrigger,
  getAutomatedTriggers,
  updateAutomatedTrigger,
  toggleTriggerStatus,
  testTrigger,
  getMarketingDashboard
} = require('../controllers/marketingAutomationController');

// Marketing dashboard
router.get('/dashboard', protect, authorize('super_admin', 'admin', 'sales'), getMarketingDashboard);

// Campaign routes
router.get('/campaigns', protect, authorize('super_admin', 'admin', 'sales'), getCampaigns);
router.get('/campaigns/:id', protect, authorize('super_admin', 'admin', 'sales'), getCampaignDetails);
router.get('/campaigns/:id/statistics', protect, authorize('super_admin', 'admin', 'sales'), getCampaignStatistics);
router.post('/campaigns', protect, authorize('super_admin', 'admin', 'sales'), createCampaign);
router.put('/campaigns/:id', protect, authorize('super_admin', 'admin', 'sales'), updateCampaign);
router.post('/campaigns/:id/schedule', protect, authorize('super_admin', 'admin', 'sales'), scheduleCampaign);
router.post('/campaigns/:id/start', protect, authorize('super_admin', 'admin', 'sales'), startCampaign);
router.post('/campaigns/:id/pause', protect, authorize('super_admin', 'admin', 'sales'), pauseCampaign);

// Automated trigger routes
router.get('/triggers', protect, authorize('super_admin', 'admin', 'sales'), getAutomatedTriggers);
router.post('/triggers', protect, authorize('super_admin', 'admin', 'sales'), createAutomatedTrigger);
router.put('/triggers/:id', protect, authorize('super_admin', 'admin', 'sales'), updateAutomatedTrigger);
router.post('/triggers/:id/toggle', protect, authorize('super_admin', 'admin', 'sales'), toggleTriggerStatus);
router.post('/triggers/:id/test', protect, authorize('super_admin', 'admin', 'sales'), testTrigger);

module.exports = router;
