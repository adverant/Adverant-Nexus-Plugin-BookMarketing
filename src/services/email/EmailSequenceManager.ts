/**
 * Email Sequence Manager
 * Manages automated email sequences and reader nurturing
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
import { EmailSequence, EmailTemplate, MarketingError } from '../../types';
import db from '../../utils/database';
import logger from '../../utils/logger';

export class EmailSequenceManager {
  private mageAgentClient: AxiosInstance;

  constructor() {
    this.mageAgentClient = axios.create({
      baseURL: config.mageAgent.url,
      headers: {
        'Authorization': `Bearer ${config.mageAgent.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Create reader nurture sequence (5 emails)
   */
  async createReaderSequence(params: {
    project_id: string;
    author_name: string;
    book_title: string;
  }): Promise<EmailSequence> {
    try {
      // Generate AI-powered email content using MageAgent
      const emails = await this.generateEmailContent(params);

      // Create sequence in database
      const sequence = await db.insert<EmailSequence>('prose.crm_sequences', {
        sequence_name: `${params.book_title} - Reader Nurture`,
        sequence_type: 'nurture',
        trigger_event: 'book_purchased',
        email_count: emails.length,
        status: 'active',
      });

      // Create individual emails with delays
      const delays = [0, 3, 7, 14, 30]; // Days after trigger

      for (let i = 0; i < emails.length; i++) {
        await db.insert('prose.crm_sequence_emails', {
          sequence_id: sequence.id,
          email_number: i + 1,
          delay_days: delays[i],
          subject_line: emails[i].subject,
          email_body: emails[i].body,
        });
      }

      logger.info('Reader sequence created', {
        sequenceId: sequence.id,
        emails: emails.length,
      });

      return sequence;

    } catch (error: any) {
      logger.error('Failed to create reader sequence:', error);
      throw new MarketingError(
        'Failed to create email sequence',
        'SEQUENCE_CREATE_ERROR',
        500,
        { project_id: params.project_id, error: error.message }
      );
    }
  }

  /**
   * Generate email content using AI
   */
  private async generateEmailContent(params: {
    author_name: string;
    book_title: string;
  }): Promise<EmailTemplate[]> {
    try {
      const response = await this.mageAgentClient.post('/api/orchestrate', {
        task: 'generate reader nurture email sequence',
        context: {
          author_name: params.author_name,
          book_title: params.book_title,
          sequence_count: 5,
          emails: [
            {
              purpose: 'Thank reader, deliver bonus content',
              day: 0,
            },
            {
              purpose: 'Ask for honest review',
              day: 3,
            },
            {
              purpose: 'Recommend next book in series or similar',
              day: 7,
            },
            {
              purpose: 'Invite to reader community/Facebook group',
              day: 14,
            },
            {
              purpose: 'Early access to next release',
              day: 30,
            },
          ],
        },
        maxAgents: 5,
      });

      // Parse AI-generated emails
      const emails: EmailTemplate[] = response.data.result.emails || this.getDefaultEmails(params);

      return emails;

    } catch (error: any) {
      logger.warn('MageAgent unavailable, using default emails:', error.message);
      return this.getDefaultEmails(params);
    }
  }

  /**
   * Default email templates (fallback)
   */
  private getDefaultEmails(params: {
    author_name: string;
    book_title: string;
  }): EmailTemplate[] {
    return [
      {
        subject: `Thank you for reading ${params.book_title}!`,
        body: `
          <p>Hi there!</p>
          <p>Thank you so much for reading <strong>${params.book_title}</strong>! As a special thank you, I've prepared a bonus chapter that continues the story.</p>
          <p><a href="#">Download your bonus chapter here</a></p>
          <p>I hope you enjoyed the journey!</p>
          <p>Best,<br/>${params.author_name}</p>
        `,
      },
      {
        subject: `Quick favor? (It helps more than you know)`,
        body: `
          <p>Hi!</p>
          <p>I hope you enjoyed <strong>${params.book_title}</strong>! If you have a moment, would you consider leaving a quick review on Amazon?</p>
          <p>Reviews help readers like you discover books they'll love. Even a sentence or two makes a huge difference!</p>
          <p><a href="#">Leave a review on Amazon</a></p>
          <p>Thank you for your support!</p>
          <p>${params.author_name}</p>
        `,
      },
      {
        subject: `Loved ${params.book_title}? You'll love this next...`,
        body: `
          <p>Hi!</p>
          <p>If you loved <strong>${params.book_title}</strong>, I think you'll really enjoy my next book.</p>
          <p>It has the same [themes/characters/world] you loved, with even more [action/romance/mystery].</p>
          <p><a href="#">Check out the next book</a></p>
          <p>Happy reading!</p>
          <p>${params.author_name}</p>
        `,
      },
      {
        subject: `Join my reader community!`,
        body: `
          <p>Hi!</p>
          <p>I've created a special Facebook group for readers like you who love [genre].</p>
          <p>Inside, you'll get:</p>
          <ul>
            <li>Exclusive sneak peeks of upcoming books</li>
            <li>Behind-the-scenes content</li>
            <li>Chat with other fans</li>
            <li>Monthly giveaways</li>
          </ul>
          <p><a href="#">Join the reader community</a></p>
          <p>See you there!</p>
          <p>${params.author_name}</p>
        `,
      },
      {
        subject: `Early access: My next book is coming!`,
        body: `
          <p>Hi!</p>
          <p>I'm excited to share that my next book is almost ready!</p>
          <p>As one of my most loyal readers, you're getting first access to the cover reveal and the first chapter.</p>
          <p><a href="#">Get early access here</a></p>
          <p>You can also pre-order at a special discounted price (for readers only!).</p>
          <p>Thank you for being part of this journey!</p>
          <p>${params.author_name}</p>
        `,
      },
    ];
  }

  /**
   * Send single email
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    body: string;
  }): Promise<void> {
    // In production, integrate with Mailchimp or SendGrid
    logger.info('Email sent (simulated)', {
      to: params.to,
      subject: params.subject,
    });
  }

  /**
   * Track email performance
   */
  async trackEmailPerformance(emailId: string, event: 'open' | 'click' | 'conversion'): Promise<void> {
    try {
      const email = await db.queryOne(
        'SELECT * FROM prose.email_campaigns WHERE id = $1',
        [emailId]
      );

      if (!email) {
        return;
      }

      const updates: any = {};

      if (event === 'open') {
        updates.opens_count = (email.opens_count || 0) + 1;
      } else if (event === 'click') {
        updates.clicks_count = (email.clicks_count || 0) + 1;
      } else if (event === 'conversion') {
        updates.conversions_count = (email.conversions_count || 0) + 1;
      }

      await db.update('prose.email_campaigns', emailId, updates);

      logger.debug('Email performance tracked', { emailId, event });

    } catch (error: any) {
      logger.error('Failed to track email performance:', error);
    }
  }
}

export default EmailSequenceManager;
