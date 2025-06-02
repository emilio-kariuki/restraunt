// backend/src/server.ts - Fixed CORS and API configuration
import express, { Request, Response, Express } from "express";
import cors from "cors";
// import helmet from "helmet";
import dotenv from "dotenv";
import connectDB from "./config/database";
import logger from "./utils/logger";
// import {
//   generalLimiter,
//   authLimiter,
//   orderLimiter,
// } from "./middleware/rateLimiter";

// Import routes
import authRoutes from "./routes/auth";
import menuRoutes from "./routes/menu";
import orderRoutes from "./routes/order";
import restaurantRoutes from "./routes/restraunt";
import webhookRoutes from "./routes/webhooks";
import tableRoutes from "./routes/table";
import reviewsRoutes from "./routes/review";
import chatRoutes from './routes/chat';
import superadminRoutes from './routes/superadmin';
import serviceRoutes from './routes/service';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 6000;

// Connect to database
connectDB();

// Security middleware
// app.use(helmet({
//   crossOriginEmbedderPolicy: false,
//   contentSecurityPolicy: false,
// }));

// CORS configuration - Fixed to allow frontend
app.use(cors({
    origin: '*',
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allowedHeaders: "*",
    credentials: true
}));

// Rate limiting
// app.use(generalLimiter);

// Raw body for webhooks (BEFORE express.json)
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRoutes);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static("public"));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/services", serviceRoutes); // Add this line
app.use('/api/reviews', reviewsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/superadmin', superadminRoutes); // Add this line

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    database: "connected"
  });
});

// Test endpoint
app.get("/api/test", (req: Request, res: Response) => {
  res.json({
    message: "Backend is working!",
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
});

// 404 handler
app.use("*", (req: Request, res: Response) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Route not found" });
});

// Graceful shutdown
const shutdown = () => {
  logger.info("Shutting down gracefully...");
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📅 Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
  logger.info(`📊 API Health Check: http://localhost:${PORT}/api/health`);
});

// Handle server errors
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    logger.error('❌ Server error:', error);
  }
});

export default app;