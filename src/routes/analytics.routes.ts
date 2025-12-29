// @ts-nocheck
/**
import { Request, Response } from 'express';
 * Analytics & Reporting Routes
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { PerformanceTracker } from '../services/analytics/PerformanceTracker';

const router = Router();
const performanceTracker = new PerformanceTracker();

/**
 * GET /marketing/api/analytics/dashboard/:projectId
 * Get dashboard overview
 */
router.get(
  '/dashboard/:projectId',
  asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.params;

    const dashboard = await performanceTracker.getDashboardData(projectId);

    res.json({
      success: true,
      data: dashboard,
    });
  })
);

/**
 * POST /marketing/api/analytics/reports
 * Generate marketing report
 */
router.post(
  '/reports',
  asyncHandler(async (req: Request, res: Response) => {
    const { campaign_id, date_range } = req.body;

    const report = await performanceTracker.generateReport({
      campaign_id,
      date_range: {
        start: new Date(date_range.start),
        end: new Date(date_range.end),
      },
    });

    res.json({
      success: true,
      data: report,
    });
  })
);

/**
 * POST /marketing/api/analytics/sales
 * Track sale
 */
router.post(
  '/sales',
  asyncHandler(async (req: Request, res: Response) => {
    await performanceTracker.trackSale(req.body);

    res.json({
      success: true,
      message: 'Sale tracked successfully',
    });
  })
);

export default router;
