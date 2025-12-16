const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  googleLogin,
  googleCallback,
  appleLogin,
  appleCallback,
  oauthFailure,
  getUserProviders,
  linkProvider,
  unlinkProvider,
  getOAuthConfig,
  tokenExchange
} = require('../controllers/oauthController');

// Public OAuth routes
router.get('/config', getOAuthConfig);
router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);
router.get('/apple', appleLogin);
router.post('/apple/callback', appleCallback);
router.get('/failure', oauthFailure);
router.post('/token-exchange', tokenExchange);

// Private OAuth routes
router.get('/providers', protect, getUserProviders);
router.post('/link', protect, linkProvider);
router.delete('/unlink/:provider', protect, unlinkProvider);

module.exports = router;
