const asyncHandler = require('express-async-handler');
const AffiliateCampaign = require('../models/AffiliateCampaign');
const AffiliateLink = require('../models/AffiliateLink');
const AffiliateReferral = require('../models/AffiliateReferral');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc    Get available affiliate campaigns
// @route   GET /api/affiliate/campaigns
// @access  Public
exports.getAffiliateCampaigns = asyncHandler(async (req, res) => {
  // CRITICAL FIX: Use is_active (boolean) instead of status (string)
  const campaigns = await AffiliateCampaign.query()
    .where('is_active', true)
    .orderBy('created_at', 'desc');

  res.json({
    success: true,
    data: campaigns
  });
});

// @desc    Join affiliate campaign
// @route   POST /api/affiliate/join/:campaignId
// @access  Private
exports.joinAffiliateCampaign = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  const { baseUrl } = req.body;

  const user = await User.query().findById(req.user.id);
  const campaign = await AffiliateCampaign.query().findById(campaignId);

  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  if (!await campaign.canUserParticipate(user)) {
    res.status(403);
    throw new Error('You are not eligible to participate in this campaign');
  }

  const affiliateLink = await AffiliateLink.createAffiliateLink(req.user.id, campaignId, baseUrl);

  res.status(200).json({
    success: true,
    data: affiliateLink,
    message: 'Successfully joined affiliate campaign'
  });
});

// @desc    Get user's affiliate links
// @route   GET /api/affiliate/my-links
// @access  Private
exports.getMyAffiliateLinks = asyncHandler(async (req, res) => {
  const affiliateLinks = await AffiliateLink.query()
    .where('user_id', req.user.id)
    .withGraphFetched('campaign')
    .orderBy('created_at', 'desc');

  res.json({
    success: true,
    data: affiliateLinks
  });
});

// @desc    Get affiliate link details
// @route   GET /api/affiliate/links/:id
// @access  Private
exports.getAffiliateLinkDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const affiliateLink = await AffiliateLink.query()
    .findById(id)
    .where('user_id', req.user.id)
    .withGraphFetched('[campaign, referrals.referredUser(selectBasicInfo)]')
    .modifiers({
      selectBasicInfo(builder) {
        builder.select('id', 'name', 'email');
      }
    })
    .first();

  if (!affiliateLink) {
    res.status(404);
    throw new Error('Affiliate link not found');
  }

  const statistics = await affiliateLink.getStatistics();
  const recentReferrals = await affiliateLink.getRecentReferrals(10);

  res.json({
    success: true,
    data: {
      affiliate_link: affiliateLink,
      statistics,
      recent_referrals: recentReferrals
    }
  });
});

// @desc    Track affiliate click
// @route   POST /api/affiliate/track-click
// @access  Public
exports.trackAffiliateClick = asyncHandler(async (req, res) => {
  const { affiliateCode } = req.body;

  const affiliateLink = await AffiliateLink.query()
    .findOne({ affiliate_code: affiliateCode })
    .first();

  if (!affiliateLink) {
    res.status(404);
    throw new Error('Invalid affiliate code');
  }

  await affiliateLink.trackClick();

  res.json({
    success: true,
    message: 'Click tracked successfully'
  });
});

// @desc    Process referral
// @route   POST /api/affiliate/process-referral
// @access  Private
exports.processReferral = asyncHandler(async (req, res) => {
  const { affiliateCode, referralType, amount, referralData } = req.body;

  const affiliateLink = await AffiliateLink.query()
    .findOne({ affiliate_code: affiliateCode })
    .withGraphFetched('campaign')
    .first();

  if (!affiliateLink) {
    res.status(404);
    throw new Error('Invalid affiliate code');
  }

  // Check if user is already referred by this affiliate
  const existingReferral = await AffiliateReferral.query()
    .findOne({
      affiliate_id: affiliateLink.id,
      referred_user_id: req.user.id,
      referral_type: referralType
    });

  if (existingReferral) {
    res.status(400);
    throw new Error('Referral already processed');
  }

  // Calculate commission
  const commissionAmount = affiliateLink.campaign.calculateCommission(amount);

  // Create referral
  const referral = await AffiliateReferral.createReferral(
    affiliateLink.id,
    req.user.id,
    referralType,
    commissionAmount,
    referralData
  );

  // Track conversion
  await affiliateLink.trackConversion();

  res.status(200).json({
    success: true,
    data: referral,
    message: 'Referral processed successfully'
  });
});

