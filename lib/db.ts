import mongoose from "mongoose";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/shopfloor";
  if (!uri) {
    throw new Error("Please define MONGODB_URI in .env.local");
  }
  return uri;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

// Cache on global so serverless (e.g. Vercel) reuses the connection across warm invocations
if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoUri());
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
