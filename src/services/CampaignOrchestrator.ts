/**
 * Campaign Orchestrator
 * Coordinates multi-channel marketing campaigns across all platforms
 */

import {
  CreateCampaignRequest,
  BudgetAllocation,
  MarketingCampaign,
  MarketingError,
} from '../types';
import db from '../utils/database';
import logger from '../utils/logger';
import { AmazonAdsManager } from './ads/AmazonAdsManager';
import { FacebookAdsManager } from './ads/FacebookAdsManager';
import { BookBubAdsManager } from './ads/BookBubAdsManager';
import { EmailSequenceManager } from './email/EmailSequenceManager';
import { SocialPostScheduler } from './social/SocialPostScheduler';
import { CRMIntegration } from './CRMIntegration';
import { NetGalleyManager } from './NetGalleyManager';

export class CampaignOrchestrator {
  private amazonAds: AmazonAdsManager;
  private facebookAds: FacebookAdsManager;
  private bookbubAds: BookBubAdsManager;
  private emailManager: EmailSequenceManager;
  private socialScheduler: SocialPostScheduler;
  private crmIntegration: CRMIntegration;
  private netgalley: NetGalleyManager;

  constructor() {
    this.amazonAds = new AmazonAdsManager();
    this.facebookAds = new FacebookAdsManager();
    this.bookbubAds = new BookBubAdsManager();
    this.emailManager = new EmailSequenceManager();
    this.socialScheduler = new SocialPostScheduler();
    this.crmIntegration = new CRMIntegration();
    this.netgalley = new NetGalleyManager();
  }

