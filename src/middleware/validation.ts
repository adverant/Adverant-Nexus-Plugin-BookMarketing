/**
 * Request Validation Middleware
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { MarketingError } from '../types';

export function validateRequest(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      throw new MarketingError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        details
      );
    }

    req.body = value;
    next();
  };
}

// Common validation schemas
export const schemas = {
  createCampaign: Joi.object({
    project_id: Joi.string().uuid().required(),
    campaign_type: Joi.string().valid('launch', 'ongoing', 'promotion').required(),
    budget: Joi.number().min(0).required(),
    channels: Joi.array()
      .items(Joi.string().valid('amazon_ads', 'facebook', 'bookbub', 'email', 'social'))
      .min(1)
      .required(),
    duration_days: Joi.number().integer().min(1).max(365).required(),
  }),

  createAdCampaign: Joi.object({
    project_id: Joi.string().uuid().required(),
    platform: Joi.string().valid('amazon', 'facebook', 'bookbub').required(),
    daily_budget: Joi.number().min(5).required(),
    keywords: Joi.array().items(Joi.string()).min(1),
  }),

  createEmailSequence: Joi.object({
    project_id: Joi.string().uuid().required(),
    author_name: Joi.string().required(),
    book_title: Joi.string().required(),
  }),
};
