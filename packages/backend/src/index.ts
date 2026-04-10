import 'dotenv/config';
import { app } from './app';
import { logger } from './utils/logger';
import { testConnection } from './models/db';

// ─── Required env vars ────────────────────────────────────────────────────────
const REQUIRED_ENV = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'ENCRYPTION_KEY',
];

function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[startup] Missing required environment variables: ${missing.join(', ')}`);
    console.error('[startup] Copy .env.example to .env and fill in all required values.');
    process.exit(1);
  }

  // Warn about blockchain/external services in production
  if (process.env.NODE_ENV === 'production') {
    const prodWarnings = [
      'SEPOLIA_RPC_URL',
      'PLATFORM_WALLET_PRIVATE_KEY',
      'IDENTITY_REGISTRY_ADDRESS',
      'RENTAL_REGISTRY_ADDRESS',
    ].filter((key) => !process.env[key] || process.env[key]?.startsWith('0x_'));
    if (prodWarnings.length > 0) {
      console.warn(`[startup] WARNING: blockchain env vars not set for production: ${prodWarnings.join(', ')}`);
    }
  }
}

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  validateEnv();

  // Verify DB connection before starting
  await testConnection();

  app.listen(PORT, () => {
    logger.info(`RentalChain API running on port ${PORT} [${process.env.NODE_ENV ?? 'development'}]`);
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`  → OTP mode: ${process.env.FAST2SMS_API_KEY ? 'Fast2SMS' : 'console (dev)'}`);
      logger.info(`  → IPFS mode: ${process.env.PINATA_API_KEY ? 'Pinata' : 'mock CIDs (dev)'}`);
      logger.info(`  → Blockchain: ${process.env.PLATFORM_WALLET_PRIVATE_KEY && !process.env.PLATFORM_WALLET_PRIVATE_KEY.startsWith('0x_') ? 'Sepolia' : 'disabled (no wallet)'}`);
    }
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
