import mongoose from 'mongoose';
import app from '../src/app.js';
import { env } from '../src/config/env.js';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(env.mongoUri);
  isConnected = true;
};

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
