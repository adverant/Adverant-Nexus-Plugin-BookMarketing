/**
 * NexusCRM Integration Service
 * Syncs contacts, manages sequences, and tracks reader engagement
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { CRMContact, CRMSequence, EmailTemplate, MarketingError } from '../types';
import db from '../utils/database';
import logger from '../utils/logger';

export class CRMIntegration {
  private crmClient: AxiosInstance;
  private crmUrl: string;
  private apiKey: string;

  constructor() {
    this.crmUrl = config.nexusCRM.url;
    this.apiKey = config.nexusCRM.apiKey;

    this.crmClient = axios.create({
      baseURL: this.crmUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * Sync contact to NexusCRM
   */
  async syncContact(contact: {
    email: string;
    name: string;
    source: 'book_purchase' | 'email_signup' | 'social';
    project_id: string;
  }): Promise<CRMContact> {
    try {
      const nameParts = contact.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      // Sync to NexusCRM
      const response = await this.crmClient.post('/api/contacts', {
        email: contact.email,
        first_name: firstName,
        last_name: lastName,
        tags: [`reader_${contact.project_id}`, contact.source],
        custom_fields: {
          book_purchased: contact.project_id,
          purchase_date: new Date().toISOString(),
        },
      });

      // Store in local database
      const localContact = await db.insert<CRMContact>('prose.crm_contacts', {
        email: contact.email,
        first_name: firstName,
        last_name: lastName,
        source: contact.source,
        stage: contact.source === 'book_purchase' ? 'customer' : 'lead',
        genre_preferences: [],
        engagement_score: 0,
        lifetime_value_dollars: 0,
      });

      logger.info('Contact synced to CRM', { email: contact.email });
      return localContact;

    } catch (error: any) {
      logger.error('Failed to sync contact to CRM:', error);
      throw new MarketingError(
        'Failed to sync contact to CRM',
        'CRM_SYNC_ERROR',
        500,
        { email: contact.email, error: error.message }
      );
    }
  }

  /**
   * Create automated email sequence in NexusCRM
   */
  async createEmailSequence(params: {
    name: string;
    project_id: string;
    emails: EmailTemplate[];
  }): Promise<CRMSequence> {
    try {
      // Create sequence in NexusCRM
      const response = await this.crmClient.post('/api/sequences', {
        name: params.name,
        emails: params.emails.map((email, i) => ({
          subject: email.subject,
          body: email.body,
          delay_days: i * 3, // 3 days between emails
        })),
      });

      // Store in local database
      const sequence = await db.insert<CRMSequence>('prose.crm_sequences', {
        sequence_name: params.name,
        sequence_type: 'nurture',
        trigger_event: 'contact_created',
        email_count: params.emails.length,
        status: 'active',
      });

      // Store individual emails
      for (let i = 0; i < params.emails.length; i++) {
        await db.insert('prose.crm_sequence_emails', {
          sequence_id: sequence.id,
          email_number: i + 1,
          delay_days: i * 3,
          subject_line: params.emails[i].subject,
          email_body: params.emails[i].body,
        });
      }

      logger.info('Email sequence created', { name: params.name, emails: params.emails.length });
      return sequence;

    } catch (error: any) {
      logger.error('Failed to create email sequence:', error);
      throw new MarketingError(
        'Failed to create email sequence',
        'SEQUENCE_CREATE_ERROR',
        500,
        { name: params.name, error: error.message }
      );
    }
  }

  /**
   * Enroll contact in sequence
   */
  async enrollContactInSequence(
    contactId: string,
    sequenceId: string
  ): Promise<void> {
    try {
      await db.insert('prose.crm_contact_sequences', {
        contact_id: contactId,
        sequence_id: sequenceId,
        current_email_number: 0,
        paused: false,
      });

      logger.info('Contact enrolled in sequence', { contactId, sequenceId });
    } catch (error: any) {
      logger.error('Failed to enroll contact in sequence:', error);
      throw new MarketingError(
        'Failed to enroll contact in sequence',
        'ENROLLMENT_ERROR',
        500,
        { contactId, sequenceId, error: error.message }
      );
    }
  }

  /**
   * Update contact engagement score
   */
  async updateEngagementScore(
    contactId: string,
    activity: 'email_open' | 'email_click' | 'purchase' | 'review'
  ): Promise<void> {
    const scoreIncrements = {
      email_open: 5,
      email_click: 10,
      purchase: 50,
      review: 25,
    };

    try {
      const contact = await db.queryOne<CRMContact>(
        'SELECT * FROM prose.crm_contacts WHERE id = $1',
        [contactId]
      );

      if (!contact) {
        throw new Error('Contact not found');
      }

      const newScore = Math.min(
        100,
        contact.engagement_score + scoreIncrements[activity]
      );

      await db.update('prose.crm_contacts', contactId, {
        engagement_score: newScore,
      });

      logger.debug('Engagement score updated', { contactId, activity, newScore });
    } catch (error: any) {
      logger.error('Failed to update engagement score:', error);
    }
  }

  /**
   * Get contact lifecycle stage statistics
   */
  async getLifecycleStats(projectId: string): Promise<{
    leads: number;
    prospects: number;
    customers: number;
    advocates: number;
  }> {
    const stats = await db.query<{ stage: string; count: string }>(
      `SELECT stage, COUNT(*) as count
       FROM prose.crm_contacts
       GROUP BY stage`
    );

    return {
      leads: parseInt(stats.find(s => s.stage === 'lead')?.count || '0'),
      prospects: parseInt(stats.find(s => s.stage === 'prospect')?.count || '0'),
      customers: parseInt(stats.find(s => s.stage === 'customer')?.count || '0'),
      advocates: parseInt(stats.find(s => s.stage === 'advocate')?.count || '0'),
    };
  }

  /**
   * Segment contacts by engagement
   */
  async segmentByEngagement(): Promise<{
    high: CRMContact[];
    medium: CRMContact[];
    low: CRMContact[];
  }> {
    const high = await db.query<CRMContact>(
      'SELECT * FROM prose.crm_contacts WHERE engagement_score >= 70 ORDER BY engagement_score DESC'
    );

    const medium = await db.query<CRMContact>(
      'SELECT * FROM prose.crm_contacts WHERE engagement_score >= 30 AND engagement_score < 70'
    );

    const low = await db.query<CRMContact>(
      'SELECT * FROM prose.crm_contacts WHERE engagement_score < 30'
    );

    return { high, medium, low };
  }
}

export default CRMIntegration;
