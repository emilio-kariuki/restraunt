import mongoose from "mongoose";
import logger from "../utils/logger";

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant-qr";

    await mongoose.connect(mongoURI, {
      dbName: "restaurant-qr",
    });

    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDB;
