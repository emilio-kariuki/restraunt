# Restaurant QR System Backend

A production-ready backend API for a restaurant QR code ordering system built with TypeScript, Express, MongoDB, and integrated with Stripe payments and Twilio SMS.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Menu Management**: CRUD operations for restaurant menus
- **Order Processing**: Complete order lifecycle from creation to fulfillment
- **Payment Integration**: Stripe payment processing with webhooks
- **SMS Notifications**: Twilio integration for order status updates
- **QR Code Generation**: Automatic QR code generation for tables
- **Rate Limiting**: Protection against abuse
- **Comprehensive Logging**: Winston-based logging system
- **Type Safety**: Full TypeScript implementation

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Stripe account
- Twilio account (optional for SMS)

### Installation

```bash
# Clone and install dependencies
git clone <repository>
cd restaurant-qr-backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual values

# Start development server
npm run dev

# Or start with ts-node directly
npm start
```

### Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/restaurant-qr
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Menu Management
- `GET /api/menu/:restaurantId` - Get restaurant menu (public)
- `POST /api/menu` - Create menu item (admin/staff)
- `PUT /api/menu/:id` - Update menu item (admin/staff)
- `DELETE /api/menu/:id` - Delete menu item (admin/staff)

### Orders
- `POST /api/orders/:restaurantId` - Create new order (public)
- `POST /api/orders/:orderId/payment-intent` - Create payment intent (public)
- `POST /api/orders/:orderId/confirm-payment` - Confirm payment (public)
- `GET /api/orders/:orderId` - Get order details (public)
- `GET /api/orders` - Get all orders (admin/staff)
- `PUT /api/orders/:orderId/status` - Update order status (admin/staff)

### Restaurant Management
- `POST /api/restaurants` - Create restaurant (admin)
- `GET /api/restaurants/my` - Get my restaurant (admin/staff)
- `PUT /api/restaurants/my` - Update restaurant (admin)
- `POST /api/restaurants/tables` - Add table (admin)
- `PUT /api/restaurants/tables/:tableId` - Update table (admin/staff)
- `GET /api/restaurants/tables/qr/:tableId` - Get table QR code (public)

### Webhooks
- `POST /api/webhooks/stripe` - Stripe payment webhooks

## Database Schema

### Users
- Email, password, role (admin/staff/customer)
- Restaurant association for staff

### Restaurants
- Basic info, tables, operating hours
- Owner relationship

### Menu Items
- Name, description, price, category
- Availability and allergen information

### Orders
- Items, total, payment status
- Customer information and special instructions
- Status tracking (pending → confirmed → preparing → ready → served)

### Tables
- Number, capacity, status
- Auto-generated QR codes

## Payment Flow

1. Customer creates order
2. Frontend calls `/api/orders/:orderId/payment-intent`
3. Customer enters payment details (Stripe Elements)
4. Frontend confirms payment
5. Stripe webhook updates order status
6. SMS notification sent when order ready

## Security Features

- **Rate Limiting**: Different limits for auth, orders, and general requests
- **Helmet**: Security headers
- **CORS**: Configured for frontend domain
- **JWT**: Secure token-based authentication
- **Input Validation**: Joi schema validation
- **Password Hashing**: bcrypt with salt rounds

## Deployment

### Production Setup

1. **Environment**: Set `NODE_ENV=production`
2. **Database**: Use MongoDB Atlas or secure MongoDB instance
3. **Secrets**: Use secure, randomly generated JWT secrets
4. **SSL**: Ensure HTTPS in production
5. **Monitoring**: Set up error tracking (Sentry, etc.)

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "run", "prod"]
```

## Development

```bash
# Development with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm run prod
```

## Logging

Logs are written to:
- `logs/error.log` - Error level logs
- `logs/combined.log` - All logs
- Console output in development

## Error Handling

- Comprehensive error logging
- Graceful error responses
- Webhook failure handling
- Database connection retry logic

This backend provides a solid foundation for a restaurant ordering system with room for additional features like analytics, inventory management, and advanced reporting.