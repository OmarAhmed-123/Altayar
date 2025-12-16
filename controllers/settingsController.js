const asyncHandler = require('express-async-handler');
const Page = require('../models/Page');
const Setting = require('../models/Setting');

// @desc    Get the general site settings
// @route   GET /api/settings/general
// @access  Private/Super Admin
exports.getGeneralSettings = asyncHandler(async (req, res) => {
    let settings = await Setting.query().findOne({ unique_key: 'general_settings' });
    if (!settings) {
        settings = await Setting.query().insert({}); // Create with default values
    }
    res.status(200).json(settings);
});

// @desc    Update the general site settings
// @route   PUT /api/settings/general
// @access  Private/Super Admin
exports.updateGeneralSettings = asyncHandler(async (req, res) => {
    const settings = await Setting.query().findOne({ unique_key: 'general_settings' });
    const updatedSettings = await settings.$query().patchAndFetch(req.body);
    res.status(200).json(updatedSettings);
});

// --- CMS PAGE CONTROLLERS ---

// @desc    Create a new CMS Page
// @route   POST /api/settings/pages
// @access  Private/Admin
exports.createPage = asyncHandler(async (req, res) => {
    const { name, slug, content, pageType } = req.body;
    const page = await Page.query().insert({
        name,
        slug,
        content,
        page_type: pageType,
        created_by: req.user.id,
    });
    res.status(200).json(page);
});

// @desc    Get all CMS Pages (Admin view)
// @route   GET /api/settings/pages
// @access  Private/Admin
exports.getAllPages = asyncHandler(async (req, res) => {
    const pages = await Page.query().withGraphFetched('creator(selectName)').modifiers({
        selectName(builder) { builder.select('name'); }
    });
    res.status(200).json(pages);
});

// @desc    Get a single CMS Page by slug (Frontend view)
// @route   GET /api/settings/pages/:slug
// @access  Public
exports.getPageBySlug = asyncHandler(async (req, res) => {
    const page = await Page.query().findOne({ slug: req.params.slug, is_published: true });
    if (page) {
        res.json(page);
    } else {
        res.status(404);
        throw new Error('Page not found or not published');
    }
});

// @desc    Update CMS Page
// @route   PUT /api/settings/pages/:id
// @access  Private/Admin
exports.updatePage = asyncHandler(async (req, res) => {
    const updatedPage = await Page.query().patchAndFetchById(req.params.id, req.body);
    if (updatedPage) {
        res.json(updatedPage);
    } else {
        res.status(404);
        throw new Error('Page not found');
    }
});

// @desc    Delete CMS Page
// @route   DELETE /api/settings/pages/:id
// @access  Private/Super Admin
exports.deletePage = asyncHandler(async (req, res) => {
    const numDeleted = await Page.query().deleteById(req.params.id);
    if (numDeleted) {
        res.json({ message: 'Page removed' });
    } else {
        res.status(404);
        throw new Error('Page not found');
    }
});