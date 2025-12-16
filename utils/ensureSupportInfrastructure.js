const { db } = require('../config/db');

const ensureColumn = async (tableName, columnName, builderCallback) => {
  const hasColumn = await db.schema.hasColumn(tableName, columnName);
  if (!hasColumn) {
    await db.schema.alterTable(tableName, (table) => {
      builderCallback(table);
    });
    console.log(`[Schema] Added ${columnName} column to ${tableName}`);
  }
};

const ensureSupportInfrastructure = async () => {
  if (global.__SUPPORT_INFRA_READY__) {
    return;
  }

  try {
    const hasNotifications = await db.schema.hasTable('notifications');
    if (hasNotifications) {
      await ensureColumn('notifications', 'data', (table) => {
        table.jsonb('data').nullable();
      });
    }

    await ensureColumn('users', 'created_by', (table) => {
      table
        .integer('created_by')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');
    });


    await ensureColumn('users', 'is_super_admin', (table) => {
      table
        .boolean('is_super_admin')
        .notNullable()
        .defaultTo(false);
    });

    await ensureColumn('ads', 'is_active', (table) => {
      table.boolean('is_active').notNullable().defaultTo(true);
    });

    const hasSupportTickets = await db.schema.hasTable('support_tickets');
    if (!hasSupportTickets) {
      await db.schema.createTable('support_tickets', (table) => {
        table.increments('id').primary();
        table.string('ticket_number').notNullable().unique();
        table
          .integer('user_id')
          .notNullable()
          .references('id')
          .inTable('users')
          .onDelete('CASCADE');
        table
          .integer('chat_id')
          .nullable()
          .references('id')
          .inTable('chats')
          .onDelete('SET NULL');
        table
          .integer('assigned_to')
          .nullable()
          .references('id')
          .inTable('users')
          .onDelete('SET NULL');
        table.string('subject').notNullable();
        table.text('description').notNullable();
        table
          .enu('status', ['open', 'in_progress', 'resolved', 'closed'])
          .notNullable()
          .defaultTo('open');
        table
          .enu('priority', ['low', 'medium', 'high', 'urgent'])
          .notNullable()
          .defaultTo('medium');
        table.timestamp('resolved_at').nullable();
        table.timestamps(true, true);
      });
      console.log('[Schema] Created support_tickets table');
    } else {
      await ensureColumn('support_tickets', 'chat_id', (table) => {
        table
          .integer('chat_id')
          .nullable()
          .references('id')
          .inTable('chats')
          .onDelete('SET NULL');
      });
      await ensureColumn('support_tickets', 'assigned_to', (table) => {
        table
          .integer('assigned_to')
          .nullable()
          .references('id')
          .inTable('users')
          .onDelete('SET NULL');
      });
      await ensureColumn('support_tickets', 'resolved_at', (table) => {
        table.timestamp('resolved_at').nullable();
      });
      await ensureColumn('support_tickets', 'priority', (table) => {
        table
          .enu('priority', ['low', 'medium', 'high', 'urgent'])
          .notNullable()
          .defaultTo('medium');
      });
    }

    global.__SUPPORT_INFRA_READY__ = true;
  } catch (error) {
    console.error('[Schema] Failed to ensure support infrastructure:', error.message);
  }
};

module.exports = { ensureSupportInfrastructure };

