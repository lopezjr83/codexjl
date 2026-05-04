import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGO_URI', 'JWT_SECRET'];
required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Falta variable de entorno requerida: ${key}`);
  }
});

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  corsOriginList: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((item) => item.trim()),
  corsOriginSuffixList: (process.env.CORS_ORIGIN_SUFFIXES || '.vercel.app').split(',').map((item) => item.trim()).filter(Boolean),
  ownerAutocreate: process.env.OWNER_AUTOCREATE !== 'false',
  ownerSyncPassword: process.env.OWNER_SYNC_PASSWORD !== 'false',
  ownerPassword: process.env.OWNER_PASSWORD || null
};