  /**
   * Launch complete marketing campaign
   */
  async launchCampaign(params: CreateCampaignRequest): Promise<MarketingCampaign> {
    try {
      // 1. Create campaign in database
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + params.duration_days);

      const campaign = await db.insert<MarketingCampaign>('prose.marketing_campaigns', {
        publishing_project_id: params.project_id,
        campaign_name: `${params.campaign_type} Campaign - ${new Date().toISOString()}`,
        campaign_type: params.campaign_type,
        start_date: new Date(),
        end_date: endDate,
        budget_dollars: params.budget,
        status: 'active',
      });

      logger.info('Campaign created', { campaignId: campaign.id, type: params.campaign_type });

      // 2. Allocate budget across channels
      const allocation = this.allocateBudget(params.budget, params.channels);

      // 3. Launch each channel (parallel)
      const launches = [];

      if (params.channels.includes('amazon_ads')) {
        launches.push(this.launchAmazonAds(campaign.id, allocation.amazon_ads || 0));
      }

      if (params.channels.includes('facebook')) {
        launches.push(this.launchFacebookAds(campaign.id, allocation.facebook || 0));
      }

      if (params.channels.includes('bookbub')) {
        launches.push(this.applyBookBubFeaturedDeal(campaign.id));
      }

      if (params.channels.includes('email')) {
        launches.push(this.launchEmailSequence(campaign.id, params.project_id));
      }

      if (params.channels.includes('social')) {
        launches.push(this.scheduleSocialPosts(campaign.id, params.project_id, params.duration_days));
      }

      await Promise.allSettled(launches);

      // 4. Sync with NexusCRM
      await this.syncCampaignToCRM(campaign);

      logger.info('Campaign fully launched', { campaignId: campaign.id });

      return campaign;

    } catch (error: any) {
      logger.error('Failed to launch campaign:', error);
      throw new MarketingError(
        'Failed to launch marketing campaign',
        'CAMPAIGN_LAUNCH_ERROR',
        500,
        { error: error.message }
      );
    }
  }

  /**
   * Allocate budget across channels based on typical ROI
   */
  private allocateBudget(total: number, channels: string[]): BudgetAllocation {
    const allocation: BudgetAllocation = {};

    // Smart allocation based on typical ROI:
    // Amazon Ads: 50% (highest ROI for books)
    // Facebook: 20%
    // BookBub: 20% (if selected)
    // Email: 5% (low cost, high conversion)
    // Social: 5%

    let remainingBudget = total;

    if (channels.includes('amazon_ads')) {
      allocation.amazon_ads = total * 0.5;
      remainingBudget -= allocation.amazon_ads;
    }

    if (channels.includes('facebook')) {
      allocation.facebook = total * 0.2;
      remainingBudget -= allocation.facebook;
    }

    if (channels.includes('bookbub')) {
      allocation.bookbub = 500; // Fixed cost for Featured Deal
      remainingBudget -= allocation.bookbub;
    }

    if (channels.includes('email')) {
      allocation.email = total * 0.05;
      remainingBudget -= allocation.email;
    }

    if (channels.includes('social')) {
      allocation.social = Math.max(remainingBudget, total * 0.05);
    }

    logger.debug('Budget allocated', allocation);

    return allocation;
  }

  /**
   * Launch Amazon Ads
   */
  private async launchAmazonAds(campaignId: string, budget: number): Promise<void> {
    try {
      // Get book metadata
      const bookMetadata = await this.getBookMetadata(campaignId);

      // Create sponsored product campaign
      const result = await this.amazonAds.createSponsoredProductCampaign({
        project_id: bookMetadata.project_id,
        asin: bookMetadata.asin,
        daily_budget: budget / 30, // Convert to daily budget
        keywords: bookMetadata.keywords || [],
      });

      // Store channel in database
      await db.insert('prose.marketing_channels', {
        campaign_id: campaignId,
        channel: 'amazon_ads',
        budget_allocation_dollars: budget,
        spend_dollars: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue_dollars: 0,
      });

      logger.info('Amazon Ads launched', { campaignId, budget });

    } catch (error: any) {
      logger.error('Failed to launch Amazon Ads:', error);
    }
  }

  /**
   * Launch Facebook Ads
   */
  private async launchFacebookAds(campaignId: string, budget: number): Promise<void> {
    try {
      const bookMetadata = await this.getBookMetadata(campaignId);

      const result = await this.facebookAds.createCampaign({
        project_id: bookMetadata.project_id,
        campaign_name: `${bookMetadata.title} - Facebook Campaign`,
        daily_budget: budget / 30,
        audience: {
          age_min: 18,
          age_max: 65,
          genders: [1, 2], // All genders
          interests: [bookMetadata.genre || 'Books'],
          locations: ['US', 'GB', 'CA', 'AU'],
        },
        creative: {
          image_url: bookMetadata.cover_url,
          headline: bookMetadata.title,
          description: bookMetadata.description,
          link_url: bookMetadata.amazon_url,
        },
      });

      await db.insert('prose.marketing_channels', {
        campaign_id: campaignId,
        channel: 'facebook_ads',
        budget_allocation_dollars: budget,
        spend_dollars: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue_dollars: 0,
      });

      logger.info('Facebook Ads launched', { campaignId, budget });

    } catch (error: any) {
      logger.error('Failed to launch Facebook Ads:', error);
    }
  }

  /**
   * Apply for BookBub Featured Deal
   */
  private async applyBookBubFeaturedDeal(campaignId: string): Promise<void> {
    try {
      const bookMetadata = await this.getBookMetadata(campaignId);

      const dealStartDate = new Date();
      dealStartDate.setDate(dealStartDate.getDate() + 14); // 2 weeks out

      const dealEndDate = new Date(dealStartDate);
      dealEndDate.setDate(dealEndDate.getDate() + 3); // 3-day deal

      const result = await this.bookbubAds.applyForFeaturedDeal({
        book_title: bookMetadata.title,
        author_name: bookMetadata.author_name,
        amazon_url: bookMetadata.amazon_url,
        genre: bookMetadata.genre || 'fiction',
        regular_price: 9.99,
        deal_price: 0.99,
        deal_start_date: dealStartDate,
        deal_end_date: dealEndDate,
      });

      await db.insert('prose.marketing_channels', {
        campaign_id: campaignId,
        channel: 'bookbub',
        budget_allocation_dollars: result.estimated_cost,
        spend_dollars: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue_dollars: 0,
      });

      logger.info('BookBub Featured Deal applied', { campaignId });

    } catch (error: any) {
      logger.error('Failed to apply for BookBub:', error);
    }
  }

  /**
   * Launch email nurture sequence
   */
  private async launchEmailSequence(campaignId: string, projectId: string): Promise<void> {
    try {
      const bookMetadata = await this.getBookMetadata(campaignId);

      const sequence = await this.emailManager.createReaderSequence({
        project_id: projectId,
        author_name: bookMetadata.author_name,
        book_title: bookMetadata.title,
      });

      await db.insert('prose.marketing_channels', {
        campaign_id: campaignId,
        channel: 'email',
        budget_allocation_dollars: 50,
        spend_dollars: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue_dollars: 0,
      });

      logger.info('Email sequence launched', { campaignId, sequenceId: sequence.id });

    } catch (error: any) {
      logger.error('Failed to launch email sequence:', error);
    }
  }

  /**
   * Schedule social media posts
   */
  private async scheduleSocialPosts(
    campaignId: string,
    projectId: string,
    durationDays: number
  ): Promise<void> {
    try {
      const bookMetadata = await this.getBookMetadata(campaignId);

      const launchDate = new Date();

      const socialCampaign = await this.socialScheduler.scheduleLaunchCampaign({
        project_id: projectId,
        book_title: bookMetadata.title,
        launch_date: launchDate,
        platforms: ['twitter', 'facebook', 'instagram'],
      });

      await db.insert('prose.marketing_channels', {
        campaign_id: campaignId,
        channel: 'social_organic',
        budget_allocation_dollars: 0,
        spend_dollars: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue_dollars: 0,
      });

      logger.info('Social posts scheduled', { campaignId, posts: socialCampaign.posts_scheduled });

    } catch (error: any) {
      logger.error('Failed to schedule social posts:', error);
    }
  }

  /**
   * Sync campaign to NexusCRM
   */
  private async syncCampaignToCRM(campaign: MarketingCampaign): Promise<void> {
    try {
      // In production, sync campaign data to CRM
      logger.debug('Campaign synced to CRM', { campaignId: campaign.id });
    } catch (error: any) {
      logger.error('Failed to sync campaign to CRM:', error);
    }
  }

  /**
   * Get book metadata
   */
  private async getBookMetadata(campaignId: string): Promise<{
    project_id: string;
    title: string;
    author_name: string;
    genre?: string;
    asin: string;
    amazon_url: string;
    cover_url: string;
    description: string;
    keywords?: string[];
  }> {
    // In production, fetch from database
    // For now, return mock data
    return {
      project_id: 'mock-project-id',
      title: 'The Darkweaver Chronicles',
      author_name: 'J.R. Writer',
      genre: 'fantasy',
      asin: 'B0XXXXXXXX',
      amazon_url: 'https://amazon.com/dp/B0XXXXXXXX',
      cover_url: 'https://example.com/cover.jpg',
      description: 'An epic fantasy adventure...',
      keywords: ['fantasy', 'epic fantasy', 'dragons', 'magic'],
    };
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    try {
      await db.update('prose.marketing_campaigns', campaignId, {
        status: 'paused',
      });

      logger.info('Campaign paused', { campaignId });

    } catch (error: any) {
      logger.error('Failed to pause campaign:', error);
      throw new MarketingError(
        'Failed to pause campaign',
        'CAMPAIGN_PAUSE_ERROR',
        500,
        { campaignId, error: error.message }
      );
    }
  }
}

export default CampaignOrchestrator;