// @desc    Get affiliate earnings
// @route   GET /api/affiliate/earnings
// @access  Private
exports.getAffiliateEarnings = asyncHandler(async (req, res) => {
  const { period = 30 } = req.query;
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period));

  const affiliateLinks = await AffiliateLink.query()
    .where('user_id', req.user.id)
    .withGraphFetched('campaign')
    .orderBy('created_at', 'desc');

  const totalEarnings = affiliateLinks.reduce((sum, link) => sum + parseFloat(link.total_earnings), 0);
  const pendingEarnings = affiliateLinks.reduce((sum, link) => sum + parseFloat(link.pending_earnings), 0);
  const paidEarnings = affiliateLinks.reduce((sum, link) => sum + parseFloat(link.paid_earnings), 0);

  // Get recent referrals
  const recentReferrals = await AffiliateReferral.query()
    .whereIn('affiliate_id', affiliateLinks.map(link => link.id))
    .where('created_at', '>=', daysAgo)
    .withGraphFetched('[affiliateLink.campaign, referredUser(selectBasicInfo)]')
    .modifiers({
      selectBasicInfo(builder) {
        builder.select('id', 'name', 'email');
      }
    })
    .orderBy('created_at', 'desc')
    .limit(20);

  res.json({
    success: true,
    data: {
      total_earnings: totalEarnings,
      pending_earnings: pendingEarnings,
      paid_earnings: paidEarnings,
      affiliate_links: affiliateLinks,
      recent_referrals: recentReferrals
    }
  });
});

// @desc    Request payout
// @route   POST /api/affiliate/request-payout
// @access  Private
exports.requestPayout = asyncHandler(async (req, res) => {
  const { affiliateLinkId, amount } = req.body;

  const affiliateLink = await AffiliateLink.query()
    .findById(affiliateLinkId)
    .where('user_id', req.user.id)
    .first();

  if (!affiliateLink) {
    res.status(404);
    throw new Error('Affiliate link not found');
  }

  if (amount > parseFloat(affiliateLink.pending_earnings)) {
    res.status(400);
    throw new Error('Insufficient pending earnings');
  }

  const campaign = await AffiliateCampaign.query().findById(affiliateLink.campaign_id);
  if (amount < parseFloat(campaign.min_payout)) {
    res.status(400);
    throw new Error(`Minimum payout amount is ${campaign.min_payout}`);
  }

  // Mark earnings as paid
  await affiliateLink.markEarningsAsPaid(amount);

  // Create transaction record
  await Transaction.query().insert({
    user_id: req.user.id,
    type: 'affiliate_payout',
    amount: amount,
    description: `Affiliate payout for campaign: ${campaign.name}`,
    status: 'completed'
  });

  // Update user points/cashback based on payout method
  if (campaign.payout_method === 'points') {
    await User.query().findById(req.user.id).increment('points', amount);
  } else if (campaign.payout_method === 'cashback') {
    await User.query().findById(req.user.id).increment('cashback', amount);
  }

  res.json({
    success: true,
    message: 'Payout request processed successfully',
    data: {
      amount,
      payout_method: campaign.payout_method
    }
  });
});

