// File: controllers/chatController.js
// Enhanced Live Chat System - Messenger-like experience

const asyncHandler = require('express-async-handler');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const SupportTicket = require('../models/SupportTicket');
const { shouldTriggerBot, getBotResponse } = require('./chatBotController');
const { getBotUser } = require('../utils/botUserHelper');
const { db } = require('../config/db');

const SUPPORT_ROLES = ['sales', 'reservations', 'accountant', 'admin', 'super_admin', 'agent'];

// Store active typing users per chat
const typingUsers = new Map();
const BOT_EMAIL = 'bot@altayar.com';
const BOT_INTRO_MESSAGE = [
    'مرحباً بك في دعم الطيار VIP! 😊',
    'يمكنني مساعدتك بسرعة في أي من المواضيع التالية، فقط أرسل رقم الخيار:',
    '1) تفاصيل وأسعار العضويات',
    '2) النقاط والكاش باك وكيفية استخدامها',
    '3) الحجوزات (رحلات، فنادق، طيران)',
    '4) طرق الدفع والفواتير',
    '5) القسائم والهدايا والعروض',
    '',
    'أو اكتب سؤالك بحرية وسأحاول مساعدتك فوراً ✨'
].join('\n');

/**
 * Utility helpers
 */
const selectUserInfoModifier = {
    selectUserInfo(builder) {
        builder.select('id', 'name', 'email', 'profile_picture_url', 'role');
    }
};

const toParticipantsArray = (participantIds = []) => {
    const placeholders = participantIds.map(() => '?').join(', ');
    return db.raw(`ARRAY[${placeholders}]::integer[]`, participantIds);
};

/**
 * Ensure bot intro message exists for a chat
 */
const ensureBotIntroMessage = async (chatId, botUserId) => {
    try {
        const hasMessages = await Message.query()
            .where('chat_id', chatId)
            .resultSize();

        if (hasMessages === 0) {
            const introMessage = await Message.query().insert({
                sender_id: botUserId,
                chat_id: chatId,
                content: BOT_INTRO_MESSAGE,
                read_by: JSON.stringify([botUserId])
            });

            await Chat.query().findById(chatId).patch({
                latest_message_id: introMessage.id,
                updated_at: new Date()
            });
        }
    } catch (error) {
        console.error('[Chat] ensureBotIntroMessage error:', error);
    }
};

/**
 * Find available support staff
 */
const findAvailableSupportStaff = async () => {
    const staff = await User.query()
        .whereIn('role', SUPPORT_ROLES)
        .orderByRaw('RANDOM()')
        .first()
        .select('id', 'name', 'role', 'profile_picture_url');
    return staff;
};

/**
 * Start (or ensure) a bot chat instantly
 * @route POST /api/chat/bot
 * @access Private
 */
exports.startBotChat = asyncHandler(async (req, res) => {
    const currentUserId = req.user.id;
    const botUser = await getBotUser();

    if (!botUser?.id) {
        res.status(404);
        throw new Error('Bot user is not available at the moment.');
    }

    const participantIds = [currentUserId, botUser.id];

    let botChat = await Chat.query()
        .where('is_group_chat', false)
        .whereRaw('? = ANY(participants)', [currentUserId])
        .whereRaw('? = ANY(participants)', [botUser.id])
        .withGraphFetched('[participants(selectUserInfo), latestMessage.sender(selectUserInfo)]')
        .modifiers(selectUserInfoModifier)
        .first();

    if (!botChat) {
        const createdChat = await Chat.query().insert({
            chat_name: botUser.name || 'دعم الطيار VIP',
            is_group_chat: false,
            participants: toParticipantsArray(participantIds),
        });

        for (const participantId of participantIds) {
            await db('chat_participants')
                .insert({
                    chat_id: createdChat.id,
                    user_id: participantId,
                })
                .onConflict(['chat_id', 'user_id'])
                .ignore();
        }

        await ensureBotIntroMessage(createdChat.id, botUser.id);

        botChat = await Chat.query()
            .findById(createdChat.id)
            .withGraphFetched('[participants(selectUserInfo), latestMessage.sender(selectUserInfo)]')
            .modifiers(selectUserInfoModifier);
    } else if (!botChat.latestMessage) {
        await ensureBotIntroMessage(botChat.id, botUser.id);
        botChat = await Chat.query()
            .findById(botChat.id)
            .withGraphFetched('[participants(selectUserInfo), latestMessage.sender(selectUserInfo)]')
            .modifiers(selectUserInfoModifier);
    } else {
        await Chat.query().findById(botChat.id).patch({ updated_at: new Date() });
    }

    const unreadCount = await Message.query()
        .where('chat_id', botChat.id)
        .where('sender_id', '!=', currentUserId)
        .whereRaw(`NOT (read_by::jsonb @> '["${currentUserId}"]'::jsonb)`)
        .resultSize();

    res.json({
        ...botChat,
        unread_count: unreadCount || 0,
        bot_user: {
            id: botUser.id,
            name: botUser.name || 'دعم الطيار VIP',
            email: botUser.email || BOT_EMAIL,
            profile_picture_url: botUser.profile_picture_url || null,
        },
    });
});

