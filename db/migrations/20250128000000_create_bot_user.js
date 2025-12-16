/**
 * Migration: Create bot user for chat
 * Creates a bot user for automated chat responses
 */

const bcrypt = require('bcryptjs');

exports.up = async function(knex) {
  // Check if bot user already exists
  const existingBot = await knex('users')
    .where('email', 'bot@altayar.com')
    .orWhere('role', 'bot')
    .first();

  if (!existingBot) {
    // Create bot user
    const hashedPassword = await bcrypt.hash('bot_password_never_used', 10);
    
    await knex('users').insert({
      name: 'دعم الطيار VIP',
      email: 'bot@altayar.com',
      password: hashedPassword,
      role: 'bot',
      profile_picture_url: null,
      is_active: true,
      points: 0,
      cashback: 0,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      last_seen: knex.fn.now()
    });
    
    console.log('✅ Bot user created successfully');
  } else {
    console.log('ℹ️  Bot user already exists');
  }
};

exports.down = async function(knex) {
  // Remove bot user
  await knex('users')
    .where('email', 'bot@altayar.com')
    .orWhere('role', 'bot')
    .delete();
    
  console.log('✅ Bot user removed');
};

