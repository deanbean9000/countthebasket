import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export async function testDbConnection() {
  try {
    // This looks for DATABASE_URL in your .env file
    const url = process.env.DATABASE_URL || "mongodb://localhost:27017/countthebasket";
    
    await mongoose.connect(url);
    console.log("✅ MongoDB Connection Successful!");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
  }
}