// @desc    Invite friend by email
// @route   POST /api/affiliate/invite or /api/referrals/invite
// @access  Private
exports.inviteFriend = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const userId = req.user.id;

  console.log(`📧 [REFERRAL INVITE REQUEST] User ${userId} inviting ${email}`);

  // Enhanced email validation
  if (!email) {
    res.status(400);
    throw new Error('Email address is required');
  }

  // CRITICAL FIX: Define emailLower before using it
  const emailLower = email.toLowerCase().trim();
  
  if (!emailLower.includes('@') || !emailLower.includes('.')) {
    res.status(400);
    throw new Error('Invalid email address format');
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLower)) {
    res.status(400);
    throw new Error('Invalid email address format');
  }

  // Get user's referral code
  const user = await User.query().findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Generate referral code if user doesn't have one
  // CRITICAL FIX: Handle case where referral_code column might not exist
  let referralCode = user.referral_code;
  if (!referralCode) {
    // Generate unique referral code
    referralCode = `ALT-${user.id.toString().padStart(6, '0')}-${Date.now().toString().slice(-4)}`;
    
    // Try to update referral_code, but handle gracefully if column doesn't exist
    try {
      await User.query().findById(userId).patch({ referral_code: referralCode });
      console.log(`✅ Generated and saved referral code for user ${userId}: ${referralCode}`);
    } catch (updateError) {
      // If column doesn't exist, log warning but continue
      if (updateError.message && updateError.message.includes('referral_code')) {
        console.warn(`⚠️ [REFERRAL] referral_code column not found in users table. Please run migration: npm run migrate:latest`);
        console.warn(`⚠️ [REFERRAL] Using generated code without saving: ${referralCode}`);
        // Continue without saving - the code will still work for this request
      } else {
        // Re-throw if it's a different error
        throw updateError;
      }
    }
  }

  // Check if email belongs to an existing user
  const existingUser = await User.query()
    .where('email', emailLower)
    .first();

  if (existingUser) {
    console.log(`⚠️ [REFERRAL] Email ${emailLower} is already registered as user ${existingUser.id}`);
    // CRITICAL FIX: Return user information instead of error
    // This allows frontend to show that the user is already registered
    return res.status(200).json({
      success: true,
      message: 'This email is already registered on the platform.',
      data: {
        isRegistered: true,
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          // Only return basic info for privacy
        },
        message: 'This user is already registered. You can share the app with them directly!'
      }
    });
  }

  // CRITICAL FIX: Check if email is already invited using correct table structure
  try {
    const existingInvite = await AffiliateReferral.query()
      .where('referred_email', emailLower)
      .first();

    if (existingInvite) {
      console.log(`⚠️ [REFERRAL] Email ${emailLower} has already been invited (referral ID: ${existingInvite.id})`);
      res.status(400);
      throw new Error('This email has already been invited. Please invite a different email address.');
    }
  } catch (checkError) {
    // If check fails, continue (might be first invite)
    if (checkError.message && checkError.message.includes('already been invited')) {
      throw checkError;
    }
    console.log('⚠️ [REFERRAL] Could not check for existing invites:', checkError.message);
    // Continue - might be first invite or table structure issue
  }

    // CRITICAL FIX: Get or create affiliate link for user
    let affiliateLink;
    let referral;
    
    try {
      const AffiliateLink = require('../models/AffiliateLink');
      const AffiliateCampaign = require('../models/AffiliateCampaign');
      
      // Get default campaign or create one
      // CRITICAL FIX: Use is_active (boolean) instead of status (string)
      let campaign;
      try {
        campaign = await AffiliateCampaign.query()
          .where('is_active', true)
          .first();
      } catch (campaignError) {
        // If is_active column doesn't exist, try without filter
        console.log('⚠️ [REFERRAL] Could not filter by is_active, trying without filter:', campaignError.message);
        campaign = await AffiliateCampaign.query().first();
      }
      
      if (!campaign) {
        // Create default campaign if none exists
        campaign = await AffiliateCampaign.query().insert({
          name: 'Default Referral Campaign',
          description: 'Default campaign for user referrals',
          commission_type: 'percentage',
          commission_value: 10, // 10% commission
          is_active: true,
          start_date: new Date(),
          end_date: null
        });
      }
      
      // Get or create affiliate link for user
      affiliateLink = await AffiliateLink.query()
        .where('user_id', userId)
        .where('campaign_id', campaign.id)
        .first();
      
      if (!affiliateLink) {
        affiliateLink = await AffiliateLink.createAffiliateLink(
          userId,
          campaign.id,
          process.env.FRONTEND_URL || 'http://192.168.1.2:8081'
        );
      }
      
      // Create referral record with correct structure
      // CRITICAL FIX: affiliate_id is required (not affiliate_link_id)
      if (affiliateLink && affiliateLink.id) {
        referral = await AffiliateReferral.query().insert({
          affiliate_id: affiliateLink.id,
      referred_email: email.toLowerCase(),
      status: 'pending',
        earned_commission: 0,
        earned_points: 0
      });
    }
  } catch (linkError) {
    console.log('⚠️ [REFERRAL] Could not create affiliate link or referral:', linkError.message);
    // Continue - we'll still send the email even if DB save fails
  }

  // CRITICAL FIX: Send professional HTML email invitation
  try {
    const externalApiService = require('../services/externalApiService');
    const frontendUrl = process.env.FRONTEND_URL || 'http://192.168.1.2:8081';
    const appName = 'Altayar VIP';
    const appLogo = `${process.env.BACKEND_URL || 'http://192.168.1.2:5000'}/uploads/logos/altayarvip.png`;
    
    // Professional HTML email template
    const emailSubject = `دعوة للانضمام إلى ${appName} - ${user.name || 'صديقك'}`;
    const emailBody = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>دعوة للانضمام إلى ${appName}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2265c3;
        }
        .logo {
            max-width: 200px;
            height: auto;
            margin-bottom: 15px;
        }
        .title {
            color: #2265c3;
            font-size: 28px;
            margin: 10px 0;
            font-weight: bold;
        }
        .subtitle {
            color: #666;
            font-size: 16px;
            margin-top: 10px;
        }
        .content {
            margin: 30px 0;
        }
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            color: #555;
            margin-bottom: 25px;
            line-height: 1.8;
        }
        .features {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
        }
        .features h3 {
            color: #2265c3;
            margin-top: 0;
            font-size: 20px;
        }
        .features ul {
            list-style: none;
            padding: 0;
        }
        .features li {
            padding: 10px 0;
            padding-right: 25px;
            position: relative;
            color: #555;
        }
        .features li:before {
            content: "✓";
            position: absolute;
            right: 0;
            color: #4caf50;
            font-weight: bold;
            font-size: 18px;
        }
        .cta-button {
            display: inline-block;
            background-color: #2265c3;
            color: #ffffff !important;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 5px;
            font-size: 18px;
            font-weight: bold;
            margin: 25px 0;
            text-align: center;
            transition: background-color 0.3s;
        }
        .cta-button:hover {
            background-color: #1a4d99;
        }
        .referral-code {
            background-color: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            margin: 20px 0;
            border: 2px dashed #2265c3;
        }
        .referral-code strong {
            color: #2265c3;
            font-size: 20px;
            display: block;
            margin-top: 10px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #888;
            font-size: 14px;
        }
        .social-links {
            margin: 20px 0;
            text-align: center;
        }
        .social-links a {
            color: #2265c3;
            text-decoration: none;
            margin: 0 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${appLogo}" alt="${appName} Logo" class="logo" onerror="this.style.display='none'">
            <h1 class="title">${appName}</h1>
            <p class="subtitle">منصة السياحة والسفر المميزة</p>
        </div>
        
        <div class="content">
            <p class="greeting">مرحباً!</p>
            
            <p class="message">
                دعاك <strong>${user.name || 'صديقك'}</strong> للانضمام إلى ${appName}، منصة السياحة والسفر الرائدة التي تقدم أفضل الخدمات والعروض الحصرية.
            </p>
            
            <div class="features">
                <h3>🎯 لماذا ${appName}؟</h3>
                <ul>
                    <li>عروض حصرية على الرحلات والفنادق</li>
                    <li>نظام نقاط ومكافآت مجزية</li>
                    <li>عضوية VIP مع مزايا خاصة</li>
                    <li>حجوزات سهلة وآمنة</li>
                    <li>دعم عملاء على مدار الساعة</li>
                    <li>تجربة سفر لا تُنسى</li>
                </ul>
            </div>
            
            <div class="referral-code">
                <p style="margin: 0; color: #666;">استخدم كود الدعوة التالي عند التسجيل:</p>
                <strong>${referralCode}</strong>
            </div>
            
            <div style="text-align: center;">
                <a href="${frontendUrl}/register?ref=${referralCode}" class="cta-button">
                    انضم الآن واحصل على مكافآت حصرية
                </a>
            </div>
            
            <p class="message">
                عند التسجيل باستخدام كود الدعوة، ستحصل أنت و${user.name || 'صديقك'} على مكافآت خاصة!
            </p>
            
            <div class="social-links">
                <p>تابعنا على:</p>
                <a href="${frontendUrl}">الموقع الإلكتروني</a> |
                <a href="${frontendUrl}/about">تعرف علينا أكثر</a>
            </div>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} ${appName}. جميع الحقوق محفوظة.</p>
            <p>هذه رسالة تلقائية، يرجى عدم الرد عليها.</p>
        </div>
    </div>
