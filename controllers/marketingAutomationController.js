const asyncHandler = require('express-async-handler');
const MarketingCampaign = require('../models/MarketingCampaign');
const CampaignRecipient = require('../models/CampaignRecipient');
const AutomatedTrigger = require('../models/AutomatedTrigger');
const User = require('../models/User');

// @desc    Create marketing campaign
// @route   POST /api/marketing/campaigns
// @access  Private/Admin
exports.createCampaign = asyncHandler(async (req, res) => {
  const { name, description, type, targetCriteria, content, scheduledAt } = req.body;

  const campaign = await MarketingCampaign.query().insert({
    name,
    description,
    type,
    target_criteria: targetCriteria,
    content,
    scheduled_at: scheduledAt ? new Date(scheduledAt) : null,
    created_by: req.user.id
  });

  res.status(200).json({
    success: true,
    data: campaign,
    message: 'Campaign created successfully'
  });
});

// @desc    Get all campaigns
// @route   GET /api/marketing/campaigns
// @access  Private/Admin
exports.getCampaigns = asyncHandler(async (req, res) => {
  const { status, type, limit = 20, page = 1 } = req.query;

  let query = MarketingCampaign.query()
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

  if (type) {
    query = query.where('type', type);
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

// @desc    Get campaign details
// @route   GET /api/marketing/campaigns/:id
// @access  Private/Admin
exports.getCampaignDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const campaign = await MarketingCampaign.query()
    .findById(id)
    .withGraphFetched('[creator(selectBasicInfo), recipients.user(selectBasicInfo)]')
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

// @desc    Update campaign
// @route   PUT /api/marketing/campaigns/:id
// @access  Private/Admin
exports.updateCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const campaign = await MarketingCampaign.query().findById(id);
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  const updatedCampaign = await campaign.$query().patchAndFetch(updateData);

  res.json({
    success: true,
    data: updatedCampaign,
    message: 'Campaign updated successfully'
  });
});

// @desc    Schedule campaign
// @route   POST /api/marketing/campaigns/:id/schedule
// @access  Private/Admin
exports.scheduleCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { scheduledAt } = req.body;

  const campaign = await MarketingCampaign.query().findById(id);
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  const scheduledCampaign = await campaign.schedule(new Date(scheduledAt));

  res.json({
    success: true,
    data: scheduledCampaign,
    message: 'Campaign scheduled successfully'
  });
});

// @desc    Start campaign
// @route   POST /api/marketing/campaigns/:id/start
// @access  Private/Admin
exports.startCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const campaign = await MarketingCampaign.query().findById(id);
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  // Get target users
  const targetUsers = await MarketingCampaign.getTargetUsers(campaign.target_criteria);

  // Create recipient records
  const recipients = await CampaignRecipient.query().insert(
    targetUsers.map(user => ({
      campaign_id: campaign.id,
      user_id: user.id,
      status: 'pending'
    }))
  );

  // Start campaign
  const startedCampaign = await campaign.start();

  res.json({
    success: true,
    data: {
      campaign: startedCampaign,
      recipients_count: recipients.length
    },
    message: 'Campaign started successfully'
  });
});

// @desc    Pause campaign
// @route   POST /api/marketing/campaigns/:id/pause
// @access  Private/Admin
exports.pauseCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const campaign = await MarketingCampaign.query().findById(id);
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  const pausedCampaign = await campaign.pause();

  res.json({
    success: true,
    data: pausedCampaign,
    message: 'Campaign paused successfully'
  });
});

// @desc    Get campaign statistics
// @route   GET /api/marketing/campaigns/:id/statistics
// @access  Private/Admin
exports.getCampaignStatistics = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const campaign = await MarketingCampaign.query().findById(id);
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }

  const statistics = await campaign.getStatistics();

  res.json({
    success: true,
    data: statistics
  });
});

// @desc    Create automated trigger
// @route   POST /api/marketing/triggers
// @access  Private/Admin
exports.createAutomatedTrigger = asyncHandler(async (req, res) => {
  const { name, description, triggerType, triggerConditions, actionConfig } = req.body;

  const trigger = await AutomatedTrigger.query().insert({
    name,
    description,
    trigger_type: triggerType,
    trigger_conditions: triggerConditions,
    action_config: actionConfig,
    created_by: req.user.id
  });

  res.status(200).json({
    success: true,
    data: trigger,
    message: 'Automated trigger created successfully'
  });
});

