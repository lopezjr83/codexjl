import mongoose from 'mongoose';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { ensureOwnerUser } from '../src/bootstrap/ensureOwnerUser.js';

// Disable Vercel's automatic body parser so Express handles it with the 5mb limit
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false
  }
};

const globalForMongoose = globalThis;

if (!globalForMongoose._mongooseCache) {
  globalForMongoose._mongooseCache = {
    conn: null,
    promise: null
  };
}

const cache = globalForMongoose._mongooseCache;

const connectDB = async () => {
  if (cache.conn || mongoose.connection.readyState === 1) {
    cache.conn = mongoose.connection;
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(env.mongoUri, {
      bufferCommands: false
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
};

export default async function handler(req, res) {
  await connectDB();
  await ensureOwnerUser();
  return app(req, res);
}