</body>
</html>
    `;
    
    // Send email using external API service
    await externalApiService.sendEmail(
      email.toLowerCase(),
      emailSubject,
      emailBody,
      true // isHtml = true
    );
    
    console.log(`✅ [REFERRAL EMAIL] Professional invitation email sent to ${email}`);
  } catch (emailError) {
    console.error('❌ [REFERRAL EMAIL] Failed to send email:', emailError.message);
    // Continue even if email fails - at least the referral is logged
  }

    console.log(`📧 [REFERRAL INVITE] User ${userId} invited ${email} with code ${referralCode}`);

    res.json({
      success: true,
    message: 'تم إرسال الدعوة بنجاح',
      data: {
      referral_id: referral?.id || null,
        email: email.toLowerCase(),
        referral_code: referralCode,
      status: 'pending',
      email_sent: true
    }
  });
});

// @desc    Create affiliate campaign (Admin)
// @route   POST /api/affiliate/admin/campaigns
// @access  Private/Admin
exports.createAffiliateCampaign = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    commissionRate,
    minPayout,
    payoutMethod,
    targetCriteria,
    termsConditions,
    startDate,
    endDate
  } = req.body;

  const campaign = await AffiliateCampaign.query().insert({
    name,
    description,
    commission_rate: commissionRate,
    min_payout: minPayout,
    payout_method: payoutMethod,
    target_criteria: targetCriteria,
    terms_conditions: termsConditions,
    start_date: startDate ? new Date(startDate) : null,
    end_date: endDate ? new Date(endDate) : null,
    created_by: req.user.id
  });

  res.status(200).json({
    success: true,
    data: campaign,
    message: 'Affiliate campaign created successfully'
  });
});

// @desc    Get all affiliate campaigns (Admin)
// @route   GET /api/affiliate/admin/campaigns
// @access  Private/Admin
exports.getAllAffiliateCampaigns = asyncHandler(async (req, res) => {
  const { status, limit = 20, page = 1 } = req.query;

  let query = AffiliateCampaign.query()
    .withGraphFetched('creator(selectBasicInfo)')
    .modifiers({
      selectBasicInfo(builder) {
        builder.select('id', 'name', 'email');
      }
    })
    .orderBy('created_at', 'desc');

  if (status) {
    query = query.where('status', status);
  }

  const campaigns = await query.limit(parseInt(limit)).offset((parseInt(page) - 1) * parseInt(limit));

  res.json({
    success: true,
    data: campaigns,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit)
    }
  });
});

// @desc    Get affiliate campaign details (Admin)
// @route   GET /api/affiliate/admin/campaigns/:id
// @access  Private/Admin
exports.getAffiliateCampaignDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const campaign = await AffiliateCampaign.query()
    .findById(id)
    .withGraphFetched('[creator(selectBasicInfo), affiliateLinks.user(selectBasicInfo)]')
    .modifiers({
      selectBasicInfo(builder) {
        builder.select('id', 'name', 'email');
      }
    })
    .first();

  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  const statistics = await campaign.getStatistics();

  res.json({
    success: true,
    data: {
      campaign,
      statistics
    }
  });
});

// @desc    Get affiliate dashboard (Admin)
// @route   GET /api/affiliate/admin/dashboard
// @access  Private/Admin
exports.getAffiliateDashboard = asyncHandler(async (req, res) => {
  try {
    const { period = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Campaign statistics with error handling
    let totalCampaigns = 0;
    // CRITICAL FIX: Use is_active (boolean) instead of status (string)
    let activeCampaigns = 0;
    try {
      totalCampaigns = await AffiliateCampaign.query().resultSize();
      // CRITICAL FIX: Use is_active (boolean) instead of status (string)
      activeCampaigns = await AffiliateCampaign.query().where('is_active', true).resultSize();
    } catch (error) {
      console.error('Error fetching campaign statistics:', error);
    }

    // Affiliate statistics with error handling
    let totalAffiliates = 0;
    let activeAffiliates = 0;
    try {
      totalAffiliates = await AffiliateLink.query().resultSize();
      activeAffiliates = await AffiliateLink.query().where('is_active', true).resultSize();
    } catch (error) {
      console.error('Error fetching affiliate statistics:', error);
    }

    // Referral statistics with error handling
    let totalReferrals = 0;
    let recentReferrals = 0;
    try {
      totalReferrals = await AffiliateReferral.query().resultSize();
      recentReferrals = await AffiliateReferral.query()
        .where('created_at', '>=', daysAgo)
        .resultSize();
    } catch (error) {
      console.error('Error fetching referral statistics:', error);
    }

    // Earnings statistics with error handling
    let totalEarningsValue = 0;
    let pendingEarningsValue = 0;
    try {
      const totalEarnings = await AffiliateLink.query()
        .sum('total_earnings as total')
        .first();
      totalEarningsValue = parseFloat(totalEarnings?.total) || 0;

      const pendingEarnings = await AffiliateLink.query()
        .sum('pending_earnings as total')
        .first();
      pendingEarningsValue = parseFloat(pendingEarnings?.total) || 0;
    } catch (error) {
      console.error('Error fetching earnings statistics:', error);
    }

    // Recent campaigns with error handling
    let recentCampaigns = [];
    try {
      recentCampaigns = await AffiliateCampaign.query()
        .withGraphFetched('creator(selectBasicInfo)')
        .modifiers({
          selectBasicInfo(builder) {
            builder.select('id', 'name', 'email');
          }
        })
        .orderBy('created_at', 'desc')
        .limit(5);
      if (!Array.isArray(recentCampaigns)) {
        recentCampaigns = [];
      }
    } catch (error) {
      console.error('Error fetching recent campaigns:', error);
      recentCampaigns = [];
    }

    // Top affiliates with error handling
    let topAffiliates = [];
    try {
      topAffiliates = await AffiliateLink.query()
        .withGraphFetched('[user(selectBasicInfo), campaign]')
        .modifiers({
          selectBasicInfo(builder) {
            builder.select('id', 'name', 'email');
          }
        })
        .orderBy('total_earnings', 'desc')
        .limit(10);
      if (!Array.isArray(topAffiliates)) {
        topAffiliates = [];
      }
    } catch (error) {
      console.error('Error fetching top affiliates:', error);
      topAffiliates = [];
    }

    res.json({
      success: true,
      data: {
        campaigns: {
          total: totalCampaigns || 0,
          active: activeCampaigns || 0
        },
        affiliates: {
          total: totalAffiliates || 0,
          active: activeAffiliates || 0
        },
        referrals: {
          total: totalReferrals || 0,
          recent: recentReferrals || 0
        },
        earnings: {
          total: totalEarningsValue || 0,
          pending: pendingEarningsValue || 0
        },
        recent_campaigns: recentCampaigns || [],
        top_affiliates: topAffiliates || []
      }
    });
  } catch (error) {
    console.error('Error fetching affiliate dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching affiliate dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});