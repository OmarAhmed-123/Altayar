const asyncHandler = require('express-async-handler');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AppleStrategy = require('passport-apple').Strategy;
const User = require('../models/User');
const OAuthProvider = require('../models/OAuthProvider');
const { 
  handleGoogleCallback, 
  handleAppleCallback, 
  serializeUser, 
  deserializeUser,
  oauthSuccess,
  oauthFailure
} = require('../middleware/oauthMiddleware');

// Configure Passport
const configurePassport = () => {
  // Serialize/Deserialize user
  passport.serializeUser(serializeUser);
  passport.deserializeUser(deserializeUser);

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/oauth/google/callback'
    }, handleGoogleCallback));
  }

  // Apple OAuth Strategy
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    passport.use(new AppleStrategy({
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      privateKey: process.env.APPLE_PRIVATE_KEY,
      callbackURL: process.env.APPLE_CALLBACK_URL || '/api/oauth/apple/callback',
      scope: ['name', 'email']
    }, handleAppleCallback));
  }
};

// Initialize Passport
configurePassport();

// @desc    Google OAuth login
// @route   GET /api/oauth/google
// @access  Public
exports.googleLogin = passport.authenticate('google', {
  scope: ['profile', 'email']
});

// @desc    Google OAuth callback
// @route   GET /api/oauth/google/callback
// @access  Public
exports.googleCallback = [
  passport.authenticate('google', { failureRedirect: '/api/oauth/failure' }),
  oauthSuccess
];

// @desc    Apple OAuth login
// @route   GET /api/oauth/apple
// @access  Public
exports.appleLogin = passport.authenticate('apple', {
  scope: ['name', 'email']
});

// @desc    Apple OAuth callback
// @route   POST /api/oauth/apple/callback
// @access  Public
exports.appleCallback = [
  passport.authenticate('apple', { failureRedirect: '/api/oauth/failure' }),
  oauthSuccess
];

// @desc    OAuth failure handler
// @route   GET /api/oauth/failure
// @access  Public
exports.oauthFailure = oauthFailure;

// @desc    Get user's OAuth providers
// @route   GET /api/oauth/providers
// @access  Private
exports.getUserProviders = asyncHandler(async (req, res) => {
  const providers = await OAuthProvider.getUserProviders(req.user.id);

  res.json({
    success: true,
    data: providers
  });
});

// @desc    Link OAuth provider to user
// @route   POST /api/oauth/link
// @access  Private
exports.linkProvider = asyncHandler(async (req, res) => {
  const { provider, providerId, email, name, avatarUrl, providerData } = req.body;

  if (!provider || !providerId || !email) {
    res.status(400);
    throw new Error('Provider, provider ID, and email are required');
  }

  // Check if provider is already linked
  const hasProvider = await OAuthProvider.hasProvider(req.user.id, provider);
  if (hasProvider) {
    res.status(400);
    throw new Error('This provider is already linked to your account');
  }

  // Link provider to user
  const oauthProvider = await OAuthProvider.linkToUser(req.user.id, {
    provider,
    providerId,
    email,
    name,
    avatarUrl,
    providerData
  });

  res.json({
    success: true,
    data: oauthProvider,
    message: 'OAuth provider linked successfully'
  });
});

// @desc    Unlink OAuth provider from user
// @route   DELETE /api/oauth/unlink/:provider
// @access  Private
exports.unlinkProvider = asyncHandler(async (req, res) => {
  const { provider } = req.params;

  // Check if user has a password (can't unlink if it's the only auth method)
  if (!req.user.password && req.user.is_oauth_user) {
    const providerCount = await OAuthProvider.query()
      .where('user_id', req.user.id)
      .resultSize();

    if (providerCount <= 1) {
      res.status(400);
      throw new Error('Cannot unlink the only authentication method. Please set a password first.');
    }
  }

  const unlinked = await OAuthProvider.unlinkFromUser(req.user.id, provider);

  if (!unlinked) {
    res.status(404);
    throw new Error('OAuth provider not found');
  }

  res.json({
    success: true,
    message: 'OAuth provider unlinked successfully'
  });
});

// @desc    Get OAuth configuration
// @route   GET /api/oauth/config
// @access  Public
exports.getOAuthConfig = asyncHandler(async (req, res) => {
  const config = {
    google: {
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      clientId: process.env.GOOGLE_CLIENT_ID
    },
    apple: {
      enabled: !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID),
      clientId: process.env.APPLE_CLIENT_ID
    }
  };

  res.json({
    success: true,
    data: config
  });
});

// @desc    OAuth token exchange (for mobile apps)
// @route   POST /api/oauth/token-exchange
// @access  Public
exports.tokenExchange = asyncHandler(async (req, res) => {
  const { provider, token, idToken } = req.body;

  if (!provider || (!token && !idToken)) {
    res.status(400);
    throw new Error('Provider and token are required');
  }

  let profile;

  try {
    if (provider === 'google') {
      profile = await resolveGoogleProfile({ token, idToken });
    } else if (provider === 'apple') {
      // For Apple, you would verify the JWT token here
      // This is a simplified version - in production, you should verify the JWT signature
      if (!idToken) {
        throw new Error('Apple ID token is required');
      }
      
      // Decode Apple JWT (in production, verify signature)
      const decoded = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      profile = {
        id: decoded.sub,
        email: decoded.email,
        name: req.body.name || decoded.email?.split('@')[0]
      };
    } else {
      res.status(400);
      throw new Error('Unsupported OAuth provider');
    }

    // Create or find user
    const user = await createOrFindUser(profile, provider);
    const jwtToken = generateToken(user.id);

    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        is_oauth_user: user.is_oauth_user,
        oauth_provider: user.oauth_provider
      },
      message: 'OAuth token exchange successful'
    });

  } catch (error) {
    res.status(400);
    throw new Error(`OAuth token verification failed: ${error.message}`);
  }
});

// Helper function to create or find user
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
  user = await User.query().findOne({ email });

  if (user) {
    // Link OAuth provider to existing user
    await OAuthProvider.linkToUser(user.id, {
      provider,
      providerId: id,
      email,
      name,
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

  // Create new user
  user = await User.query().insert({
    name: name || email.split('@')[0],
    email,
    password: '', // OAuth users don't need password
    role: 'customer',
    is_oauth_user: true,
    oauth_provider: provider,
    oauth_id: id,
    email_verified: true,
    email_verified_at: new Date(),
    avatar_url: picture,
    points: 0,
    cashback: 0
  });

  // Create OAuth provider record
  await OAuthProvider.linkToUser(user.id, {
    provider,
    providerId: id,
    email,
    name,
    avatarUrl: picture,
    providerData: profile
  });

  return user;
};

const resolveGoogleProfile = async ({ token, idToken }) => {
  if (idToken) {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) {
      throw new Error('Invalid Google ID token');
    }
    const payload = await response.json();
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
      picture: payload.picture,
    };
  }

  if (token) {
    const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`);
    if (!response.ok) {
      throw new Error('Invalid Google access token');
    }
    return await response.json();
  }

  throw new Error('Missing Google token or idToken');
};

// Helper function to generate JWT token
// CRITICAL FIX: Use 'id' instead of 'userId' to match authController and middleware expectations
const generateToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback-secret-key', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};
