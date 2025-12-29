/**
 * Express Application Configuration
 */

import express, { Application } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { usageTrackingMiddleware } from './middleware/usage-tracking';
import logger from './utils/logger';

// Import routes
import campaignsRoutes from './routes/campaigns.routes';
import adsRoutes from './routes/ads.routes';
import emailRoutes from './routes/email.routes';
import socialRoutes from './routes/social.routes';
import analyticsRoutes from './routes/analytics.routes';

export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Usage tracking middleware (before routes)
  app.use(usageTrackingMiddleware);

  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      query: req.query,
      body: req.body,
    });
    next();
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'nexus-prosecreator-marketing',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/marketing/api/campaigns', campaignsRoutes);
  app.use('/marketing/api/ads', adsRoutes);
  app.use('/marketing/api/email', emailRoutes);
  app.use('/marketing/api/social', socialRoutes);
  app.use('/marketing/api/analytics', analyticsRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
      },
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

export default createApp;