/**
 * Get bot user info (ensures bot exists)
 * @route GET /api/chat/bot/info
 * @access Private
 */
exports.getBotInfo = asyncHandler(async (req, res) => {
    const botUser = await getBotUser();

    if (!botUser?.id) {
        res.status(503);
        throw new Error('Bot user is not available at the moment.');
    }

    res.json({
        id: botUser.id,
        name: botUser.name || 'دعم الطيار VIP',
        email: botUser.email || BOT_EMAIL,
        role: botUser.role || 'bot',
        profile_picture_url: botUser.profile_picture_url || null,
        last_seen: botUser.last_seen || null,
    });
});

/**
 * Access or create a support chat
 * @route POST /api/chat
 * @access Private
 */
exports.accessChat = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const currentUserId = req.user.id;

    let targetUser = null;
    let chatUsers = [currentUserId];

    if (!userId) {
        // Customer wants to chat with support
        targetUser = await findAvailableSupportStaff();
        if (!targetUser) {
            res.status(404);
            throw new Error('No support staff available at the moment.');
        }
        chatUsers.push(targetUser.id);
    } else {
        // Chat with specific user
        targetUser = await User.query()
            .findById(userId)
            .select('id', 'name', 'email', 'profile_picture_url', 'role');
        if (!targetUser) {
            res.status(404);
            throw new Error('User not found.');
        }
        chatUsers.push(userId);
    }

    // Check if chat already exists between these two users
    let isChat = await Chat.query()
        .where('is_group_chat', false)
        .whereRaw('array_length(participants, 1) = 2')
        .whereRaw('? = ANY(participants)', [currentUserId])
        .whereRaw('? = ANY(participants)', [chatUsers[1]])
        .withGraphFetched('[participants(selectUserInfo), latestMessage.sender(selectUserInfo)]')
        .modifiers({
            selectUserInfo(builder) {
                builder.select('id', 'name', 'email', 'profile_picture_url', 'role');
            }
        })
        .first();

    if (isChat) {
        // Update chat timestamp
        await Chat.query().findById(isChat.id).patch({ updated_at: new Date() });
        
        // Ensure bot intro exists for bot chats without messages
        if (targetUser?.email?.toLowerCase() === BOT_EMAIL && !isChat.latestMessage) {
            try {
                const introMessage = await Message.query().insert({
                    sender_id: targetUser.id,
                    chat_id: isChat.id,
                    content: BOT_INTRO_MESSAGE,
                    read_by: JSON.stringify([targetUser.id])
                });
                await Chat.query().findById(isChat.id).patch({ latest_message_id: introMessage.id });
            } catch (introError) {
                console.error('[Chat] Bot intro resend error:', introError);
            }
        }
        
        // Get unread count
        const unreadCount = await Message.query()
            .where('chat_id', isChat.id)
            .where('sender_id', '!=', currentUserId)
            .whereRaw(`NOT (read_by::jsonb @> '["${currentUserId}"]'::jsonb)`)
            .resultSize();

        res.json({
            ...isChat,
            unread_count: unreadCount || 0
        });
    } else {
        // Create new chat
        const chatData = {
            chat_name: targetUser.name,
            is_group_chat: false,
            participants: toParticipantsArray(chatUsers),
        };

        try {
            const createdChat = await Chat.query().insert(chatData);
            
            // Insert participants into chat_participants table
            for (const participantId of chatUsers) {
                await db('chat_participants').insert({
                    chat_id: createdChat.id,
                    user_id: participantId
                }).onConflict(['chat_id', 'user_id']).ignore();
            }

            const fullChat = await Chat.query()
                .findById(createdChat.id)
                .withGraphFetched('participants(selectUserInfo)')
                .modifiers({
                    selectUserInfo(builder) {
                        builder.select('id', 'name', 'email', 'profile_picture_url', 'role');
                    }
                });

            if (targetUser.email && targetUser.email.toLowerCase() === BOT_EMAIL) {
                try {
                    const introMessage = await Message.query().insert({
                        sender_id: targetUser.id,
                        chat_id: createdChat.id,
                        content: BOT_INTRO_MESSAGE,
                        read_by: JSON.stringify([targetUser.id])
                    });
                    await Chat.query().findById(createdChat.id).patch({ latest_message_id: introMessage.id });
                } catch (botIntroError) {
                    console.error('[Chat] Bot intro message error:', botIntroError);
                }
            } else if (!userId && req.user.role === 'customer') {
                try {
                    const welcomeMessage = await Message.query().insert({
                        sender_id: targetUser.id,
                        chat_id: createdChat.id,
                        content: 'مرحباً! كيف يمكنني مساعدتك اليوم؟',
                        read_by: JSON.stringify([targetUser.id])
                    });
                    await Chat.query().findById(createdChat.id).patch({ latest_message_id: welcomeMessage.id });
                } catch (welcomeError) {
                    console.error('[Chat] Welcome message error:', welcomeError);
                }
            }

            res.status(200).json({
                ...fullChat,
                unread_count: 0
            });
        } catch (error) {
            console.error('[Chat] Create chat error:', error);
            res.status(400);
            throw new Error(error.message);
        }
    }
});

