/**
 * Script to create an admin user
 * Run with: node scripts/createAdminUser.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db } = require('../config/db');

const adminUser = {
  email: 'ahmedsaifdin237@gmail.com',
  password: 'AAIOH2040%%fF%',
  name: 'Ahmed Saif Din',
  role: 'admin',
  points: 0,
  cashback: 0,
};

async function createAdminUser() {
  try {
    console.log('Connecting to database...');
    
    // Check if user already exists
    const existingUser = await db('users')
      .where({ email: adminUser.email.toLowerCase() })
      .first();

    if (existingUser) {
      console.log('⚠️  User already exists with email:', adminUser.email);
      console.log('Updating user to admin role...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminUser.password, salt);
      
      // Update user to admin
      await db('users')
        .where({ email: adminUser.email.toLowerCase() })
        .update({
          role: 'admin',
          password: hashedPassword,
          name: adminUser.name,
          updated_at: db.fn.now(),
        });
      
      console.log('✅ User updated successfully!');
      console.log('Email:', adminUser.email);
      console.log('Role: admin');
      console.log('Password: AAIOH2040%%fF%');
      return;
    }

    // Hash password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminUser.password, salt);

    // Insert new admin user
    console.log('Creating admin user...');
    const result = await db('users')
      .insert({
        email: adminUser.email.toLowerCase(),
        password: hashedPassword,
        name: adminUser.name,
        role: adminUser.role,
        points: adminUser.points,
        cashback: adminUser.cashback,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('id');

    const userId = Array.isArray(result) && result.length > 0 ? result[0].id : result;

    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User ID:', userId);
    console.log('Email:', adminUser.email);
    console.log('Name:', adminUser.name);
    console.log('Role: admin');
    console.log('Password: AAIOH2040%%fF%');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('You can now login with these credentials!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await db.destroy();
    console.log('Database connection closed.');
  }
}

// Run the script
createAdminUser();

