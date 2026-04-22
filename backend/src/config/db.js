import mongoose from 'mongoose';

export const connectDB = async (mongoUri) => {
  await mongoose.connect(mongoUri);
  console.log('✅ MongoDB conectada');
};
