// File: controllers/authController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper function to generate a JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret-key', { expiresIn: '7d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, role } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
    });
  }

  // Validate role if provided
  const validRoles = ['customer', 'admin', 'super_admin', 'hr', 'sales', 'reservations', 'data_entry', 'accountant', 'agent', 'support'];
  const userRole = role && validRoles.includes(role) ? role : 'customer';

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // CRITICAL FIX: Removed pre-check - let actual database query handle errors
  // This prevents false negatives from table checks and allows operations to proceed
  // If table doesn't exist, the actual query will show a clear error message

  // CRITICAL: Use transaction to prevent race conditions in concurrent registrations
  // This ensures that even if multiple users try to register with the same email simultaneously,
  // only one will succeed
  const { db, dbQueryWithRetry, checkAndRestoreConnection } = require('../config/db');
  
  // CRITICAL FIX: Remove strict pre-check - let actual database operations handle errors
  // Pre-checks can fail even when database is connected, causing false 503 errors
  // Instead, attempt the operation directly and handle errors gracefully
  // Only do a lightweight connection check if we suspect connection issues
  
  // CRITICAL FIX: Create transaction directly - let it fail naturally if connection is bad
  // This is more reliable than pre-checking which can give false negatives
  // CRITICAL FIX: Try to create transaction with fallback mechanism
  // If transaction fails, try direct query without transaction (for simple operations)
  let trx = null;
  let useTransaction = true;
  
  try {
    // CRITICAL FIX: Create transaction with longer timeout for Cloud SQL
    // Cloud SQL Proxy may need more time to establish connection
    const dbHost = process.env.DB_HOST || '';
    const isCloudSqlProxy = dbHost.startsWith('/cloudsql/');
    const timeout = isCloudSqlProxy ? 30000 : 20000; // 30s for Cloud SQL, 20s for others
    
    trx = await Promise.race([
      db.transaction(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Transaction creation timeout after ${timeout}ms`)), timeout)
      )
    ]);
    console.log('✅ [REGISTRATION] Transaction created successfully');
  } catch (trxError) {
    console.warn('⚠️ [REGISTRATION] Transaction creation failed, will try without transaction:', {
      message: trxError.message,
      code: trxError.code,
      host: process.env.DB_HOST || 'NOT SET',
      timestamp: new Date().toISOString()
    });
    
    // CRITICAL FIX: For connection errors, try to restore and retry once
    const isConnectionError = trxError.code === 'ECONNREFUSED' || 
                              trxError.code === 'ETIMEDOUT' ||
                              trxError.code === 'ENOTFOUND' ||
                              trxError.message.includes('ECONNREFUSED') ||
                              (trxError.message.includes('timeout') && !trxError.message.includes('Transaction creation timeout'));
    
    if (isConnectionError) {
      // Try to restore connection once before giving up
      console.warn('🔄 [REGISTRATION] Connection error detected, attempting to restore...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const restored = await checkAndRestoreConnection();
      if (restored) {
        try {
          const dbHost = process.env.DB_HOST || '';
          const isCloudSqlProxy = dbHost.startsWith('/cloudsql/');
          const timeout = isCloudSqlProxy ? 30000 : 20000;
          
          trx = await Promise.race([
            db.transaction(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`Transaction creation timeout after ${timeout}ms`)), timeout)
            )
          ]);
          console.log('✅ [REGISTRATION] Transaction created after connection restore');
        } catch (retryError) {
          console.warn('⚠️ [REGISTRATION] Transaction creation failed on retry, will proceed without transaction');
          useTransaction = false; // Fallback to non-transaction mode
          trx = null;
        }
      } else {
        console.warn('⚠️ [REGISTRATION] Connection restore failed, will proceed without transaction');
        useTransaction = false; // Fallback to non-transaction mode
        trx = null;
      }
    } else {
      // For timeout errors (transaction creation timeout), try without transaction
      console.warn('⚠️ [REGISTRATION] Transaction timeout, will proceed without transaction');
      useTransaction = false;
      trx = null;
    }
  }
  
  try {
    // CRITICAL FIX: Execute queries - use transaction if available, otherwise direct query
    let userExists;
    try {
      if (useTransaction && trx) {
        // Use transaction with row locking
        userExists = await Promise.race([
          User.query(trx)
            .findOne({ email: normalizedEmail })
            .forUpdate(), // Lock the row to prevent concurrent inserts
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), 20000)
          )
        ]);
      } else {
        // Fallback: Direct query without transaction (for simple operations)
        console.log('⚠️ [REGISTRATION] Using direct query without transaction');
        userExists = await Promise.race([
          User.query()
            .findOne({ email: normalizedEmail }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), 20000)
          )
        ]);
      }
    } catch (queryError) {
      // CRITICAL FIX: If query fails, rollback transaction if exists
      if (trx) {
        try {
          await trx.rollback();
        } catch (rollbackError) {
          // Ignore rollback errors
        }
      }
      
      // CRITICAL FIX: Only return 503 for actual connection errors
      const isConnectionError = queryError.code === 'ECONNREFUSED' || 
                                queryError.code === 'ETIMEDOUT' ||
                                queryError.code === 'ENOTFOUND' ||
                                queryError.message.includes('ECONNREFUSED') ||
                                (queryError.message.includes('timeout') && !queryError.message.includes('Query timeout'));
      
      if (isConnectionError) {
        console.error('❌ [REGISTRATION] Query failed with connection error:', queryError.message);
        return res.status(503).json({
          success: false,
          message: 'Database connection error. Please try again.',
          error: process.env.NODE_ENV === 'development' ? queryError.message : undefined,
        });
      }
      throw queryError;
    }

    if (userExists) {
      if (trx) {
        try {
          await trx.rollback();
        } catch (rollbackError) {
          // Ignore rollback errors
        }
      }
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Manually hash the password before inserting
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // CRITICAL FIX: Insert user - use transaction if available, otherwise direct insert
    let user;
    try {
      if (useTransaction && trx) {
        // Use transaction
        user = await Promise.race([
          User.query(trx).insert({
            name: `${firstName} ${lastName}`.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: userRole,
            points: 0,
            cashback: 0,
            is_super_admin: userRole === 'super_admin',
            phone: phone || null,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Insert timeout')), 20000)
          )
        ]);
      } else {
        // Fallback: Direct insert without transaction
        console.log('⚠️ [REGISTRATION] Using direct insert without transaction');
        user = await Promise.race([
          User.query().insert({
            name: `${firstName} ${lastName}`.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: userRole,
            points: 0,
            cashback: 0,
            is_super_admin: userRole === 'super_admin',
            phone: phone || null,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Insert timeout')), 20000)
          )
        ]);
      }
    } catch (insertError) {
      // CRITICAL FIX: If insert fails, rollback transaction if exists
      if (trx) {
        try {
          await trx.rollback();
        } catch (rollbackError) {
          // Ignore rollback errors
        }
      }
      
      // CRITICAL FIX: Only return 503 for actual connection errors
      const isConnectionError = insertError.code === 'ECONNREFUSED' || 
                                insertError.code === 'ETIMEDOUT' ||
                                insertError.code === 'ENOTFOUND' ||
                                insertError.message.includes('ECONNREFUSED') ||
                                (insertError.message.includes('timeout') && !insertError.message.includes('Insert timeout'));
      
      if (isConnectionError) {
        console.error('❌ [REGISTRATION] Insert failed with connection error:', insertError.message);
        return res.status(503).json({
          success: false,
          message: 'Database connection error. Please try again.',
          error: process.env.NODE_ENV === 'development' ? insertError.message : undefined,
        });
      }
      throw insertError;
    }

    // CRITICAL FIX: Commit transaction only if we used one
    if (useTransaction && trx) {
      try {
        await Promise.race([
          trx.commit(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Commit timeout')), 15000)
          )
        ]);
        console.log('✅ [REGISTRATION] Transaction committed successfully');
      } catch (commitError) {
        // CRITICAL FIX: If commit fails, try to rollback
        try {
          await trx.rollback();
        } catch (rollbackError) {
          // Ignore rollback errors
        }
        
        const isConnectionError = commitError.code === 'ECONNREFUSED' || 
                                  commitError.code === 'ETIMEDOUT' ||
                                  commitError.code === 'ENOTFOUND' ||
                                  commitError.message.includes('ECONNREFUSED') ||
                                  (commitError.message.includes('timeout') && !commitError.message.includes('Commit timeout'));
        
        if (isConnectionError) {
          console.error('❌ [REGISTRATION] Commit failed with connection error:', commitError.message);
          return res.status(503).json({
            success: false,
            message: 'Database connection error during commit. Please try again.',
            error: process.env.NODE_ENV === 'development' ? commitError.message : undefined,
          });
        }
        throw commitError;
      }
    } else {
      console.log('✅ [REGISTRATION] User inserted successfully without transaction');
    }

    if (user) {
      res.status(200).json({
        success: true,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points || 0,
        cashback: user.cashback || 0,
        is_super_admin: !!user.is_super_admin,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data',
      });
    }
  } catch (error) {
    // CRITICAL FIX: Safely rollback transaction if it exists
    if (trx) {
      try {
        await trx.rollback();
      } catch (rollbackError) {
        console.error('❌ [REGISTRATION] Rollback failed:', rollbackError.message);
      }
    }
    
    // Handle database connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || 
        error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
      console.error('❌ [REGISTRATION] Database connection error:', {
        error: error.message,
        code: error.code,
        email: normalizedEmail,
        timestamp: new Date().toISOString()
      });
      
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable. Please try again in a moment.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
    
    // CRITICAL FIX: Handle table does not exist error (migrations not run)
    // Migrations should run at server startup, not during request handling
    // If table doesn't exist, return clear error message instead of trying to run migrations
    if (error.code === '42P01' || (error.message && error.message.includes('relation') && error.message.includes('does not exist'))) {
      console.error('❌ [REGISTRATION] Database table does not exist:', {
        error: error.message,
        code: error.code,
        email: normalizedEmail,
        timestamp: new Date().toISOString()
      });
      
      // CRITICAL FIX: Don't try to run migrations during request - this causes 503 errors
      // Migrations should be run at server startup or manually
      // Return clear error message instead
      return res.status(500).json({
        success: false,
        message: 'Database tables are not initialized. Please contact the administrator or wait for the server to complete setup.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
    
    // Handle unique constraint violation (email already exists)
    if (error.code === '23505' || error.constraint === 'users_email_unique' || 
        (error.message && error.message.includes('unique'))) {
      console.log(`⚠️ [REGISTRATION] Duplicate email attempt: ${normalizedEmail}`);
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }
    
    // Handle other database errors
    console.error('❌ [REGISTRATION ERROR]', {
      error: error.message,
      code: error.code,
      constraint: error.constraint,
      email: normalizedEmail,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }

  // CRITICAL FIX: Removed pre-check - let actual database query handle errors
  // This prevents false negatives from table checks and allows operations to proceed
  // If table doesn't exist, the actual query will show a clear error message

  try {
    const user = await User.query().findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user has a password (in case password field is null)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Manually compare the password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      res.status(200).json({
        success: true,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        membershipId: user.membership_id || null,
        points: user.points || 0,
        cashback: user.cashback || 0,
        is_super_admin: !!user.is_super_admin,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }
  } catch (error) {
    // CRITICAL FIX: Enhanced error handling to prevent 503 Service Unavailable errors
    // Always return proper JSON responses, never let errors crash the server
    
    // Handle table does not exist error (migrations not run)
    const isTableMissing = error.code === '42P01' || 
                           (error.message && (
                             error.message.includes('relation') && 
                             error.message.includes('does not exist')
                           ));
    
    if (isTableMissing) {
      console.error('❌ [LOGIN] Database table does not exist:', {
        error: error.message,
        code: error.code,
        email: email,
        timestamp: new Date().toISOString()
      });
      
      // CRITICAL: Use 500 instead of 503 to prevent Cloud Run health check failures
      // 503 indicates service is unavailable, but this is a configuration issue
      return res.status(500).json({
        success: false,
        message: 'Database tables are not initialized. Please contact the administrator or wait for the server to complete setup.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        retryable: false,
      });
    }
    
    // Handle database connection errors
    const isConnectionError = error.code === 'ECONNREFUSED' || 
                             error.code === 'ETIMEDOUT' ||
                             error.code === 'ENOTFOUND' ||
                             error.code === 'EAI_AGAIN' ||
                             error.code === 'ENETUNREACH' ||
                             error.message?.includes('ECONNREFUSED') || 
                             error.message?.includes('ETIMEDOUT') ||
                             error.message?.includes('ENOTFOUND') ||
                             error.message?.includes('connect') ||
                             error.message?.includes('Connection') ||
                             error.message?.includes('timeout') ||
                             error.message?.includes('getaddrinfo');
    
    if (isConnectionError) {
      console.error('❌ [LOGIN] Database connection error:', {
        error: error.message,
        code: error.code,
        email: email,
        timestamp: new Date().toISOString()
      });
      
      // CRITICAL: Return 500 instead of 503 - connection errors are internal errors
      // This prevents Cloud Run from marking the service as unhealthy
      return res.status(500).json({
        success: false,
        message: 'Unable to connect to database. Please try again in a moment.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        retryable: true,
      });
    }
    
    // Handle authentication/validation errors
    if (error.name === 'ValidationError' || error.message?.includes('validation')) {
      console.warn('⚠️ [LOGIN] Validation error:', {
        error: error.message,
        email: email,
        timestamp: new Date().toISOString()
      });
      
      return res.status(400).json({
        success: false,
        message: error.message || 'Validation error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
    
    // Handle all other errors
    console.error('❌ [LOGIN ERROR] Unexpected error:', {
      error: error.message,
      code: error.code,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack?.substring(0, 500) : undefined,
      email: email,
      timestamp: new Date().toISOString()
    });
    
    // CRITICAL: Always return 500, never 503
    // 503 should only be used for intentional service unavailability
    res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      retryable: true,
    });
  }
});
