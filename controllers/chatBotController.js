/**
 * Chat Bot Controller
 * Handles automated responses for common inquiries
 */

const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const { getBotUser } = require('../utils/botUserHelper');

// Common questions and responses (Arabic)
const BOT_RESPONSES = {
  greetings: {
    patterns: ['مرحبا', 'السلام عليكم', 'اهلا', 'hello', 'hi', 'صباح الخير', 'مساء الخير'],
    responses: [
      'مرحباً بك في خدمة دعم الطيار VIP! كيف يمكنني مساعدتك اليوم؟',
      'أهلاً وسهلاً! أنا هنا لمساعدتك. ما الذي تحتاج إليه؟',
      'مرحباً! يسعدني مساعدتك. ما هي استفساراتك؟'
    ]
  },
  membership: {
    patterns: ['عضوية', 'membership', 'باقة', 'package', 'اشتراك', 'subscription'],
    responses: [
      'نوفر 6 باقات عضوية: Silver, Gold, Platinum, VIP, Diamond, Business. كل باقة لها مزايا حصرية ونقاط مختلفة. هل تريد معرفة المزيد عن باقة معينة؟',
      'يمكنك الاطلاع على جميع الباقات من خلال قسم العضويات في التطبيق. هل تحتاج مساعدة في اختيار الباقة المناسبة لك؟'
    ]
  },
  booking: {
    patterns: ['حجز', 'booking', 'رحلة', 'trip', 'جولة', 'tour'],
    responses: [
      'يمكنك حجز رحلاتك من خلال قسم الحجوزات. نوفر جولات سياحية، نايل كروز، تذاكر طيران، فنادق، وانتقالات. هل تريد المساعدة في حجز معين؟',
      'لحجز رحلة، اختر نوع الحجز من القائمة ثم اتبع الخطوات. هل تحتاج مساعدة في عملية الحجز؟'
    ]
  },
  points: {
    patterns: ['نقاط', 'points', 'رصيد', 'balance', 'كاش باك', 'cashback'],
    responses: [
      'يمكنك كسب النقاط من خلال الحجوزات والاشتراكات. النقاط قابلة للاستخدام في الحجوزات والترقيات. هل تريد معرفة رصيدك الحالي؟',
      'النقاط والكاش باك متاحة في قسم المحفظة. يمكنك استخدامها في أي وقت. هل تحتاج مساعدة في استخدام النقاط؟'
    ]
  },
  payment: {
    patterns: ['دفع', 'payment', 'فاتورة', 'invoice', 'سعر', 'price'],
    responses: [
      'نوفر طرق دفع آمنة ومتعددة. يمكنك الدفع عبر البطاقات الائتمانية أو المحفظة الإلكترونية. هل تحتاج مساعدة في عملية الدفع؟',
      'جميع المدفوعات آمنة ومشفرة. يمكنك متابعة فواتيرك من قسم المعاملات. هل لديك استفسار عن فاتورة معينة؟'
    ]
  },
  support: {
    patterns: ['مساعدة', 'help', 'دعم', 'support', 'مشكلة', 'problem', 'خطأ', 'error'],
    responses: [
      'أنا هنا لمساعدتك! يمكنك طرح أي سؤال وسأحاول مساعدتك. إذا احتجت دعم فني متقدم، يمكنني إنشاء تذكرة دعم فني لك.',
      'لا تتردد في طرح أي استفسار. إذا كانت المشكلة معقدة، يمكنني تحويلك إلى فريق الدعم الفني.'
    ]
  },
  default: {
    responses: [
      'شكراً لاستفسارك. هل يمكنك توضيح المزيد حتى أتمكن من مساعدتك بشكل أفضل؟',
      'أفهم استفسارك. هل تريد معرفة المزيد عن خدمة معينة؟',
      'يمكنني مساعدتك في: العضويات، الحجوزات، النقاط، الدفع، والدعم الفني. ما الذي تريد معرفته؟'
    ]
  }
};

/**
 * Check if bot can answer the question
 * Uses BOT_RESPONSES patterns for comprehensive matching
 */
const canBotAnswer = (message) => {
  const lowerMessage = message.toLowerCase().trim();
  
  // Check if message matches any known patterns from BOT_RESPONSES
  for (const [category, data] of Object.entries(BOT_RESPONSES)) {
    if (category === 'default') continue;
    const patterns = data.patterns || [];
    for (const pattern of patterns) {
      if (lowerMessage.includes(pattern.toLowerCase())) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Get bot response for a message
 */
const getBotResponse = (message) => {
  const lowerMessage = message.toLowerCase().trim();

  // Check each category for matching patterns
  for (const [category, data] of Object.entries(BOT_RESPONSES)) {
    if (category === 'default') continue;

    const patterns = data.patterns || [];
    const responses = data.responses || [];

    for (const pattern of patterns) {
      if (lowerMessage.includes(pattern.toLowerCase())) {
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
  }

  // Default response if no pattern matches
  const defaultResponses = BOT_RESPONSES.default.responses;
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};

/**
 * Check if message should trigger bot response
 * Bot responds to customer messages that are questions or contain keywords
 */
const shouldTriggerBot = (message, chatId) => {
  if (!message || typeof message !== 'string') {
    return false;
  }

  const lowerMessage = message.toLowerCase().trim();
  
  // Bot responds to messages that:
  // 1. Are questions (contain ? or استفسار or سؤال)
  // 2. Match common patterns
  // 3. Are not too long (likely not a complex issue)
  const isQuestion = lowerMessage.includes('?') || 
                    lowerMessage.includes('؟') ||
                    lowerMessage.includes('استفسار') ||
                    lowerMessage.includes('سؤال') ||
                    lowerMessage.includes('help') ||
                    lowerMessage.includes('مساعدة');
  
  const isShort = message.length < 200; // Increased from 100 to 200
  const matchesPattern = canBotAnswer(message);
  
  // Trigger if it's a question, matches patterns, or is short
  return (isQuestion || matchesPattern) && isShort;
};

/**
 * Send bot response (API endpoint)
 */
const sendBotResponse = asyncHandler(async (req, res) => {
  const { chatId, message } = req.body;

  if (!chatId || !message) {
    return res.status(400).json({
      success: false,
      message: 'Chat ID and message are required'
    });
  }

  // Check if bot should respond
  if (!shouldTriggerBot(message, chatId)) {
    return res.json({
      success: false,
      message: 'Bot should not respond to this message'
    });
  }

  // Get bot response
  const botResponse = getBotResponse(message);

  // Get chat to find bot user or create one
  const chat = await Chat.query().findById(chatId);
  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found'
    });
  }

  // Get or create bot user
  const botUser = await getBotUser();
  const BOT_USER_ID = botUser.id;

  // Create bot message
  const botMessage = await Message.query().insert({
    sender_id: BOT_USER_ID,
    chat_id: chatId,
    content: botResponse,
    read_by: JSON.stringify([BOT_USER_ID])
  });

  await Chat.query().findById(chatId).patch({ latest_message_id: botMessage.id });

  res.json({
    success: true,
    message: 'Bot response sent',
    data: botMessage
  });
});

module.exports = {
  sendBotResponse,
  getBotResponse,
  shouldTriggerBot,
  canBotAnswer
};

