import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import visitRoutes from './routes/visitRoutes.js';
import userRoutes from './routes/userRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import visitTypeConfigRoutes from './routes/visitTypeConfigRoutes.js';
import { errorHandler, notFound } from './middleware/error.js';

const app = express();

const allowedOrigins = new Set(env.corsOriginList.filter(Boolean));
const allowedOriginSuffixes = env.corsOriginSuffixList;

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.has('*') || allowedOrigins.has(origin)) return true;

  let hostname = '';
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return false;
  }

  if (allowedOriginSuffixes.some((suffix) => hostname.endsWith(suffix))) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true
};

app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(mongoSanitize());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 200 }));
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

app.get('/', (req, res) => res.json({ ok: true, service: 'backend' }));
app.get('/health', (req, res) => res.json({ ok: true, service: 'backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/visit-types', visitTypeConfigRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
