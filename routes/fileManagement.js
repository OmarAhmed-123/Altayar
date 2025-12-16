const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/uploadMiddleware');
const {
  downloadMembershipCard,
  downloadMembershipCardPDF,
  downloadVoucher,
  downloadInvoice,
  getUserDownloads,
  getDownloadStatistics,
  getPopularDownloads,
  getMembershipCardQR,
  uploadCustomFile,
  getDownloadUrl
} = require('../controllers/fileManagementController');

// Private routes
router.get('/membership-card', protect, downloadMembershipCard);
router.get('/membership-card/pdf/:cardId', protect, downloadMembershipCardPDF);
router.get('/membership-card/qr/:cardId', protect, getMembershipCardQR);
router.get('/voucher/:voucherId', protect, downloadVoucher);
router.get('/invoice/:bookingId', protect, downloadInvoice);
router.get('/downloads', protect, getUserDownloads);
router.get('/download-url/:fileType/:id', protect, getDownloadUrl);
router.post('/upload', protect, upload.single('file'), uploadCustomFile);

// Admin routes
router.get('/statistics', protect, authorize('super_admin', 'admin'), getDownloadStatistics);
router.get('/popular', protect, authorize('super_admin', 'admin'), getPopularDownloads);

module.exports = router;
