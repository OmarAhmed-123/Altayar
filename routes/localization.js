const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getLanguages,
  getCurrencies,
  getTranslations,
  convertCurrency,
  updateUserLanguage,
  updateUserCurrency,
  getUserPreferences,
  createLanguage,
  updateLanguage,
  createCurrency,
  updateCurrency,
  updateExchangeRates,
  setTranslation,
  setTranslationsBulk,
  getMissingTranslations,
  getTranslationStats,
  getLocalizationDashboard
} = require('../controllers/localizationController');

// Public routes
router.get('/languages', getLanguages);
router.get('/currencies', getCurrencies);
router.get('/translations/:languageCode', getTranslations);
router.post('/convert-currency', convertCurrency);

// Private routes
router.get('/user/preferences', protect, getUserPreferences);
router.put('/user/language', protect, updateUserLanguage);
router.put('/user/currency', protect, updateUserCurrency);

// Admin routes
router.get('/admin/dashboard', protect, authorize('super_admin', 'admin'), getLocalizationDashboard);
router.get('/admin/translations/statistics', protect, authorize('super_admin', 'admin'), getTranslationStats);
router.get('/admin/translations/missing/:languageCode', protect, authorize('super_admin', 'admin'), getMissingTranslations);

router.post('/admin/languages', protect, authorize('super_admin', 'admin'), createLanguage);
router.post('/admin/currencies', protect, authorize('super_admin', 'admin'), createCurrency);
router.post('/admin/translations', protect, authorize('super_admin', 'admin'), setTranslation);
router.post('/admin/translations/bulk', protect, authorize('super_admin', 'admin'), setTranslationsBulk);

router.put('/admin/languages/:id', protect, authorize('super_admin', 'admin'), updateLanguage);
router.put('/admin/currencies/:id', protect, authorize('super_admin', 'admin'), updateCurrency);
router.put('/admin/exchange-rates', protect, authorize('super_admin', 'admin'), updateExchangeRates);

module.exports = router;
