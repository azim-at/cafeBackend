# Cafe Backend

Backend API for a cafe ordering system. Built with Express, Prisma (MongoDB), and JWT auth.

## Features
- JWT auth (register/login/logout)
- Menu categories and items (owner‑only writes)
- Orders (auth + guest flows)
- Favorites
- Rewards (points + transactions)
- Postman collection included

## Requirements
- Node.js 18+ (recommended)
- MongoDB database (Atlas or local)

## Setup
```bash
npm install
```

### Environment
Create `.env` in the project root:
```env
DATABASE_URL="mongodb+srv://user:pass@host/dbname"
JWT_SECRET="your-strong-secret"
JWT_EXPIRES_IN="7d"
PORT=5000
```

## Scripts
```bash
npm run dev        # start dev server (ts-node-dev)
npm run build      # compile TypeScript
npm run start      # run compiled server
npm run db:generate
npm run db:push
npm run db:studio
npm run db:seed
```

> Prisma CLI uses `prisma/schema.runtime.prisma` so `prisma/schema.prisma` remains untouched.

## Running
```bash
npm run dev
```
Base URL: `http://localhost:5000/api`

Health: `GET /api/health`

## Auth
Auth responses return `{ user, token }`. Send the token on protected routes:

```
Authorization: Bearer <token>
```

### Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

## Menu
- `GET /api/menu/categories`
- `POST /api/menu/categories` (owner)
- `PUT /api/menu/categories/:id` (owner)
- `DELETE /api/menu/categories/:id` (owner)
- `GET /api/menu/items`
- `GET /api/menu/items/:id`
- `POST /api/menu/items` (owner)
- `PUT /api/menu/items/:id` (owner)
- `DELETE /api/menu/items/:id` (owner)

## Orders
- `POST /api/orders` (auth)
- `POST /api/orders/guest`
- `GET /api/orders` (auth)
- `GET /api/orders/:id` (auth)
- `PATCH /api/orders/:id/status` (owner)
- `POST /api/orders/:id/guest-token` (auth)
- `GET /api/orders/guest/:token`

## Favorites
- `GET /api/favorites` (auth)
- `POST /api/favorites` (auth)
- `DELETE /api/favorites/:menuItemId` (auth)

## Rewards
- `GET /api/rewards/account` (auth)
- `GET /api/rewards/transactions` (auth)
- `POST /api/rewards/transactions` (owner)

## Seeding
Seed script adds sample users, menu, favorites, rewards, and orders.

```bash
SEED_ALLOW=true npm run db:seed
```

Optional overrides:
```env
SEED_OWNER_EMAIL=owner@cafe.local
SEED_OWNER_PASSWORD=OwnerPass123!
SEED_OWNER_NAME="Cafe Owner"
SEED_CUSTOMER_EMAIL=customer@cafe.local
SEED_CUSTOMER_PASSWORD=Customer123!
SEED_CUSTOMER_NAME="Cafe Customer"
SEED_GUEST_EMAIL=guest@cafe.local
```

## Postman
Import:
```
postman/cafeBackend.postman_collection.json
```
Collection variables include `baseUrl`, `token`, and sample IDs.

## Project Structure
```
src/
  config/        # Prisma client
  controllers/   # Request handlers
  middleware/    # Auth guards
  routes/        # API routes
  services/      # DB/business logic
  types/         # Shared types
  utils/         # Helpers (parsers, errors)
```

## Notes
- Prices are stored as integer cents.
- Roles: `owner`, `customer`.
