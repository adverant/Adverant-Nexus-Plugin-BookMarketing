// @ts-nocheck
/**
import { Request, Response } from 'express';
 * Advertising Routes
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest, schemas } from '../middleware/validation';
import { AmazonAdsManager } from '../services/ads/AmazonAdsManager';
import { FacebookAdsManager } from '../services/ads/FacebookAdsManager';
import { BookBubAdsManager } from '../services/ads/BookBubAdsManager';

const router = Router();
const amazonAds = new AmazonAdsManager();
const facebookAds = new FacebookAdsManager();
const bookbubAds = new BookBubAdsManager();

/**
 * POST /marketing/api/ads/amazon
 * Create Amazon ad campaign
 */
router.post(
  '/amazon',
  validateRequest(schemas.createAdCampaign),
  asyncHandler(async (req: Request, res: Response) => {
    const { project_id, daily_budget, keywords } = req.body;

    const campaign = await amazonAds.createSponsoredProductCampaign({
      project_id,
      asin: 'B0XXXXXXXX', // TODO: Get from project
      daily_budget,
      keywords,
    });

    res.status(201).json({
      success: true,
      data: campaign,
    });
  })
);

/**
 * POST /marketing/api/ads/facebook
 * Create Facebook ad campaign
 */
router.post(
  '/facebook',
  asyncHandler(async (req: Request, res: Response) => {
    const campaign = await facebookAds.createCampaign(req.body);

    res.status(201).json({
      success: true,
      data: campaign,
    });
  })
);

/**
 * POST /marketing/api/ads/bookbub/featured-deal
 * Apply for BookBub Featured Deal
 */
router.post(
  '/bookbub/featured-deal',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await bookbubAds.applyForFeaturedDeal(req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /marketing/api/ads/:id/performance
 * Get ad campaign performance metrics
 */
router.get(
  '/:id/performance',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const performance = await amazonAds.getPerformance(id);

    res.json({
      success: true,
      data: performance,
    });
  })
);

export default router;
