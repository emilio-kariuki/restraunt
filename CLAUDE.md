# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a **restaurant QR ordering system** with a **Node.js/Express backend** and **Next.js 15 frontend**. The system enables QR code-based table ordering with comprehensive restaurant management features.

### Technology Stack
- **Backend**: Node.js 18+ with TypeScript, Express, MongoDB/Mongoose
- **Frontend**: Next.js 15 with App Router, React 19, TailwindCSS
- **Database**: MongoDB with well-defined schemas and indexes
- **Payments**: Stripe integration with webhooks
- **Communication**: Twilio SMS, OpenAI/Groq AI chat
- **Authentication**: JWT with role-based access control

### Key Components
- **Multi-role system**: superadmin, admin, staff, customer roles
- **QR table ordering**: Each table has a unique QR code for customer access
- **Real-time notifications**: SMS alerts for order status updates
- **AI assistance**: Context-aware restaurant chatbot
- **Payment processing**: Stripe payment intents with webhook confirmation
- **Bulk operations**: Excel/CSV menu upload/download functionality

## Development Commands

### Backend (`/backend/`)
```bash
npm run dev          # Development server with nodemon + ts-node
npm run build        # TypeScript compilation to dist/
npm run start        # Production server using ts-node
npm run seed         # Database seeding
npm run lint         # ESLint for TypeScript files
npm run clean        # Remove dist/ directory
```

### Frontend (`/frontend/`)
```bash
npm run dev          # Next.js development server with Turbopack
npm run build        # Production build
npm run start        # Production server
npm run lint         # Next.js linting
```

## Code Architecture Patterns

### Backend Structure
- **Routes** (`/src/routes/`): RESTful API endpoints organized by resource
- **Controllers** (`/src/controllers/`): Business logic with static methods
- **Models** (`/src/models/`): Mongoose schemas with comprehensive validation
- **Services** (`/src/services/`): External integrations (Stripe, Twilio, AI)
- **Middleware** (`/src/middleware/`): Auth, validation, rate limiting

### Frontend Structure
- **App Router** (`/app/`): File-based routing with dynamic segments
- **API Layer** (`/lib/api.ts`): Centralized Axios client with interceptors
- **Components** (`/components/`): Reusable UI components, admin-specific modules
- **Types** (`/types/`): TypeScript definitions

### Database Design
- **Embedded documents**: Tables within Restaurants, OrderItems within Orders
- **Reference patterns**: Cross-collection relationships with indexes
- **Calculated fields**: Order allergen summaries, performance optimization
- **Text indexes**: Menu item search optimization

### Authentication Flow
1. JWT tokens with role-based permissions
2. Middleware enforcement on protected routes
3. Frontend token management with automatic refresh
4. Multi-level access: superadmin → admin → staff → customer

### API Patterns
- Use the centralized API client (`/frontend/lib/api.ts`) for all HTTP requests
- Follow RESTful conventions: GET for retrieval, POST for creation, PUT for updates
- Comprehensive error handling with retry logic
- File upload/download support for bulk operations

## Key Business Logic

### Order Lifecycle
`pending` → `confirmed` → `preparing` → `ready` → `served` → `completed`

### Payment Flow
1. Create order → 2. Generate payment intent → 3. Stripe confirmation → 4. Webhook processing → 5. SMS notification

### Table System
- Each table has embedded QR codes in restaurant documents
- Customer access via `/table/[restaurantId]/[tableId]` routes
- Context-aware menu display and ordering

### Allergen Management
- Comprehensive allergen tracking in menu items
- Pre-calculated allergen summaries in orders for kitchen efficiency
- Special dietary request handling through service system

## Environment Requirements

### Backend Environment Variables
```env
PORT=5000
NODE_ENV=development|production
MONGODB_URI=mongodb://localhost:27017/restaurant-qr
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=sk_test_or_live_key
STRIPE_WEBHOOK_SECRET=whsec_webhook_secret
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
FRONTEND_URL=http://localhost:3000
```

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Stripe account with webhook endpoints configured
- Twilio account for SMS notifications

## Working with This Codebase

### When Adding New Features
1. Follow existing route patterns in `/backend/src/routes/`
2. Use the established controller pattern with static methods
3. Add proper TypeScript types following existing conventions
4. Implement proper error handling and logging
5. Use the centralized API service layer in frontend

### Database Operations
- Always use indexes for query optimization
- Follow existing schema patterns for consistency
- Use embedded documents for related data (tables, order items)
- Implement proper validation in Mongoose schemas

### Testing Payments
- Use Stripe test mode with test card numbers
- Webhook endpoint: `/api/webhooks/stripe`
- Payment flow testing via frontend checkout process

### Logging and Debugging
- Backend logs to `logs/combined.log` and `logs/error.log`
- Use Winston logger for consistent logging format
- Console output available in development mode