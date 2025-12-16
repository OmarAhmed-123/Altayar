/**
 * Gemini AI Chat Bot Controller
 * Integrates Google Gemini API for intelligent chat responses
 */

const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');
const SupportTicket = require('../models/SupportTicket');
const Notification = require('../models/Notification');
const { getBotUser } = require('../utils/botUserHelper');
const axios = require('axios');

// Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyC6j_T4LqLAqmDTAx2HByxyJRN_yFS6Gjk';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
const SUPPORT_ROLES = ['sales', 'reservations', 'accountant', 'admin', 'super_admin', 'agent'];

const findAvailableSupportStaff = async () => {
  return await User.query()
    .whereIn('role', SUPPORT_ROLES)
    .orderByRaw('RANDOM()')
    .select('id', 'name', 'email', 'role')
    .first();
};

const ensureSupportTicketForChat = async ({ chatId, userId, latestMessage }) => {
  const existingTicket = await SupportTicket.query()
    .where('chat_id', chatId)
    .whereNotIn('status', ['closed', 'resolved'])
    .first();

  if (existingTicket) {
    return { ticket: existingTicket, created: false };
  }

  const ticketNumber = `TKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const supportStaff = await findAvailableSupportStaff();

  const ticket = await SupportTicket.query().insert({
    user_id: userId,
    chat_id: chatId,
    ticket_number: ticketNumber,
    subject: 'تصعيد تلقائي من محادثة البوت',
    description: latestMessage
      ? `تم إنشاء التذكرة تلقائياً بعد محادثة مع البوت.\n\nآخر رسالة: ${latestMessage.substring(0, 250)}`
      : 'تم إنشاء التذكرة تلقائياً بعد محادثة مع البوت.',
    status: 'open',
    priority: 'medium',
    assigned_to: supportStaff?.id || null,
  });

  if (supportStaff) {
    try {
      await Notification.query().insert({
        user_id: supportStaff.id,
        sender_id: userId,
        title: 'طلب دعم جديد',
        message: `تم تصعيد محادثة إلى تذكرة ${ticket.ticket_number}`,
        type: 'support_ticket',
        reference_id: ticket.id,
        data: JSON.stringify({ chatId, ticketId: ticket.id }),
        is_read: false,
      });
    } catch (notifyError) {
      console.error('[Gemini] Support ticket notification error:', notifyError);
    }
  }

  return { ticket, created: true };
};

/**
 * Get AI response from Gemini
 */
const getGeminiResponse = async (userMessage, conversationHistory = []) => {
  try {
    // System prompt in Arabic - Professional and comprehensive
    const systemPrompt = `أنت مساعد ذكي احترافي لخدمة دعم الطيار VIP، منصة سياحية متخصصة في الحجوزات والجولات السياحية.

مهمتك الأساسية:
1. الإجابة على أسئلة العملاء بشكل دقيق ومهذب حول:
   - أنواع العضويات ومزاياها (Silver, Gold, Platinum, VIP, Diamond, Business)
   - نظام النقاط وكيفية الحصول عليها واستخدامها
   - الكاش باك وآلية عمله
   - الحجوزات (جولات سياحية، نايل كروز، طيران، فنادق، رحلات)
   - طرق الدفع والمعاملات المالية
   - المشاكل التقنية الأساسية
   - معلومات عامة عن الخدمات والمنتجات

2. إذا لم تستطع الإجابة بشكل كامل أو واثق:
   - اعترف بذلك بصراحة ومهنية
   - اقترح على العميل التواصل مع فريق الدعم البشري
   - قل: "عذراً، لا أستطيع الإجابة على هذا السؤال بشكل كامل. هل تريد إنشاء تذكرة دعم فني للحديث مع أحد موظفينا؟ سيكونون قادرين على مساعدتك بشكل أفضل."

3. قواعد السلوك:
   - كن دائماً مهذباً ومحترفاً وواضحاً في الإجابات
   - استخدم اللغة العربية فقط
   - أجب بشكل مختصر ومفيد وواقعي
   - لا تخترع معلومات غير موجودة
   - إذا كنت غير متأكد من شيء، اعترف بذلك واقترح التواصل مع الدعم
   - كن إيجابياً ومتعاوناً

4. أمثلة على الإجابات الجيدة:
   - "نعم، يمكنك استخدام النقاط في الدفع. كل نقطة تساوي..."
   - "نعم، لدينا 6 أنواع من العضويات. العضوية الذهبية تمنحك..."
   - "عذراً، أحتاج لمزيد من التفاصيل حول مشكلتك. هل يمكنك التواصل مع فريق الدعم؟"

تذكر: الهدف هو مساعدة العميل بشكل احترافي وواقعي. إذا لم تكن متأكداً، من الأفضل تحويله لفريق الدعم بدلاً من إعطاء معلومات خاطئة.`;

    // Build conversation context
    const conversationContext = conversationHistory
      .slice(-5) // Last 5 messages for context
      .map(msg => `${msg.role === 'user' ? 'المستخدم' : 'المساعد'}: ${msg.content}`)
      .join('\n');

    const fullPrompt = `${systemPrompt}\n\n${conversationContext ? `المحادثة السابقة:\n${conversationContext}\n\n` : ''}المستخدم: ${userMessage}\nالمساعد:`;

    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 seconds timeout
      }
    );

    if (response.data && response.data.candidates && response.data.candidates[0]) {
      const aiResponse = response.data.candidates[0].content.parts[0].text;
      return aiResponse.trim();
    }

    throw new Error('No response from Gemini API');
  } catch (error) {
    console.error('[Gemini] API Error:', error.response?.data || error.message);
    
    // Fallback to pattern matching if Gemini fails
    return getFallbackResponse(userMessage);
  }
};

/**
 * Fallback response using pattern matching
 */
const getFallbackResponse = (message) => {
  const lowerMessage = message.toLowerCase().trim();

  // Greetings
  if (lowerMessage.includes('مرحبا') || lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('السلام')) {
    return 'مرحباً بك في خدمة دعم الطيار VIP! 👋\n\nأنا مساعدك الذكي. يمكنني مساعدتك في:\n• العضويات والنقاط\n• الكاش باك\n• الحجوزات\n• الدفع\n\nإذا كان لديك سؤال آخر، يمكنك إنشاء تذكرة للحديث مع موظف.';
  }

  // Membership
  if (lowerMessage.includes('عضو') || lowerMessage.includes('membership') || lowerMessage.includes('عضوية')) {
    return 'نقدم 6 أنواع من العضويات:\n\n✨ Silver\n✨ Gold\n✨ Platinum\n✨ VIP\n✨ Diamond\n✨ Business (للشركات)\n\nكل عضوية لها مزايا خاصة ونقاط وكاش باك. هل تريد معرفة المزيد عن عضوية معينة؟';
  }

  // Points
  if (lowerMessage.includes('نقطة') || lowerMessage.includes('point') || lowerMessage.includes('نقاط')) {
    return 'النقاط تمنحك عند كل عملية شراء أو حجز. يمكنك استخدامها للدفع أو الحصول على خصومات.\n\nهل تريد معرفة رصيد نقاطك الحالي؟ يمكنك التحقق من ذلك في قسم "المحفظة" في التطبيق.';
  }

  // Cashback
  if (lowerMessage.includes('كاش') || lowerMessage.includes('cashback') || lowerMessage.includes('كاش باك')) {
    return 'الكاش باك يتم إضافته تلقائياً إلى محفظتك بعد كل عملية شراء. يمكنك استخدامه في أي وقت.\n\nهل تريد معرفة رصيد الكاش باك الحالي؟ يمكنك التحقق من ذلك في قسم "المحفظة".';
  }

  // Booking
  if (lowerMessage.includes('حجز') || lowerMessage.includes('booking') || lowerMessage.includes('reservation')) {
    return 'يمكنك الحجز من خلال التطبيق. نقدم حجوزات للجولات السياحية، النايل كروز، الفنادق، الطيران، والكثير.\n\nهل تريد المساعدة في حجز معين؟ يمكنك تصفح الباقات المتاحة في قسم "الباقات".';
  }

  // Payment
  if (lowerMessage.includes('دفع') || lowerMessage.includes('payment') || lowerMessage.includes('pay')) {
    return 'يمكنك الدفع عبر:\n• البطاقات الائتمانية\n• النقاط\n• الكاش باك\n\nجميع المعاملات آمنة ومشفرة. هل لديك سؤال محدد عن الدفع؟';
  }

  // Default - suggest ticket (professional and helpful)
  return 'عذراً، لا أستطيع الإجابة على هذا السؤال بشكل كامل. يفضل التواصل مع فريق خدمة العملاء والدعم الفني للحصول على مساعدة أفضل وأكثر دقة.\n\nهل تريد إنشاء تذكرة دعم فني للحديث مع أحد موظفينا؟ سيكونون قادرين على مساعدتك بشكل أفضل.';
};

/**
 * Check if bot can answer (for showing ticket button)
 */
const canBotAnswer = (message) => {
  const lowerMessage = message.toLowerCase().trim();
  
  const answerablePatterns = [
    'عضو', 'membership', 'عضوية',
    'نقطة', 'point', 'نقاط',
    'كاش', 'cashback', 'كاش باك',
    'حجز', 'booking', 'reservation',
    'دفع', 'payment', 'pay',
    'مرحبا', 'hello', 'hi', 'السلام',
    'مساعدة', 'help', 'support',
    'سعر', 'price', 'تكلفة',
    'خدمة', 'service',
  ];
  
  return answerablePatterns.some(pattern => lowerMessage.includes(pattern));
};

/**
 * Send bot message with Gemini AI
 */
const sendGeminiBotResponse = asyncHandler(async (req, res) => {
  const { chatId, message } = req.body;

  if (!chatId || !message) {
    return res.status(400).json({
      success: false,
      message: 'chatId and message are required'
    });
  }

  try {
    // Get bot user
    const botUser = await getBotUser();
    const BOT_USER_ID = botUser.id;

    // Get conversation history
    const chat = await Chat.query().findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const recentMessages = await Message.query()
      .where('chat_id', chatId)
      .orderBy('created_at', 'desc')
      .limit(10)
      .withGraphFetched('sender(selectUserInfo)')
      .modifiers({
        selectUserInfo(builder) {
          builder.select('id', 'name', 'email');
        }
      });

    // Build conversation history
    const conversationHistory = recentMessages
      .reverse()
      .map(msg => ({
        role: msg.sender_id === BOT_USER_ID ? 'assistant' : 'user',
        content: msg.content || ''
      }));

    // Get AI response
    let botResponse;
    let couldNotAnswer = false;
    let supportTicketInfo = null;

    try {
      botResponse = await getGeminiResponse(message, conversationHistory);
      
      // Check if bot couldn't answer
      if (botResponse.includes('لا أستطيع') || 
          botResponse.includes('لم أستطع') || 
          botResponse.includes('تذكرة') ||
          botResponse.includes('موظف')) {
        couldNotAnswer = true;
      }
    } catch (geminiError) {
      console.error('[Gemini] Error:', geminiError);
      botResponse = getFallbackResponse(message);
      if (!canBotAnswer(message)) {
        couldNotAnswer = true;
      }
    }

    if (couldNotAnswer && req.user?.id) {
      try {
        supportTicketInfo = await ensureSupportTicketForChat({
          chatId,
          userId: req.user.id,
          latestMessage: message,
        });
      } catch (ticketError) {
        console.error('[Gemini] Auto ticket creation error:', ticketError);
      }
    }

    // Create bot message
    const botMessage = await Message.query().insert({
      sender_id: BOT_USER_ID,
      chat_id: chatId,
      content: botResponse,
      read_by: JSON.stringify([BOT_USER_ID])
    });

    // Fetch bot message with relations
    const botMessageWithRelations = await Message.query()
      .findById(botMessage.id)
      .withGraphFetched('[sender(selectUserInfo), chat.participants(selectUserInfo)]')
      .modifiers({
        selectUserInfo(builder) {
          builder.select('id', 'name', 'email', 'profile_picture_url');
        }
      });

    await Chat.query().findById(chatId).patch({ latest_message_id: botMessage.id });

    let escalationMessageWithRelations = null;
    if (supportTicketInfo?.ticket) {
      try {
        const ticket = supportTicketInfo.ticket;
        const escalationContent = supportTicketInfo.created
          ? `لم أستطع حل سؤالك بالكامل، لذلك قمت بإنشاء رمز دعم خاص بك للتواصل مع موظفينا.\n\nرمز التذكرة: ${ticket.ticket_number}\nسيقوم موظف دعم بالتواصل معك قريباً.`
          : `لديك بالفعل تذكرة دعم مفتوحة رقم ${ticket.ticket_number}. سيستلم فريقنا طلبك قريباً.`;

        const escalationMessage = await Message.query().insert({
          sender_id: BOT_USER_ID,
          chat_id: chatId,
          content: escalationContent,
          read_by: JSON.stringify([BOT_USER_ID]),
        });

        escalationMessageWithRelations = await Message.query()
          .findById(escalationMessage.id)
          .withGraphFetched('[sender(selectUserInfo), chat.participants(selectUserInfo)]')
          .modifiers({
            selectUserInfo(builder) {
              builder.select('id', 'name', 'email', 'profile_picture_url');
            }
          });

        await Chat.query().findById(chatId).patch({ latest_message_id: escalationMessage.id });
      } catch (escalationError) {
        console.error('[Gemini] Escalation message error:', escalationError);
      }
    }

    // Emit via Socket.IO
    const io = global.io;
    if (io) {
      const chatWithParticipants = await Chat.query()
        .findById(chatId)
        .withGraphFetched('participants(selectUserInfo)')
        .modifiers({
          selectUserInfo(builder) {
            builder.select('id', 'name', 'email', 'profile_picture_url');
          }
        });

      chatWithParticipants.participants.forEach((participant) => {
        if (participant.id !== BOT_USER_ID) {
          io.to(`user_${participant.id}`).emit('message received', {
            ...botMessageWithRelations,
            chat_id: chatId,
            chat: chatWithParticipants,
            couldNotAnswer: couldNotAnswer
          });
          if (escalationMessageWithRelations) {
            io.to(`user_${participant.id}`).emit('message received', {
              ...escalationMessageWithRelations,
              chat_id: chatId,
              chat: chatWithParticipants,
              escalation: true,
              ticketNumber: supportTicketInfo?.ticket?.ticket_number
            });
          }
        }
      });
    }

    res.json({
      success: true,
      message: 'Bot response sent',
      data: botMessageWithRelations,
      couldNotAnswer: couldNotAnswer,
      supportTicket: supportTicketInfo?.ticket || null,
      supportEscalationCreated: supportTicketInfo?.created || false
    });
  } catch (error) {
    console.error('[Gemini Bot] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = {
  sendGeminiBotResponse,
  getGeminiResponse,
  canBotAnswer
};

