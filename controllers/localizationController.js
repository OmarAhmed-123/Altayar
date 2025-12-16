const asyncHandler = require('express-async-handler');
const Language = require('../models/Language');
const Currency = require('../models/Currency');
const Translation = require('../models/Translation');
const User = require('../models/User');
const { db } = require('../config/db');

// @desc    Get available languages
// @route   GET /api/localization/languages
// @access  Public
exports.getLanguages = asyncHandler(async (req, res) => {
  const languages = await Language.getActiveLanguages();

  res.json({
    success: true,
    data: languages
  });
});

// @desc    Get available currencies
// @route   GET /api/localization/currencies
// @access  Public
exports.getCurrencies = asyncHandler(async (req, res) => {
  const currencies = await Currency.getActiveCurrencies();

  res.json({
    success: true,
    data: currencies
  });
});

// @desc    Get translations for language
// @route   GET /api/localization/translations/:languageCode
// @access  Public
exports.getTranslations = asyncHandler(async (req, res) => {
  const { languageCode } = req.params;
  const { category } = req.query;

  const translations = await Translation.getTranslationsForLanguage(languageCode, category);

  res.json({
    success: true,
    data: translations
  });
});

// @desc    Convert currency
// @route   POST /api/localization/convert-currency
// @access  Public
exports.convertCurrency = asyncHandler(async (req, res) => {
  const { amount, fromCurrency, toCurrency } = req.body;

  if (!amount || !fromCurrency || !toCurrency) {
    res.status(400);
    throw new Error('Amount, fromCurrency, and toCurrency are required');
  }

  const convertedAmount = await Currency.convertAmount(amount, fromCurrency, toCurrency);

  res.json({
    success: true,
    data: {
      original_amount: amount,
      original_currency: fromCurrency,
      converted_amount: convertedAmount,
      target_currency: toCurrency
    }
  });
});

// @desc    Update user language preference
// @route   PUT /api/localization/user/language
// @access  Private
exports.updateUserLanguage = asyncHandler(async (req, res) => {
  const { languageCode } = req.body;

  const language = await Language.getByCode(languageCode);
  if (!language) {
    res.status(400);
    throw new Error('Language not found');
  }

  await User.query().findById(req.user.id).patch({
    language_id: language.id
  });

  res.json({
    success: true,
    message: 'Language preference updated successfully',
    data: { language }
  });
});

// @desc    Update user currency preference
// @route   PUT /api/localization/user/currency
// @access  Private
exports.updateUserCurrency = asyncHandler(async (req, res) => {
  const { currencyCode } = req.body;

  const currency = await Currency.getByCode(currencyCode);
  if (!currency) {
    res.status(400);
    throw new Error('Currency not found');
  }

  await User.query().findById(req.user.id).patch({
    currency_id: currency.id
  });

  res.json({
    success: true,
    message: 'Currency preference updated successfully',
    data: { currency }
  });
});

// @desc    Get user localization preferences
// @route   GET /api/localization/user/preferences
// @access  Private
exports.getUserPreferences = asyncHandler(async (req, res) => {
  const user = await User.query()
    .findById(req.user.id)
    .withGraphFetched('[language, currency]')
    .first();

  res.json({
    success: true,
    data: {
      language: user.language,
      currency: user.currency
    }
  });
});

// @desc    Create language (Admin)
// @route   POST /api/localization/admin/languages
// @access  Private/Admin
exports.createLanguage = asyncHandler(async (req, res) => {
  const { code, name, nativeName, flagEmoji, isRtl, isDefault, sortOrder } = req.body;

  const language = await Language.query().insert({
    code,
    name,
    native_name: nativeName,
    flag_emoji: flagEmoji,
    is_rtl: isRtl || false,
    is_default: isDefault || false,
    sort_order: sortOrder || 0
  });

  if (isDefault) {
    await language.setAsDefault();
  }

  res.status(200).json({
    success: true,
    data: language,
    message: 'Language created successfully'
  });
});

// @desc    Update language (Admin)
// @route   PUT /api/localization/admin/languages/:id
// @access  Private/Admin
exports.updateLanguage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const language = await Language.query().findById(id);
  if (!language) {
    res.status(404);
    throw new Error('Language not found');
  }

  const updatedLanguage = await language.$query().patchAndFetch(updateData);

  if (updateData.is_default) {
    await updatedLanguage.setAsDefault();
  }

  res.json({
    success: true,
    data: updatedLanguage,
    message: 'Language updated successfully'
  });
});