/**
 * Fetch all chats for a user
 * @route GET /api/chat
 * @access Private
 */
exports.fetchChats = asyncHandler(async (req, res) => {
    try {
        const currentUserId = req.user.id;
        
        // Get all chats where user is a participant
        const results = await Chat.query()
            .whereRaw('? = ANY(participants)', [currentUserId])
            .withGraphFetched('[participants(selectUserInfo), latestMessage.sender(selectUserInfo)]')
            .modifiers({
                selectUserInfo(builder) {
                    builder.select('id', 'name', 'email', 'profile_picture_url', 'role');
                }
            })
            .orderBy('updated_at', 'desc');

        // Calculate unread count and get other participant info for each chat
        const chatsWithUnread = await Promise.all(results.map(async (chat) => {
            // Get unread messages count
            const unreadCount = await Message.query()
                .where('chat_id', chat.id)
                .where('sender_id', '!=', currentUserId)
                .whereRaw(`NOT (read_by::jsonb @> '["${currentUserId}"]'::jsonb)`)
                .resultSize();

            // Get other participant (not current user)
            const otherParticipant = chat.participants?.find(p => p.id !== currentUserId);
            
            // CRITICAL FIX: Use other participant's name as chat name instead of "محادثة"
            const chatName = otherParticipant?.name || chat.chat_name || 'محادثة';
            
            return {
                ...chat,
                chat_name: chatName, // Override chat_name with participant's name
                unread_count: unreadCount || 0,
                other_participant: otherParticipant || null
            };
        }));

        res.status(200).json(chatsWithUnread);
    } catch (error) {
        console.error('[Chat] Fetch chats error:', error);
        res.status(400);
        throw new Error(error.message);
    }
});

/**
 * Get all users for chat (with online status)
 * @route GET /api/chat/users
 * @access Private
 */
