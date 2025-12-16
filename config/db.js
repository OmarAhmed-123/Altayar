// File: config/db.js
const knex = require('knex');
const knexfile = require('../knexfile');
const { Model } = require('objection');

const environment = process.env.NODE_ENV || 'development';
const connectionConfig = knexfile[environment];

const db = knex(connectionConfig);

const ensureColumn = async (tableName, columnName, definitionCallback) => {
    const hasColumn = await db.schema.hasColumn(tableName, columnName);
    if (!hasColumn) {
        await db.schema.alterTable(tableName, (table) => {
            definitionCallback(table);
        });
        console.log(`[DB] Added ${tableName}.${columnName} column automatically.`);
    }
};

const backfillSuperAdmins = async () => {
    try {
        await db('users')
            .where('role', 'super_admin')
            .update({ is_super_admin: true });
    } catch (error) {
        console.error('[DB] Failed to backfill super admin flags:', error.message);
    }
};

const backfillAdsActivation = async () => {
    try {
        const updated = await db('ads')
            .whereNull('is_active')
            .update({ is_active: true });
        if (updated) {
            console.log(`[DB] Normalized ${updated} ads to is_active=true`);
        }
    } catch (error) {
        console.error('[DB] Failed to normalize ads.is_active:', error.message);
    }
};

// ربط كل نماذج Objection بقاعدة البيانات
Model.knex(db);

const ensureCriticalStructures = async () => {
    try {
        const hasNotificationsTable = await db.schema.hasTable('notifications');
        if (hasNotificationsTable) {
            const hasDataColumn = await db.schema.hasColumn('notifications', 'data');
            if (!hasDataColumn) {
                await db.schema.alterTable('notifications', (table) => {
                    table.jsonb('data').nullable();
                });
                console.log('[DB] Added missing notifications.data column automatically.');
            }
        }

        await ensureColumn('users', 'is_super_admin', (table) => {
            table.boolean('is_super_admin').notNullable().defaultTo(false);
        });

        await ensureColumn('users', 'created_by', (table) => {
            table
                .integer('created_by')
                .unsigned()
                .references('id')
                .inTable('users')
                .onDelete('SET NULL');
        });

        await backfillSuperAdmins();

        await ensureColumn('ads', 'is_active', (table) => {
            table.boolean('is_active').notNullable().defaultTo(true);
        });
        await backfillAdsActivation();

        const hasSupportTickets = await db.schema.hasTable('support_tickets');
        if (!hasSupportTickets) {
            await db.schema.createTable('support_tickets', (table) => {
                table.increments('id').primary();
                table.integer('user_id').unsigned().notNullable()
                    .references('id').inTable('users').onDelete('CASCADE');
                table.integer('chat_id').unsigned().nullable()
                    .references('id').inTable('chats').onDelete('SET NULL');
                table.string('ticket_number').notNullable().unique();
                table.string('subject').notNullable();
                table.text('description').nullable();
                table.enum('status', ['open', 'in_progress', 'resolved', 'closed']).defaultTo('open');
                table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
                table.integer('assigned_to').unsigned().nullable()
                    .references('id').inTable('users').onDelete('SET NULL');
                table.timestamp('resolved_at').nullable();
                table.timestamps(true, true);

                table.index('user_id');
                table.index('chat_id');
                table.index('status');
                table.index('ticket_number');
                table.index('created_at');
            });
            console.log('[DB] Created support_tickets table automatically.');
        }
    } catch (structureError) {
        console.error('[DB] ensureCriticalStructures error:', structureError);
    }
};

const connectDB = async () => {
    try {
        // اختبار الاتصال بإرسال استعلام بسيط
        await db.raw('SELECT 1+1 as result');
        console.log('PostgreSQL connected successfully.');
        await ensureCriticalStructures();
    } catch (error) {
        console.error(`Error connecting to PostgreSQL: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { connectDB, db, knex }; // We export db and knex for seeders