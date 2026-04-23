import mongoose from 'mongoose';
import app from '../src/app.js';
import { env } from '../src/config/env.js';

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
  return app(req, res);
}
