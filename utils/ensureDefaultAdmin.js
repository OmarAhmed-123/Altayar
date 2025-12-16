const bcrypt = require('bcryptjs');
const { db } = require('../config/db');

const truthy = new Set(['1', 'true', 'yes', 'on', 'enable', 'enabled']);

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  return truthy.has(String(value).trim().toLowerCase());
};

const ensureDefaultAdmin = async () => {
  if (global.__DEFAULT_ADMIN_READY__) {
    return;
  }

  const shouldBootstrap = parseBoolean(process.env.AUTO_BOOTSTRAP_SUPER_ADMIN, false);
  if (!shouldBootstrap) {
    global.__DEFAULT_ADMIN_READY__ = true;
    return;
  }

  const email = (process.env.DEFAULT_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.DEFAULT_ADMIN_PASSWORD;
  const name = (process.env.DEFAULT_ADMIN_NAME || 'Altayar Root Admin').trim();

  if (!email || !password) {
    console.warn('[Bootstrap] DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD are required to auto-create the super admin.');
    global.__DEFAULT_ADMIN_READY__ = true;
    return;
  }

  try {
    const hasUsersTable = await db.schema.hasTable('users');
    if (!hasUsersTable) {
      console.warn('[Bootstrap] Users table not found, skipping default admin bootstrap.');
      global.__DEFAULT_ADMIN_READY__ = true;
      return;
    }

    const existingSuperAdmin = await db('users')
      .where('is_super_admin', true)
      .orWhere('role', 'super_admin')
      .first();

    if (existingSuperAdmin) {
      global.__DEFAULT_ADMIN_READY__ = true;
      return;
    }

    const existingByEmail = await db('users')
      .where('email', email)
      .first();

    const hashedPassword = await bcrypt.hash(password, 10);
    const timestamp = db.fn.now();

    if (existingByEmail) {
      await db('users')
        .where('id', existingByEmail.id)
        .update({
          role: 'super_admin',
          is_super_admin: true,
          password: hashedPassword,
          name,
          updated_at: timestamp
        });

      console.log(`[Bootstrap] Promoted existing user (${email}) to super_admin.`);
    } else {
      const insertPayload = {
        email,
        password: hashedPassword,
        name,
        role: 'super_admin',
        is_super_admin: true,
        points: 0,
        cashback: 0,
        created_at: timestamp,
        updated_at: timestamp
      };

      const result = await db('users')
        .insert(insertPayload)
        .returning('id');

      const userId = Array.isArray(result)
        ? (result[0]?.id ?? result[0])
        : result;

      console.log(`[Bootstrap] Created default super admin (${email}) with id ${userId}.`);
    }
  } catch (error) {
    console.error('[Bootstrap] Failed to ensure default admin:', error.message);
  } finally {
    global.__DEFAULT_ADMIN_READY__ = true;
  }
};

module.exports = { ensureDefaultAdmin };


