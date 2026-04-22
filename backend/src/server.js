import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

const bootstrap = async () => {
  await connectDB(env.mongoUri);
  app.listen(env.port, () => {
    console.log(`🚀 API ejecutándose en http://localhost:${env.port}`);
  });
};

bootstrap().catch((error) => {
  console.error('Error iniciando servidor:', error);
  process.exit(1);
});
