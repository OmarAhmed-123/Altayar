const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OAuthProvider = require('../models/OAuthProvider');

// @desc    Handle Google OAuth callback
// @param   {Object} accessToken - Google access token
// @param   {Object} refreshToken - Google refresh token  
// @param   {Object} profile - Google user profile
// @param   {Function} done - Passport callback
const handleGoogleCallback = async (accessToken, refreshToken, profile, done) => {
  try {
    const { id, emails, name, photos } = profile;
    const email = emails[0].value;
    const displayName = name ? `${name.givenName} ${name.familyName}` : email.split('@')[0];
    const avatarUrl = photos[0]?.value;

    // Check if user exists by OAuth provider
    let user = await OAuthProvider.getUserByProvider('google', id);

    if (user) {
      // Update user info if needed
      if (avatarUrl && avatarUrl !== user.avatar_url) {
        await user.$query().patch({ avatar_url: avatarUrl });
      }
      return done(null, user);
    }

    // Check if user exists by email
    user = await User.query().findOne({ email });

    if (user) {
      // Link OAuth provider to existing user
      await OAuthProvider.linkToUser(user.id, {
        provider: 'google',
        providerId: id,
        email,
        name: displayName,
        avatarUrl,
        providerData: profile
      });

      // Update user OAuth info
      await user.$query().patch({
        is_oauth_user: true,
        oauth_provider: 'google',
        oauth_id: id,
        email_verified: true,
        email_verified_at: new Date(),
        avatar_url: avatarUrl
      });

      return done(null, user);
    }

    // Create new user
    user = await User.query().insert({
      name: displayName,
      email,
      password: '', // OAuth users don't need password
      role: 'customer',
      is_oauth_user: true,
      oauth_provider: 'google',
      oauth_id: id,
      email_verified: true,
      email_verified_at: new Date(),
      avatar_url: avatarUrl,
      points: 0,
      cashback: 0
    });

    // Create OAuth provider record
    await OAuthProvider.linkToUser(user.id, {
      provider: 'google',
      providerId: id,
      email,
      name: displayName,
      avatarUrl,
      providerData: profile
    });

    return done(null, user);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return done(error, null);
  }
};

// @desc    Handle Apple OAuth callback
// @param   {Object} accessToken - Apple access token
// @param   {Object} refreshToken - Apple refresh token
// @param   {Object} profile - Apple user profile
// @param   {Function} done - Passport callback
const handleAppleCallback = async (accessToken, refreshToken, profile, done) => {
  try {
    const { id, email, name } = profile;
    const displayName = name ? `${name.firstName || ''} ${name.lastName || ''}`.trim() : email?.split('@')[0] || 'Apple User';
    const avatarUrl = null; // Apple doesn't provide avatar URLs

    // Check if user exists by OAuth provider
    let user = await OAuthProvider.getUserByProvider('apple', id);

    if (user) {
      return done(null, user);
    }

    // Check if user exists by email
    if (email) {
      user = await User.query().findOne({ email });

      if (user) {
        // Link OAuth provider to existing user
        await OAuthProvider.linkToUser(user.id, {
          provider: 'apple',
          providerId: id,
          email,
          name: displayName,
          avatarUrl,
          providerData: profile
        });

        // Update user OAuth info
        await user.$query().patch({
          is_oauth_user: true,
          oauth_provider: 'apple',
          oauth_id: id,
          email_verified: true,
          email_verified_at: new Date()
        });

        return done(null, user);
      }
    }

    // Create new user
    user = await User.query().insert({
      name: displayName,
      email: email || `apple_${id}@example.com`, // Apple might not provide email
      password: '', // OAuth users don't need password
      role: 'customer',
      is_oauth_user: true,
      oauth_provider: 'apple',
      oauth_id: id,
      email_verified: !!email,
      email_verified_at: email ? new Date() : null,
      avatar_url: avatarUrl,
      points: 0,
      cashback: 0
    });

    // Create OAuth provider record
    await OAuthProvider.linkToUser(user.id, {
      provider: 'apple',
      providerId: id,
      email: email || `apple_${id}@example.com`,
      name: displayName,
      avatarUrl,
      providerData: profile
    });

    return done(null, user);
  } catch (error) {
    console.error('Apple OAuth callback error:', error);
    return done(error, null);
  }
};

