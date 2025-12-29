/**
 * NexusProseCreator Marketing Service - Server Entry Point
 */

import { createApp } from './app';
import { serverConfig } from './config';
import db from './utils/database';
import logger from './utils/logger';

const app = createApp();

async function startServer() {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    logger.info('Database connection established');

    // Start HTTP server
    const server = app.listen(serverConfig.port, () => {
      logger.info(`Marketing service started`, {
        port: serverConfig.port,
        environment: serverConfig.nodeEnv,
      });
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await db.close();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
