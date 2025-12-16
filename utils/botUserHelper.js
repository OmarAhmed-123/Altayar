/**
 * Bot User Helper
 * Handles finding or creating the chat bot user
 */

const User = require('../models/User');

/**
 * Get or create bot user
 * @returns {Promise<Object>} Bot user object
 */
const getBotUser = async () => {
    try {
        // Try to find bot user by email
        let botUser = await User.query()
            .where('email', 'bot@altayar.com')
            .first();

        if (!botUser) {
            // Create bot user if doesn't exist
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('bot_password_' + Date.now(), salt);
            
            botUser = await User.query().insert({
                name: 'دعم الطيار VIP',
                email: 'bot@altayar.com',
                password: hashedPassword, // Hashed password - bot doesn't login
                role: 'customer', // Use customer role (bot role doesn't exist in enum)
                profile_picture_url: '',
                points: 0,
                cashback: 0
            });
            console.log('[Bot] Created bot user:', botUser.id);
        }

        return botUser;
    } catch (error) {
        console.error('[Bot] Error getting bot user:', error);
        // Fallback: try to find any user with bot-like email or return first admin
        try {
            const fallbackUser = await User.query()
                .where('email', 'like', '%bot%')
                .orWhere('name', 'like', '%bot%')
                .orWhere('name', 'like', '%دعم%')
                .first();
            
            if (fallbackUser) {
                return fallbackUser;
            }
            
            // Last resort: return first admin user
            const adminUser = await User.query()
                .whereIn('role', ['admin', 'super_admin'])
                .first();
            
            if (adminUser) {
                return adminUser;
            }
            
            // Ultimate fallback
            return { id: 1, name: 'دعم الطيار VIP', email: 'bot@altayar.com' };
        } catch (fallbackError) {
            console.error('[Bot] Fallback error:', fallbackError);
            return { id: 1, name: 'دعم الطيار VIP', email: 'bot@altayar.com' };
        }
    }
};

module.exports = {
    getBotUser
};

