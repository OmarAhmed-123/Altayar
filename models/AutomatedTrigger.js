const { Model } = require('objection');

class AutomatedTrigger extends Model {
  static get tableName() {
    return 'automated_triggers';
  }

  static get relationMappings() {
    const User = require('./User');
    return {
      creator: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'automated_triggers.created_by',
          to: 'users.id'
        }
      }
    };
  }

  // Check if trigger conditions are met for a user
  async checkConditions(user) {
    const conditions = this.trigger_conditions;
    
    switch (this.trigger_type) {
      case 'birthday':
        return this.checkBirthdayCondition(user, conditions);
      
      case 'anniversary':
        return this.checkAnniversaryCondition(user, conditions);
      
      case 'inactivity':
        return this.checkInactivityCondition(user, conditions);
      
      case 'purchase':
        return this.checkPurchaseCondition(user, conditions);
      
      case 'membership_expiry':
        return this.checkMembershipExpiryCondition(user, conditions);
      
      case 'points_milestone':
        return this.checkPointsMilestoneCondition(user, conditions);
      
      default:
        return false;
    }
  }

  // Check birthday condition
  checkBirthdayCondition(user, conditions) {
    const today = new Date();
    const userBirthday = new Date(user.birthday || user.created_at);
    
    return userBirthday.getMonth() === today.getMonth() && 
           userBirthday.getDate() === today.getDate();
  }

  // Check anniversary condition
  checkAnniversaryCondition(user, conditions) {
    const today = new Date();
    const userAnniversary = new Date(user.created_at);
    const yearsSinceRegistration = today.getFullYear() - userAnniversary.getFullYear();
    
    return yearsSinceRegistration > 0 && 
           userAnniversary.getMonth() === today.getMonth() && 
           userAnniversary.getDate() === today.getDate();
  }

  // Check inactivity condition
  checkInactivityCondition(user, conditions) {
    const daysSinceLastActivity = conditions.days || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastActivity);
    
    return user.updated_at < cutoffDate;
  }

  // Check purchase condition
  checkPurchaseCondition(user, conditions) {
    // This would need to check booking history
    // For now, return false as it requires more complex logic
    return false;
  }

  // Check membership expiry condition
  checkMembershipExpiryCondition(user, conditions) {
    if (!user.membership_expiry_date) return false;
    
    const expiryDate = new Date(user.membership_expiry_date);
    const warningDays = conditions.warning_days || 7;
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + warningDays);
    
    return expiryDate <= warningDate && expiryDate > new Date();
  }

  // Check points milestone condition
  checkPointsMilestoneCondition(user, conditions) {
    const milestone = conditions.points_milestone || 1000;
    return user.points >= milestone;
  }

  // Execute trigger action
  async executeAction(user) {
    const actionConfig = this.action_config;
    
    switch (actionConfig.type) {
      case 'send_email':
        return await this.sendEmail(user, actionConfig);
      
      case 'send_sms':
        return await this.sendSMS(user, actionConfig);
      
      case 'add_points':
        return await this.addPoints(user, actionConfig);
      
      case 'create_voucher':
        return await this.createVoucher(user, actionConfig);
      
      case 'send_notification':
        return await this.sendNotification(user, actionConfig);
      
      default:
        return false;
    }
  }

  // Send email action
  async sendEmail(user, actionConfig) {
    // In a real implementation, you would integrate with an email service
    console.log(`Sending email to ${user.email}: ${actionConfig.subject}`);
    return true;
  }

  // Send SMS action
  async sendSMS(user, actionConfig) {
    // In a real implementation, you would integrate with an SMS service
    console.log(`Sending SMS to ${user.phone}: ${actionConfig.message}`);
    return true;
  }

  // Add points action
  async addPoints(user, actionConfig) {
    const points = actionConfig.points || 100;
    await user.$query().patch({
      points: user.points + points
    });
    return true;
  }

  // Create voucher action
  async createVoucher(user, actionConfig) {
    const Voucher = require('./Voucher');
    const voucher = await Voucher.query().insert({
      user_id: user.id,
      code: `AUTO-${Date.now()}-${Math.floor(Math.random() * 900) + 100}`,
      type: actionConfig.voucher_type || 'discount',
      value: actionConfig.voucher_value || 50,
      description: actionConfig.description || 'Automated trigger voucher',
      expires_at: actionConfig.expires_at ? new Date(actionConfig.expires_at) : null
    });
    return voucher;
  }

  // Send notification action
  async sendNotification(user, actionConfig) {
    const Notification = require('./Notification');
    const notification = await Notification.query().insert({
      user_id: user.id,
      title: actionConfig.title || 'Notification',
      message: actionConfig.message || 'You have a new notification',
      type: actionConfig.notification_type || 'info',
      is_read: false
    });
    return notification;
  }
}

module.exports = AutomatedTrigger;