exports.getAllUsersForChat = asyncHandler(async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const currentUser = await User.query().findById(currentUserId);
        
        // Staff roles that can chat with customers
        const STAFF_ROLES = ['super_admin', 'admin', 'sales', 'reservations', 'accountant', 'agent', 'hr', 'data_entry'];
        
        let users;
        
        // If current user is a customer, show only staff members (not other customers)
        if (currentUser.role === 'customer') {
            users = await User.query()
                .whereIn('role', STAFF_ROLES)
            .whereNot('id', currentUserId)
            .select('id', 'name', 'email', 'role', 'profile_picture_url', 'last_seen')
            .orderBy('name', 'asc');
        } else {
            // If current user is staff, show all staff + customers
            users = await User.query()
                .whereNot('id', currentUserId)
                .where(function() {
                    this.whereIn('role', STAFF_ROLES).orWhere('role', 'customer');
                })
                .select('id', 'name', 'email', 'role', 'profile_picture_url', 'last_seen')
                .orderByRaw('CASE WHEN role IN (?) THEN 0 ELSE 1 END', [STAFF_ROLES])
                .orderBy('name', 'asc');
        }
        
        // Ensure bot user is always available for customers
        try {
            const botUser = await getBotUser();
            if (botUser && !users.some(user => user.id === botUser.id)) {
                users.push({
                    id: botUser.id,
                    name: botUser.name || 'دعم الطيار VIP',
                    email: botUser.email || 'bot@altayar.com',
                    role: botUser.role || 'bot',
                    profile_picture_url: botUser.profile_picture_url || null,
                    last_seen: botUser.last_seen || new Date(),
                });
            }
        } catch (botError) {
            console.error('[Chat] Failed to ensure bot user exists:', botError);
        }
        
        // Calculate online status (within last 5 minutes)
        const usersWithStatus = users.map(user => {
            let isOnline = false;
            if (user.last_seen) {
                const lastSeenDate = new Date(user.last_seen);
                const now = new Date();
                const diffMs = now.getTime() - lastSeenDate.getTime();
                isOnline = diffMs < 5 * 60 * 1000; // 5 minutes
            }
            
            return {
                ...user,
                isOnline,
                chatCode: `USER_${user.id}`
            };
        });
        
        res.status(200).json(usersWithStatus);
    } catch (error) {
        console.error('[Chat] Get users error:', error);
        res.status(400);
        throw new Error(error.message);
    }
});

/**
 * Send a new message (with optional file attachment)
 * @route POST /api/chat/message
 * @access Private
 */
