# Altayar Backend Deployment Guide

## Overview
This guide covers deploying the Altayar backend and setting up web/mobile integration with Firebase Dynamic Links.

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database
- Firebase project with Dynamic Links enabled
- Domain name (for production)

## Step 1: Environment Setup

1. Copy `env.example` to `.env`:
```bash
cp env.example .env
```

2. Configure environment variables in `.env`:
```env
# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=tourist_app_db

# JWT
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key

# Server
PORT=5000
NODE_ENV=production

# Frontend
FRONTEND_URL=https://altayar.com

# Firebase Dynamic Links
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_DYNAMIC_LINKS_DOMAIN=altayar.page.link
DEEP_LINK_BASE_URL=https://altayar.com
LANDING_PAGE_URL=https://altayar.com
ANDROID_PACKAGE_NAME=com.example.Altayar
IOS_BUNDLE_ID=com.example.Altayar
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Database Setup

```bash
# Run migrations
npm run migrate:latest

# (Optional) Seed database
npm run seed:database
```

## Step 4: Start Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

Or use PM2:
```bash
pm2 start server.js --name altayar-backend
```

## Step 5: Firebase Dynamic Links Setup

See [FIREBASE_DYNAMIC_LINKS_SETUP.md](./FIREBASE_DYNAMIC_LINKS_SETUP.md) for detailed instructions.

## Step 6: Web Deployment

### Backend Deployment

1. **Heroku**:
```bash
heroku create altayar-backend
git push heroku main
```

2. **DigitalOcean App Platform**:
   - Connect GitHub repository
   - Set environment variables
   - Deploy automatically

3. **AWS/EC2**:
   - Set up EC2 instance
   - Install Node.js and PostgreSQL
   - Use PM2 or systemd to run server
   - Configure Nginx as reverse proxy

### Frontend (Flutter Web) Deployment

See [WEB_DEPLOYMENT.md](../AltayarFlutter/Altayar/WEB_DEPLOYMENT.md) in the Flutter project.

## API Endpoints

### Deep Links
- `GET /api/deep-links/config` - Get deep link configuration
- `POST /api/deep-links/create` - Create a deep link
- `POST /api/deep-links/share` - Create a shareable link with metadata

### Health Check
- `GET /api/health` - Server health check

## Testing

1. Test backend:
```bash
curl http://localhost:5000/api/health
```

2. Test deep links:
```bash
curl -X POST http://localhost:5000/api/deep-links/share \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "type": "package",
    "id": "123",
    "title": "Test Package"
  }'
```

## Security Checklist

- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS in production
- [ ] Set up CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting in production
- [ ] Set up firewall rules
- [ ] Regular security updates

## Monitoring

- Set up logging (Winston, Morgan)
- Use monitoring service (Sentry, New Relic)
- Set up health check monitoring
- Monitor database performance

## Troubleshooting

1. **Server won't start**: Check database connection and environment variables
2. **Dynamic Links not working**: Verify Firebase API key and domain
3. **CORS errors**: Check FRONTEND_URL configuration
4. **Database errors**: Verify database credentials and migrations

## Support

For issues, check:
- [Firebase Dynamic Links Setup](./FIREBASE_DYNAMIC_LINKS_SETUP.md)
- [README.md](./README.md)
- GitHub Issues: https://github.com/OmarAhmed-123/Altayar/issues

