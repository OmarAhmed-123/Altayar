const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAffiliateCampaigns,
  joinAffiliateCampaign,
  getMyAffiliateLinks,
  getAffiliateLinkDetails,
  trackAffiliateClick,
  processReferral,
  getAffiliateEarnings,
  requestPayout,
  createAffiliateCampaign,
  getAllAffiliateCampaigns,
  getAffiliateCampaignDetails,
  getAffiliateDashboard,
  inviteFriend
} = require('../controllers/affiliateController');

// Public routes
router.get('/campaigns', getAffiliateCampaigns);
router.post('/track-click', trackAffiliateClick);

// Private routes
router.get('/my-links', protect, getMyAffiliateLinks);
router.get('/links/:id', protect, getAffiliateLinkDetails);
router.get('/earnings', protect, getAffiliateEarnings);
router.post('/join/:campaignId', protect, joinAffiliateCampaign);
router.post('/process-referral', protect, processReferral);
router.post('/request-payout', protect, requestPayout);
router.post('/invite', protect, inviteFriend);

// Admin routes
router.get('/admin/dashboard', protect, authorize('super_admin', 'admin'), getAffiliateDashboard);
router.get('/admin/campaigns', protect, authorize('super_admin', 'admin'), getAllAffiliateCampaigns);
router.get('/admin/campaigns/:id', protect, authorize('super_admin', 'admin'), getAffiliateCampaignDetails);
router.post('/admin/campaigns', protect, authorize('super_admin', 'admin'), createAffiliateCampaign);

module.exports = router;
