# Altayar Backend (Node.js / Express)

Backend API for Altayar tourism app. Built with Express, PostgreSQL (Knex + Objection), JWT auth, and Socket.IO.

## Requirements
- Node.js 20+
- PostgreSQL 12+

## Quick Setup
1) Copy the environment file:
```
copy env.example .env
```
Edit the database values, `JWT_SECRET`, and `FRONTEND_URL` (use your Flutter app's public/local address).

2) Install dependencies:
```
npm install
```

3) Create the database and run migrations + seed:
```
npx knex migrate:latest
npm run seed
```

4) Start the server:
```
npm run dev
```
The service runs by default on `http://localhost:5000/api`.

## Test Endpoints
- Health: `GET /api/health`
- Auth: `POST /api/auth/login`
- Packages: `GET /api/packages`

## Frontend Integration (Flutter)
- The default value in `lib/core/config/app_config.dart` is `http://localhost:5000/api`.
- On a physical device, use the host machine's IP: e.g., `http://192.168.1.4:5000/api`.
- You can change it by running Flutter with:
```
flutter run --dart-define=API_BASE_URL=http://<host>:5000/api
```
- WebSockets use the same origin (`/socket.io`) and just need the JWT token in `auth.token`.

## Useful Scripts
- `npm run migrate:latest` / `npm run migrate:rollback`
- `npm run seed:database` to repopulate test data
- `node scripts/createAdminUser.js` to quickly create an admin

## Notes
- Output folders like `uploads/` and `memberships/` are ignored in Git.
- Before deployment, make sure to open port 5000 for mobile access, or update `API_BASE_URL` with the public value.
