import mongoose from "mongoose";
export async function connectDB() {
  const mongoUri = process.env.MONGO_URI || process.env.MongoDBURI;
  if (!mongoUri) throw new Error("Missing required environment variable: MONGO_URI (or MongoDBURI)");
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
}