// @desc    Create currency (Admin)
// @route   POST /api/localization/admin/currencies
// @access  Private/Admin
exports.createCurrency = asyncHandler(async (req, res) => {
  const { code, name, symbol, exchangeRate, isDefault, decimalPlaces, position } = req.body;

  const currency = await Currency.query().insert({
    code,
    name,
    symbol,
    exchange_rate: exchangeRate || 1.0000,
    is_default: isDefault || false,
    decimal_places: decimalPlaces || 2,
    position: position || 'before'
  });

  if (isDefault) {
    await currency.setAsDefault();
  }

  res.status(200).json({
    success: true,
    data: currency,
    message: 'Currency created successfully'
  });
});

// @desc    Update currency (Admin)
// @route   PUT /api/localization/admin/currencies/:id
// @access  Private/Admin
exports.updateCurrency = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const currency = await Currency.query().findById(id);
  if (!currency) {
    res.status(404);
    throw new Error('Currency not found');
  }

  const updatedCurrency = await currency.$query().patchAndFetch(updateData);

  if (updateData.is_default) {
    await updatedCurrency.setAsDefault();
  }

  res.json({
    success: true,
    data: updatedCurrency,
    message: 'Currency updated successfully'
  });
});

// @desc    Update exchange rates (Admin)
// @route   PUT /api/localization/admin/exchange-rates
// @access  Private/Admin
exports.updateExchangeRates = asyncHandler(async (req, res) => {
  const { rates } = req.body;

  if (!rates || typeof rates !== 'object') {
    res.status(400);
    throw new Error('Rates object is required');
  }

  await Currency.updateExchangeRates(rates);

  res.json({
    success: true,
    message: 'Exchange rates updated successfully'
  });
});

// @desc    Set translation (Admin)
// @route   POST /api/localization/admin/translations
// @access  Private/Admin
exports.setTranslation = asyncHandler(async (req, res) => {
  const { key, languageCode, value, category } = req.body;

  const translation = await Translation.setTranslation(key, languageCode, value, category);

  res.json({
    success: true,
    data: translation,
    message: 'Translation set successfully'
  });
});

// @desc    Bulk set translations (Admin)
// @route   POST /api/localization/admin/translations/bulk
// @access  Private/Admin
exports.setTranslationsBulk = asyncHandler(async (req, res) => {
  const { languageCode, translations, category } = req.body;

  await Translation.setTranslations(languageCode, translations, category);

  res.json({
    success: true,
    message: 'Translations set successfully'
  });
});

// @desc    Get missing translations (Admin)
// @route   GET /api/localization/admin/translations/missing/:languageCode
// @access  Private/Admin
exports.getMissingTranslations = asyncHandler(async (req, res) => {
  const { languageCode } = req.params;
  const { referenceLanguage = 'en' } = req.query;

  const missing = await Translation.getMissingTranslations(languageCode, referenceLanguage);

  res.json({
    success: true,
    data: missing
  });
});

// @desc    Get translation statistics (Admin)
// @route   GET /api/localization/admin/translations/statistics
// @access  Private/Admin
exports.getTranslationStats = asyncHandler(async (req, res) => {
  const stats = await Translation.getTranslationStats();

  res.json({
    success: true,
    data: stats
  });
});

// @desc    Get localization dashboard (Admin)
// @route   GET /api/localization/admin/dashboard
// @access  Private/Admin
exports.getLocalizationDashboard = asyncHandler(async (req, res) => {
  const languages = await Language.query().orderBy('sort_order', 'asc');
  const currencies = await Currency.query().orderBy('is_default', 'desc');
  const translationStats = await Translation.getTranslationStats();

  // Get user language preferences
  const userLanguageStats = await User.query()
    .groupBy('language_id')
    .select('language_id', db.raw('count(*)::int as count'))
    .withGraphFetched('language(selectBasicInfo)')
    .modifiers({
      selectBasicInfo(builder) {
        builder.select('id', 'name', 'code');
      }
    });

  // Get user currency preferences
  const userCurrencyStats = await User.query()
    .groupBy('currency_id')
    .select('currency_id', db.raw('count(*)::int as count'))
    .withGraphFetched('currency(selectBasicInfo)')
    .modifiers({
      selectBasicInfo(builder) {
        builder.select('id', 'name', 'code');
      }
    });

  res.json({
    success: true,
    data: {
      languages,
      currencies,
      translation_stats: translationStats,
      user_language_stats: userLanguageStats,
      user_currency_stats: userCurrencyStats
    }
  });
});
