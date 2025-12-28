/**
 * Script to verify all routes are properly loaded and accessible
 * This helps diagnose 404 errors
 */

const express = require('express');
const app = express();

console.log('🔍 Verifying routes...\n');

// Load all routes
try {
    console.log('Loading routes...');
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/users', require('./routes/users'));
    app.use('/api/profile', require('./routes/profile'));
    app.use('/api/memberships', require('./routes/memberships'));
    app.use('/api/packages', require('./routes/packages'));
    app.use('/api/bookings', require('./routes/bookings'));
    app.use('/api/vouchers', require('./routes/vouchers'));
    app.use('/api/trips', require('./routes/trips'));
    app.use('/api/blogs', require('./routes/blogs'));
    app.use('/api/comments', require('./routes/comments'));
    app.use('/api/ads', require('./routes/ads'));
    app.use('/api/additionals', require('./routes/additionals'));
    app.use('/api/reports', require('./routes/reports'));
    app.use('/api/transactions', require('./routes/transactions'));
    app.use('/api/dashboard', require('./routes/dashboard'));
    app.use('/api/chat', require('./routes/chat'));
    app.use('/api/notifications', require('./routes/notifications'));
    app.use('/api/settings', require('./routes/settings'));
    app.use('/api/reviews', require('./routes/reviews'));
    app.use('/api/documents', require('./routes/documents'));
    app.use('/api/affiliates', require('./routes/affiliates'));
    app.use('/api/recommendations', require('./routes/recommendations'));
    app.use('/api/travel-companion', require('./routes/travelCompanion'));
    const fileManagementRoutes = require('./routes/fileManagement');
    app.use('/api/files', fileManagementRoutes);
    app.use('/files', fileManagementRoutes);
    app.use('/api/marketing', require('./routes/marketingAutomation'));
    app.use('/api/partners', require('./routes/partnerPortal'));
    app.use('/api/localization', require('./routes/localization'));
    app.use('/api/affiliate', require('./routes/affiliate'));
    app.use('/api/referrals', require('./routes/affiliate'));
    app.use('/api/external', require('./routes/externalApi'));
    app.use('/api/geolocation', require('./routes/geolocation'));
    app.use('/api/oauth', require('./routes/oauth'));
    app.use('/api/payments', require('./routes/payments'));
    app.use('/api/images', require('./routes/images'));
    app.use('/api/admin', require('./routes/admin'));
    app.use('/api/quotations', require('./routes/quotations'));
    app.use('/api/support-tickets', require('./routes/supportTickets'));
    app.use('/api/deep-links', require('./routes/deepLinks'));
    app.use('/api/invoices', require('./routes/invoices'));
    
    console.log('✅ All routes loaded successfully\n');
    
    // List all registered routes
    console.log('📋 Registered Routes:');
    const routes = [];
    
    function printRoutes(layer, prefix = '') {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
            routes.push(`${methods.padEnd(8)} ${prefix}${layer.route.path}`);
        } else if (layer.name === 'router') {
            const path = layer.regexp.source
                .replace('\\/?', '')
                .replace('(?=\\/|$)', '')
                .replace(/\\\//g, '/')
                .replace(/\^/g, '')
                .replace(/\$/g, '')
                .replace(/\\/g, '');
            
            if (layer.handle && layer.handle.stack) {
                layer.handle.stack.forEach((sublayer) => {
                    printRoutes(sublayer, path);
                });
            }
        }
    }
    
    app._router.stack.forEach((layer) => {
        printRoutes(layer);
    });
    
    // Check for specific routes
    const criticalRoutes = [
        '/api/health',
        '/api/auth/login',
        '/api/auth/register',
        '/api/oauth/config'
    ];
    
    console.log('\n🔍 Checking critical routes:');
    criticalRoutes.forEach(route => {
        const found = routes.some(r => r.includes(route));
        console.log(`   ${found ? '✅' : '❌'} ${route}`);
    });
    
    console.log('\n✅ Route verification complete!');
    process.exit(0);
    
} catch (error) {
    console.error('❌ Error loading routes:', error.message);
    console.error(error.stack);
    process.exit(1);
}

