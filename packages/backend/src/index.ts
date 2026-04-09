import 'dotenv/config';
import { app } from './app';
import { logger } from './utils/logger';
import { testConnection } from './models/db';

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  // Verify DB connection before starting
  await testConnection();

  app.listen(PORT, () => {
    logger.info(`RentalChain API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