// @desc    Get all automated triggers
// @route   GET /api/marketing/triggers
// @access  Private/Admin
exports.getAutomatedTriggers = asyncHandler(async (req, res) => {
  const { isActive, triggerType } = req.query;

  let query = AutomatedTrigger.query()
    .withGraphFetched('creator(selectBasicInfo)')
    .modifiers({
      selectBasicInfo(builder) {
        builder.select('id', 'name', 'email');
      }
    })
    .orderBy('created_at', 'desc');

  if (isActive !== undefined) {
    query = query.where('is_active', isActive === 'true');
  }

  if (triggerType) {
    query = query.where('trigger_type', triggerType);
  }

  const triggers = await query;

  res.json({
    success: true,
    data: triggers
  });
});

// @desc    Update automated trigger
// @route   PUT /api/marketing/triggers/:id
// @access  Private/Admin
exports.updateAutomatedTrigger = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const trigger = await AutomatedTrigger.query().findById(id);
  if (!trigger) {
    res.status(404);
    throw new Error('Trigger not found');
  }

  const updatedTrigger = await trigger.$query().patchAndFetch(updateData);

  res.json({
    success: true,
    data: updatedTrigger,
    message: 'Trigger updated successfully'
  });
});

// @desc    Toggle trigger status
// @route   POST /api/marketing/triggers/:id/toggle
// @access  Private/Admin
exports.toggleTriggerStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const trigger = await AutomatedTrigger.query().findById(id);
  if (!trigger) {
    res.status(404);
    throw new Error('Trigger not found');
  }

  const updatedTrigger = await trigger.$query().patch({
    is_active: !trigger.is_active
  });

  res.json({
    success: true,
    data: updatedTrigger,
    message: `Trigger ${updatedTrigger.is_active ? 'activated' : 'deactivated'} successfully`
  });
});

// @desc    Test trigger for user
// @route   POST /api/marketing/triggers/:id/test
// @access  Private/Admin
exports.testTrigger = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  const trigger = await AutomatedTrigger.query().findById(id);
  if (!trigger) {
    res.status(404);
    throw new Error('Trigger not found');
  }

  const user = await User.query().findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const conditionsMet = await trigger.checkConditions(user);
  const actionResult = conditionsMet ? await trigger.executeAction(user) : null;

  res.json({
    success: true,
    data: {
      conditions_met: conditionsMet,
      action_executed: !!actionResult,
      action_result: actionResult
    }
  });
});

// @desc    Get marketing dashboard data
// @route   GET /api/marketing/dashboard
// @access  Private/Admin
exports.getMarketingDashboard = asyncHandler(async (req, res) => {
  const { period = 30 } = req.query;
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period));

  // Campaign statistics
  const totalCampaigns = await MarketingCampaign.query().resultSize();
  const activeCampaigns = await MarketingCampaign.query().where('status', 'active').resultSize();
  const recentCampaigns = await MarketingCampaign.query()
    .where('created_at', '>=', daysAgo)
    .resultSize();

  // Trigger statistics
  const totalTriggers = await AutomatedTrigger.query().resultSize();
  const activeTriggers = await AutomatedTrigger.query().where('is_active', true).resultSize();

  // Recipient statistics
  const totalRecipients = await CampaignRecipient.query().resultSize();
  const recentRecipients = await CampaignRecipient.query()
    .where('created_at', '>=', daysAgo)
    .resultSize();

  // Recent campaigns
  const recentCampaignsList = await MarketingCampaign.query()
    .withGraphFetched('creator(selectBasicInfo)')
    .modifiers({
      selectBasicInfo(builder) {
        builder.select('id', 'name', 'email');
      }
    })
    .orderBy('created_at', 'desc')
    .limit(5);

  // Recent triggers
  const recentTriggers = await AutomatedTrigger.query()
    .withGraphFetched('creator(selectBasicInfo)')
    .modifiers({
      selectBasicInfo(builder) {
        builder.select('id', 'name', 'email');
      }
    })
    .orderBy('created_at', 'desc')
    .limit(5);

  res.json({
    success: true,
    data: {
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
        recent: recentCampaigns
      },
      triggers: {
        total: totalTriggers,
        active: activeTriggers
      },
      recipients: {
        total: totalRecipients,
        recent: recentRecipients
      },
      recent_campaigns: recentCampaignsList,
      recent_triggers: recentTriggers
    }
  });
});