exports.sendMessage = asyncHandler(async (req, res) => {
    const { content, chatId } = req.body;

    if ((!content || content.trim() === '') && !req.file) {
        return res.status(400).json({
            success: false,
            message: 'Message must have content or a file attachment'
        });
    }

    if (!chatId) {
        return res.status(400).json({
            success: false,
            message: 'Chat ID is required'
        });
    }

    // Verify user is participant in chat
    const chat = await Chat.query()
        .findById(chatId)
        .withGraphFetched('participants');
    
    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }

    const isParticipant = chat.participants?.some(p => p.id === req.user.id);
    if (!isParticipant) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to send message in this chat'
        });
    }

    // Handle file upload if present
    let fileUrl = null;
    let fileName = null;
    let fileType = null;
    let fileSize = null;
    
    if (req.file) {
        const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'http';
        let host = req.get('host');
        
        // Handle localhost/127.0.0.1 for development
        if (!host || host.includes('localhost') || host.includes('127.0.0.1')) {
            const os = require('os');
            const networkInterfaces = os.networkInterfaces();
            let serverIP = '192.168.1.2';
            
            Object.keys(networkInterfaces).forEach((interfaceName) => {
                networkInterfaces[interfaceName].forEach((iface) => {
                    if (iface.family === 'IPv4' && !iface.internal) {
                        if (iface.address.startsWith('192.168.')) {
                            serverIP = iface.address;
                        } else if (serverIP === '192.168.1.2' && !iface.address.startsWith('127.')) {
                            serverIP = iface.address;
                        }
                    }
                });
            });
            
            host = `${serverIP}:${process.env.PORT || 5000}`;
        }
        
        const relativePath = req.file.path.replace(/\\/g, '/').split('uploads/')[1];
        fileUrl = `${protocol}://${host}/uploads/${relativePath}`;
        fileName = req.file.originalname;
        fileType = req.file.mimetype;
        fileSize = req.file.size;
    }

    const newMessage = {
        sender_id: req.user.id,
        content: content || (req.file ? `تم إرسال ملف: ${fileName}` : ''),
        chat_id: chatId,
        read_by: JSON.stringify([req.user.id]), // Sender has read their own message
        ...(fileUrl && { 
            attachment_url: fileUrl,
            attachment_name: fileName,
            attachment_type: fileType,
            attachment_size: fileSize
        })
    };

    try {
        let message = await Message.query().insert(newMessage);

        message = await Message.query()
            .findById(message.id)
            .withGraphFetched('[sender(selectUserInfo), chat.participants(selectUserInfo)]')
            .modifiers({
                selectUserInfo(builder) {
                    builder.select('id', 'name', 'email', 'profile_picture_url', 'role');
                }
            });

        // Update chat latest message and timestamp
        await Chat.query().findById(chatId).patch({ 
            latest_message_id: message.id,
            updated_at: new Date()
        });

        // CRITICAL FIX: Auto-trigger bot response if chat is with bot
        const botUser = await getBotUser();
        const isBotChat = chat.participants?.some(p => p.id === botUser?.id && p.id !== req.user.id);
        
        if (isBotChat && content && content.trim().length > 0) {
            // Trigger bot response asynchronously (don't wait for it)
            setImmediate(async () => {
                try {
                    const { shouldTriggerBot, getBotResponse } = require('./chatBotController');
                    if (shouldTriggerBot(content, chatId)) {
                        const botResponse = getBotResponse(content);
                        const botMessage = await Message.query().insert({
                            sender_id: botUser.id,
                            chat_id: chatId,
                            content: botResponse,
                            read_by: JSON.stringify([botUser.id])
                        });
                        await Chat.query().findById(chatId).patch({ 
                            latest_message_id: botMessage.id,
                            updated_at: new Date()
                        });
                        
                        // Emit bot message via Socket.IO
                        const io = global.io;
                        if (io) {
                            chat.participants.forEach((participant) => {
                                if (participant.id !== botUser.id) {
                                    io.to(`user_${participant.id}`).emit('message received', {
                                        ...botMessage,
                                        chat_id: chatId,
                                        chat: chat
                                    });
                                }
                            });
                        }
                    }
                } catch (botError) {
                    console.error('[Chat] Auto bot response error:', botError);
                }
            });
        }

        // Auto-create support ticket if customer mentions keywords
        if (req.user.role === 'customer' && content) {
            const ticketKeywords = ['مشكلة', 'خطأ', 'عطل', 'لا يعمل', 'مساعدة', 'دعم', 'ticket', 'support', 'help', 'issue', 'problem'];
            const hasTicketKeyword = ticketKeywords.some(keyword => 
                content.toLowerCase().includes(keyword.toLowerCase())
            );

            if (hasTicketKeyword) {
                try {
                    // Check if ticket already exists for this chat
                    const existingTicket = await SupportTicket.query()
                        .where('chat_id', chatId)
                        .where('status', '!=', 'closed')
                        .first();

                    if (!existingTicket) {
                        const ticketNumber = `TKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                        const supportStaff = await findAvailableSupportStaff();

                        await SupportTicket.query().insert({
                            user_id: req.user.id,
                    chat_id: chatId,
                            ticket_number: ticketNumber,
                            subject: 'طلب دعم فني من المحادثة',
                            description: `تم إنشاء تذكرة تلقائياً من المحادثة. الرسالة: ${content.substring(0, 200)}`,
                            status: 'open',
                            priority: 'medium',
                            assigned_to: supportStaff?.id || null
                        });

                        // Notify user about ticket creation
                        const ticketMessage = await Message.query().insert({
                            sender_id: supportStaff?.id || (await getBotUser()).id,
                            chat_id: chatId,
                            content: `تم إنشاء تذكرة دعم فني تلقائياً برقم: ${ticketNumber}. سيقوم فريق الدعم بالرد عليك قريباً.`,
                            read_by: JSON.stringify([supportStaff?.id || (await getBotUser()).id])
                        });

                        await Chat.query().findById(chatId).patch({ 
                            latest_message_id: ticketMessage.id,
                            updated_at: new Date()
                        });
                    }
                } catch (ticketError) {
                    console.error('[Chat] Auto ticket creation error:', ticketError);
                }
            }
        }

        // Emit via Socket.IO for real-time updates
        const io = global.io;
        if (io) {
            // Broadcast to all participants except sender
            chat.participants.forEach(async (participant) => {
                if (participant.id !== req.user.id) {
                    // Emit message via Socket.IO
                    io.to(`user_${participant.id}`).emit('message received', {
                        ...message,
                        chat_id: chatId,
                        chat: chat
                    });

                    // Create notification for new message
                    try {
                        await Notification.query().insert({
                            user_id: participant.id,
                            sender_id: req.user.id,
                            type: 'chat_message',
                            title: 'رسالة جديدة',
                            message: `${req.user.name}: ${content?.substring(0, 50) || 'رسالة جديدة'}`,
                            data: JSON.stringify({
                                chatId: chatId,
                                messageId: message.id,
                                senderId: req.user.id,
                                senderName: req.user.name
                            }),
                            is_read: false
                        });

                        // Emit notification via Socket.IO
                        io.to(`user_${participant.id}`).emit('notification', {
                            type: 'chat_message',
                            title: 'رسالة جديدة',
                            message: `${req.user.name}: ${content?.substring(0, 50) || 'رسالة جديدة'}`,
                            chatId: chatId,
                            messageId: message.id
                        });
                    } catch (notifError) {
                        console.error('[Chat] Notification error:', notifError);
                    }
                }
            });
        }

        res.json({
            success: true,
            data: message
        });
    } catch (error) {
        console.error('[Chat] Send message error:', error);
        res.status(400);
        throw new Error(error.message);
    }
});

/**
 * Fetch all messages for a specific chat
 * @route GET /api/chat/:chatId/messages
 * @access Private
 */
exports.allMessages = asyncHandler(async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const chatId = req.params.chatId;
        const { page = 1, limit = 50 } = req.query;
        
        // Verify user is participant
        const chat = await Chat.query()
            .findById(chatId)
            .withGraphFetched('participants');
        
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        const isParticipant = chat.participants?.some(p => p.id === currentUserId);
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view messages in this chat'
            });
        }
        
        // Get messages with pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const messages = await Message.query()
            .where('chat_id', chatId)
            .withGraphFetched('[sender(selectUserInfo), chat]')
            .modifiers({
                selectUserInfo(builder) {
                    builder.select('id', 'name', 'email', 'profile_picture_url', 'role');
                }
            })
            .orderBy('created_at', 'desc')
            .limit(parseInt(limit))
            .offset(offset);

        // Reverse to show oldest first
        const reversedMessages = messages.reverse();
        
        // Mark messages as read for current user (except their own messages)
        const unreadMessages = reversedMessages.filter(msg => {
            let readBy = msg.read_by;
            if (typeof readBy === 'string') {
                try {
                    readBy = JSON.parse(readBy);
                } catch {
                    readBy = [];
                }
            }
            return msg.sender_id !== currentUserId && (!Array.isArray(readBy) || !readBy.includes(currentUserId));
        });
        
        if (unreadMessages.length > 0) {
            for (const msg of unreadMessages) {
                let readBy = msg.read_by;
                if (typeof readBy === 'string') {
                    try {
                        readBy = JSON.parse(readBy);
                    } catch {
                        readBy = [];
                    }
                }
                if (!Array.isArray(readBy)) {
                    readBy = [];
                }
                if (!readBy.includes(currentUserId)) {
                    readBy.push(currentUserId);
                    await Message.query()
                        .findById(msg.id)
                        .patch({ read_by: JSON.stringify(readBy) });
                }
            }

            // Emit read receipt via Socket.IO
            const io = global.io;
            if (io) {
                chat.participants.forEach((participant) => {
                    if (participant.id !== currentUserId) {
                        io.to(`user_${participant.id}`).emit('messages read', {
                            chatId: chatId,
                            userId: currentUserId,
                            messageIds: unreadMessages.map(m => m.id)
                        });
                    }
                });
            }
        }
        
        // Add isRead flag for each message
        const messagesWithReadStatus = reversedMessages.map(msg => {
            let readBy = msg.read_by;
            if (typeof readBy === 'string') {
                try {
                    readBy = JSON.parse(readBy);
                } catch {
                    readBy = [];
                }
            }
            if (!Array.isArray(readBy)) {
                readBy = [];
            }
            return {
                ...msg,
                read_by: readBy,
                isRead: readBy.includes(currentUserId) || msg.sender_id === currentUserId,
                isOwn: msg.sender_id === currentUserId
            };
        });
        
        res.json({
            success: true,
            data: messagesWithReadStatus,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: await Message.query().where('chat_id', chatId).resultSize()
            }
        });
    } catch (error) {
        console.error('[Chat] Get messages error:', error);
        res.status(400);
        throw new Error(error.message);
    }
});

/**
 * Mark messages as read
 * @route POST /api/chat/message/:chatId/read
 * @access Private
 */
exports.markMessagesAsRead = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const currentUserId = req.user.id;

    try {
        // Verify user is participant
        const chat = await Chat.query()
            .findById(chatId)
            .withGraphFetched('participants');
        
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        const isParticipant = chat.participants?.some(p => p.id === currentUserId);
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Get all unread messages in this chat
        const unreadMessages = await Message.query()
            .where('chat_id', chatId)
            .where('sender_id', '!=', currentUserId);

        const messageIds = [];
        // Update read_by array for each unread message
        for (const msg of unreadMessages) {
            let readBy = msg.read_by;
            if (typeof readBy === 'string') {
                try {
                    readBy = JSON.parse(readBy);
                } catch {
                    readBy = [];
                }
            }
            if (!Array.isArray(readBy)) {
                readBy = [];
            }
            if (!readBy.includes(currentUserId)) {
                readBy.push(currentUserId);
                await Message.query()
                    .findById(msg.id)
                    .patch({ read_by: JSON.stringify(readBy) });
                messageIds.push(msg.id);
            }
        }

        // Emit read receipt via Socket.IO
        const io = global.io;
        if (io && messageIds.length > 0) {
            chat.participants.forEach((participant) => {
                if (participant.id !== currentUserId) {
                    io.to(`user_${participant.id}`).emit('messages read', {
                        chatId: chatId,
                        userId: currentUserId,
                        messageIds: messageIds
                    });
                }
            });
        }

        res.json({
            success: true,
            message: 'Messages marked as read',
            count: messageIds.length
        });
    } catch (error) {
        console.error('[Chat] Mark as read error:', error);
        res.status(400);
        throw new Error(error.message);
    }
});

/**
 * Delete a message
 * @route DELETE /api/chat/message/:messageId
 * @access Private
 */
exports.deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    try {
        const message = await Message.query()
            .findById(messageId)
            .withGraphFetched('chat.participants');

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Only sender can delete their message
        if (message.sender_id !== currentUserId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this message'
            });
        }

        // Soft delete - update content
        await Message.query()
            .findById(messageId)
            .patch({
                content: 'تم حذف هذه الرسالة',
                is_deleted: true
            });

        // Emit deletion via Socket.IO
        const io = global.io;
        if (io && message.chat && message.chat.participants) {
            message.chat.participants.forEach((participant) => {
                io.to(`user_${participant.id}`).emit('message deleted', {
                    messageId: messageId,
                    chatId: message.chat_id
                });
            });
        }

        res.json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        console.error('[Chat] Delete message error:', error);
        res.status(400);
        throw new Error(error.message);
    }
});

/**
 * Handle Socket.IO connection logic
 * @note This is not an API route, but a function to be used in server.js
 */
exports.handleSocketConnection = (socket, io) => {
    const userId = socket.userId;
    console.log(`[Socket.IO] User connected: ${socket.id} (User ID: ${userId})`);

    // Setup a user-specific room upon connection
    socket.on('setup', async (userData) => {
        try {
            const targetUserId = userId || userData?.id;
            
            if (targetUserId) {
                socket.join(`user_${targetUserId}`);
                socket.emit('connected');
                
                // Update user last_seen
                try {
                    await User.query()
                        .findById(targetUserId)
                        .patch({ last_seen: new Date() });
                } catch (error) {
                    console.error('[Socket.IO] Update last_seen error:', error);
                }
                
                // Broadcast user online status
                socket.broadcast.emit('user online', { userId: targetUserId });
                
                console.log(`[Socket.IO] User ${targetUserId} joined personal room: user_${targetUserId}`);
            }
        } catch (error) {
            console.error('[Socket.IO] Setup error:', error);
        }
    });

    // Handle joining a specific chat room
    socket.on('join chat', (room) => {
        socket.join(`chat_${room}`);
        console.log(`[Socket.IO] User ${userId} joined chat room: chat_${room}`);
    });

    // Handle leaving a chat room
    socket.on('leave chat', (room) => {
        socket.leave(`chat_${room}`);
        console.log(`[Socket.IO] User ${userId} left chat room: chat_${room}`);
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
        const { chatId, userId: typingUserId } = data;
        const key = `${chatId}_${typingUserId}`;
        
        // Store typing user
        typingUsers.set(key, Date.now());
        
        // Emit to other participants
        socket.to(`chat_${chatId}`).emit('typing', {
            chatId,
            userId: typingUserId || userId,
            userName: socket.userData?.name || 'User'
        });

        // Auto-clear typing after 3 seconds
        setTimeout(() => {
            typingUsers.delete(key);
            socket.to(`chat_${chatId}`).emit('stop typing', {
                chatId,
                userId: typingUserId || userId
            });
        }, 3000);
    });

    // Handle stop typing indicator
    socket.on('stop typing', (data) => {
        const { chatId, userId: typingUserId } = data;
        const key = `${chatId}_${typingUserId || userId}`;
        typingUsers.delete(key);
        
        socket.to(`chat_${chatId}`).emit('stop typing', {
            chatId,
            userId: typingUserId || userId
        });
    });

    // Handle receiving and broadcasting a new message
    socket.on('new message', (newMessageReceived) => {
        try {
            let chat = newMessageReceived.chat;

            if (!chat || !chat.participants) {
                console.log('[Socket.IO] chat.participants is not defined');
                return;
            }

            // Emit the received message to all other users in the chat
            chat.participants.forEach((user) => {
                if (user.id == newMessageReceived.sender.id) return;
                
                io.to(`user_${user.id}`).emit('message received', newMessageReceived);
            });
        } catch (error) {
            console.error('[Socket.IO] Error broadcasting message:', error);
        }
    });

    // Handle user online status update
    socket.on('user online', async () => {
        try {
            // Update last_seen
            if (userId) {
                await User.query()
                    .findById(userId)
                    .patch({ last_seen: new Date() });
            }
            
            // Broadcast user online status
        socket.broadcast.emit('user online', { userId });
        } catch (error) {
            console.error('[Socket.IO] User online error:', error);
        }
    });

    // Handle user disconnect
    socket.on('disconnect', async () => {
        console.log(`[Socket.IO] User disconnected: ${socket.id} (User ID: ${userId})`);
        
        try {
            // Update last_seen
            if (userId) {
                await User.query()
                    .findById(userId)
                    .patch({ last_seen: new Date() });
            }
        } catch (error) {
            console.error('[Socket.IO] Update last_seen on disconnect error:', error);
        }
        
        // Broadcast user offline status
        socket.broadcast.emit('user offline', { userId });
        
        // Clean up typing indicators
        for (const [key, value] of typingUsers.entries()) {
            if (key.includes(`_${userId}`)) {
                typingUsers.delete(key);
            }
        }
    });
};