// @desc    Serialize user for session
// @param   {Object} user - User object
// @param   {Function} done - Passport callback
const serializeUser = (user, done) => {
  done(null, user.id);
};

// @desc    Deserialize user from session
// @param   {Number} id - User ID
// @param   {Function} done - Passport callback
const deserializeUser = async (id, done) => {
  try {
    const user = await User.query().findById(id);
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, null);
  }
};

// @desc    OAuth success handler
// @param   {Object} req - Express request object
// @param   {Object} res - Express response object
const oauthSuccess = (req, res) => {
  try {
    if (!req.user) {
      return res.redirect('/api/oauth/failure');
    }

    // Generate JWT token
    // CRITICAL FIX: Use 'id' instead of 'userId' to match authController and middleware expectations
    const token = jwt.sign(
      { id: req.user.id },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar_url: req.user.avatar_url,
      is_oauth_user: req.user.is_oauth_user,
      oauth_provider: req.user.oauth_provider
    }))}`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth success handler error:', error);
    res.redirect('/api/oauth/failure');
  }
};

// @desc    OAuth failure handler
// @param   {Object} req - Express request object
// @param   {Object} res - Express response object
const oauthFailure = (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const errorMessage = req.query.error || 'OAuth authentication failed';
  
  res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(errorMessage)}`);
};

// @desc    Create or find user helper function
// @param   {Object} profile - OAuth profile
// @param   {String} provider - OAuth provider name
// @returns {Object} User object
const createOrFindUser = async (profile, provider) => {
  const { id, email, name, picture } = profile;

  // Check if user exists by OAuth provider
  let user = await OAuthProvider.getUserByProvider(provider, id);

  if (user) {
    // Update user info if needed
    if (picture && picture !== user.avatar_url) {
      await user.$query().patch({ avatar_url: picture });
    }
    return user;
  }

  // Check if user exists by email
  if (email) {
    user = await User.query().findOne({ email });

    if (user) {
      // Link OAuth provider to existing user
      await OAuthProvider.linkToUser(user.id, {
        provider,
        providerId: id,
        email,
        name: name || email.split('@')[0],
        avatarUrl: picture,
        providerData: profile
      });

      // Update user OAuth info
      await user.$query().patch({
        is_oauth_user: true,
        oauth_provider: provider,
        oauth_id: id,
        email_verified: true,
        email_verified_at: new Date(),
        avatar_url: picture
      });

      return user;
    }
  }

  // Create new user
  user = await User.query().insert({
    name: name || email?.split('@')[0] || `${provider}_user`,
    email: email || `${provider}_${id}@example.com`,
    password: '', // OAuth users don't need password
    role: 'customer',
    is_oauth_user: true,
    oauth_provider: provider,
    oauth_id: id,
    email_verified: !!email,
    email_verified_at: email ? new Date() : null,
    avatar_url: picture,
    points: 0,
    cashback: 0
  });

  // Create OAuth provider record
  await OAuthProvider.linkToUser(user.id, {
    provider,
    providerId: id,
    email: email || `${provider}_${id}@example.com`,
    name: name || email?.split('@')[0] || `${provider}_user`,
    avatarUrl: picture,
    providerData: profile
  });

  return user;
};

// @desc    Generate JWT token helper
// @param   {Number} userId - User ID
// @returns {String} JWT token
// CRITICAL FIX: Use 'id' instead of 'userId' to match authController and middleware expectations
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback-secret-key', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Verify OAuth token
// @param   {String} token - OAuth token
// @param   {String} provider - OAuth provider
// @returns {Object} User profile
const verifyOAuthToken = async (token, provider) => {
  try {
    if (provider === 'google') {
      // Verify Google token
      const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`);
      if (!response.ok) {
        throw new Error('Invalid Google token');
      }
      return await response.json();
    } else if (provider === 'apple') {
      // For Apple, decode JWT token (in production, verify signature)
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name || decoded.email?.split('@')[0]
      };
    } else {
      throw new Error('Unsupported OAuth provider');
    }
  } catch (error) {
    throw new Error(`OAuth token verification failed: ${error.message}`);
  }
};

module.exports = {
  handleGoogleCallback,
  handleAppleCallback,
  serializeUser,
  deserializeUser,
  oauthSuccess,
  oauthFailure,
  createOrFindUser,
  generateToken,
  verifyOAuthToken
};
