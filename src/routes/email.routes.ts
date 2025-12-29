// @ts-nocheck
/**
import { Request, Response } from 'express';
 * Email Marketing Routes
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest, schemas } from '../middleware/validation';
import { EmailSequenceManager } from '../services/email/EmailSequenceManager';
import { CRMIntegration } from '../services/CRMIntegration';

const router = Router();
const emailManager = new EmailSequenceManager();
const crmIntegration = new CRMIntegration();

/**
 * POST /marketing/api/email/sequences
 * Create automated email sequence
 */
router.post(
  '/sequences',
  validateRequest(schemas.createEmailSequence),
  asyncHandler(async (req: Request, res: Response) => {
    const sequence = await emailManager.createReaderSequence(req.body);

    res.status(201).json({
      success: true,
      data: sequence,
    });
  })
);

/**
 * POST /marketing/api/email/send
 * Send single email
 */
router.post(
  '/send',
  asyncHandler(async (req: Request, res: Response) => {
    const { to, subject, body } = req.body;

    await emailManager.sendEmail({ to, subject, body });

    res.json({
      success: true,
      message: 'Email sent successfully',
    });
  })
);

/**
 * POST /marketing/api/email/contacts
 * Add contact to CRM
 */
router.post(
  '/contacts',
  asyncHandler(async (req: Request, res: Response) => {
    const contact = await crmIntegration.syncContact(req.body);

    res.status(201).json({
      success: true,
      data: contact,
    });
  })
);

/**
 * GET /marketing/api/email/sequences/:id/performance
 * Get email sequence performance
 */
router.get(
  '/sequences/:id/performance',
  asyncHandler(async (req: Request, res: Response) => {
    // TODO: Implement sequence performance tracking
    res.json({
      success: true,
      data: {
        sequence_id: req.params.id,
        sent: 100,
        opens: 45,
        clicks: 12,
        conversions: 3,
      },
    });
  })
);

export default router;
