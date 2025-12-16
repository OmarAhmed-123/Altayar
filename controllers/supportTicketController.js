/**
 * Support Ticket Controller
 * Handles creation and management of support tickets
 */

const asyncHandler = require('express-async-handler');
const SupportTicket = require('../models/SupportTicket');
const Chat = require('../models/Chat');
const User = require('../models/User');

/**
 * Generate unique ticket number
 */
const generateTicketNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TKT-${year}${month}${day}-${random}`;
};

/**
 * Create support ticket automatically from chat
 */
const createTicketFromChat = asyncHandler(async (req, res) => {
  const { chatId, subject, description, priority } = req.body;
  const userId = req.user.id;

  // Get chat details
  const chat = await Chat.query()
    .findById(chatId)
    .withGraphFetched('participants');

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found'
    });
  }

  // Check if user is participant in chat
  const isParticipant = chat.participants?.some(p => p.id === userId);
  if (!isParticipant) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to create ticket for this chat'
    });
  }

  // Generate ticket number
  let ticketNumber = generateTicketNumber();
  let exists = await SupportTicket.query().where('ticket_number', ticketNumber).first();
  while (exists) {
    ticketNumber = generateTicketNumber();
    exists = await SupportTicket.query().where('ticket_number', ticketNumber).first();
  }

  // Find available support staff (including agent role)
  const supportStaff = await User.query()
    .whereIn('role', ['sales', 'reservations', 'admin', 'super_admin', 'agent'])
    .orderByRaw('RANDOM()')
    .first();

  // Create ticket
  const ticket = await SupportTicket.query().insert({
    user_id: userId,
    chat_id: chatId,
    ticket_number: ticketNumber,
    subject: subject || 'طلب دعم فني',
    description: description || 'تم إنشاء تذكرة دعم فني تلقائياً من المحادثة',
    status: 'open',
    priority: priority || 'medium',
    assigned_to: supportStaff?.id || null
  });

  const ticketWithRelations = await SupportTicket.query()
    .findById(ticket.id)
    .withGraphFetched('[user, chat, assignedStaff]');

  res.status(201).json({
    success: true,
    message: 'Support ticket created successfully',
    data: ticketWithRelations
  });
});

/**
 * Get user's support tickets
 */
const getMyTickets = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  let query = SupportTicket.query()
    .where('user_id', userId)
    .withGraphFetched('[assignedStaff, chat]')
    .orderBy('created_at', 'desc');

  if (status) {
    query = query.where('status', status);
  }

  const tickets = await query;

  res.json({
    success: true,
    data: tickets
  });
});

/**
 * Get all support tickets (Admin/Staff)
 */
const getAllTickets = asyncHandler(async (req, res) => {
  const { status, priority, assignedTo } = req.query;

  let query = SupportTicket.query()
    .withGraphFetched('[user, assignedStaff, chat]')
    .orderBy('created_at', 'desc');

  if (status) {
    query = query.where('status', status);
  }

  if (priority) {
    query = query.where('priority', priority);
  }

  if (assignedTo) {
    query = query.where('assigned_to', assignedTo);
  }

  const tickets = await query;

  res.json({
    success: true,
    data: tickets
  });
});

/**
 * Update ticket status
 */
const updateTicketStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, assignedTo, priority } = req.body;

  const ticket = await SupportTicket.query().findById(id);

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  // Check permissions
  const isOwner = ticket.user_id === req.user.id;
  const isAssigned = ticket.assigned_to === req.user.id;
  const isAdmin = ['admin', 'super_admin', 'agent'].includes(req.user.role);

  if (!isOwner && !isAssigned && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this ticket'
    });
  }

  const updateData = {};
  if (status) updateData.status = status;
  if (assignedTo) updateData.assigned_to = assignedTo;
  if (priority) updateData.priority = priority;

  if (status === 'resolved' || status === 'closed') {
    updateData.resolved_at = new Date().toISOString();
  }

  await SupportTicket.query().findById(id).patch(updateData);

  const updatedTicket = await SupportTicket.query()
    .findById(id)
    .withGraphFetched('[user, assignedStaff, chat]');

  res.json({
    success: true,
    message: 'Ticket updated successfully',
    data: updatedTicket
  });
});

module.exports = {
  createTicketFromChat,
  getMyTickets,
  getAllTickets,
  updateTicketStatus
};

