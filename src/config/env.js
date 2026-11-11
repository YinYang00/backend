// Toata configuratia vine din variabile de mediu (vezi .env.example).
import 'dotenv/config';

const DEFAULT_PORT = 3000;
const DEFAULT_DB_PORT = 5432;

export const env = {
  port: Number(process.env.PORT ?? DEFAULT_PORT),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? DEFAULT_DB_PORT),
    name: process.env.DB_NAME ?? 'campus_sports_booking',
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
  },
};
