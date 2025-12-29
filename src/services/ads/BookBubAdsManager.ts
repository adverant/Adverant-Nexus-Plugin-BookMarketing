/**
 * BookBub Ads Manager
 * Manages BookBub Featured Deals and BookBub Ads campaigns
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
import { MarketingError } from '../../types';
import logger from '../../utils/logger';

export class BookBubAdsManager {
  private bookbubClient: AxiosInstance;
  private bookbubUrl = 'https://api.bookbub.com/api/v1';
  private apiKey: string;
  private publisherId: string;

  constructor() {
    this.apiKey = config.bookbub.apiKey;
    this.publisherId = config.bookbub.publisherId;

    this.bookbubClient = axios.create({
      baseURL: this.bookbubUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  /**
   * Apply for BookBub Featured Deal
   */
  async applyForFeaturedDeal(params: {
    book_title: string;
    author_name: string;
    amazon_url: string;
    genre: string;
    regular_price: number;
    deal_price: number;
    deal_start_date: Date;
    deal_end_date: Date;
  }): Promise<{
    application_id: string;
    estimated_cost: number;
    estimated_reach: number;
  }> {
    try {
      // BookBub Featured Deal application
      const response = await this.bookbubClient.post('/featured_deals/applications', {
        publisher_id: this.publisherId,
        book: {
          title: params.book_title,
          author: params.author_name,
          genre: params.genre,
          amazon_url: params.amazon_url,
        },
        pricing: {
          regular_price: params.regular_price,
          deal_price: params.deal_price,
        },
        schedule: {
          start_date: params.deal_start_date.toISOString().split('T')[0],
          end_date: params.deal_end_date.toISOString().split('T')[0],
        },
      });

      const applicationId = response.data.id;
      const estimatedCost = this.calculateFeaturedDealCost(params.genre);
      const estimatedReach = this.calculateEstimatedReach(params.genre);

      logger.info('BookBub Featured Deal application submitted', {
        applicationId,
        genre: params.genre,
      });

      return {
        application_id: applicationId,
        estimated_cost: estimatedCost,
        estimated_reach: estimatedReach,
      };

    } catch (error: any) {
      logger.error('Failed to apply for BookBub Featured Deal:', error);
      throw new MarketingError(
        'Failed to apply for BookBub Featured Deal',
        'BOOKBUB_APPLICATION_ERROR',
        500,
        { error: error.message }
      );
    }
  }

  /**
   * Create BookBub Ads campaign
   */
  async createAdsCampaign(params: {
    campaign_name: string;
    book_title: string;
    amazon_url: string;
    genre: string;
    daily_budget: number;
    target_cpc: number;
  }): Promise<{
    campaign_id: string;
    estimated_impressions: number;
  }> {
    try {
      const response = await this.bookbubClient.post('/ads/campaigns', {
        name: params.campaign_name,
        book: {
          title: params.book_title,
          url: params.amazon_url,
        },
        targeting: {
          genres: [params.genre],
        },
        budget: {
          daily_budget: params.daily_budget,
          cpc_bid: params.target_cpc,
        },
        status: 'active',
      });

      const campaignId = response.data.id;
      const estimatedImpressions = Math.round(
        (params.daily_budget / params.target_cpc) * 0.005 // 0.5% CTR
      );

      logger.info('BookBub Ads campaign created', {
        campaignId,
        estimatedImpressions,
      });

      return {
        campaign_id: campaignId,
        estimated_impressions: estimatedImpressions,
      };

    } catch (error: any) {
      logger.error('Failed to create BookBub Ads campaign:', error);
      throw new MarketingError(
        'Failed to create BookBub Ads campaign',
        'BOOKBUB_ADS_ERROR',
        500,
        { error: error.message }
      );
    }
  }

  /**
   * Get campaign performance
   */
  async getCampaignPerformance(campaignId: string): Promise<{
    impressions: number;
    clicks: number;
    spend: number;
    sales: number;
    ctr: number;
    cpc: number;
  }> {
    try {
      const response = await this.bookbubClient.get(`/ads/campaigns/${campaignId}/stats`);

      const data = response.data;

      return {
        impressions: data.impressions || 0,
        clicks: data.clicks || 0,
        spend: data.spend || 0,
        sales: data.conversions || 0,
        ctr: data.ctr || 0,
        cpc: data.cpc || 0,
      };

    } catch (error: any) {
      logger.error('Failed to get BookBub campaign performance:', error);
      throw new MarketingError(
        'Failed to fetch campaign performance',
        'PERFORMANCE_ERROR',
        500,
        { campaignId, error: error.message }
      );
    }
  }

  /**
   * Calculate Featured Deal cost based on genre
   */
  private calculateFeaturedDealCost(genre: string): number {
    const genreCosts: Record<string, number> = {
      'romance': 500,
      'mystery': 650,
      'thriller': 700,
      'fantasy': 600,
      'science_fiction': 550,
      'contemporary': 500,
      'young_adult': 600,
      'literary_fiction': 450,
    };

    return genreCosts[genre.toLowerCase()] || 500;
  }

  /**
   * Calculate estimated reach based on genre
   */
  private calculateEstimatedReach(genre: string): number {
    const genreReach: Record<string, number> = {
      'romance': 400000,
      'mystery': 350000,
      'thriller': 300000,
      'fantasy': 250000,
      'science_fiction': 200000,
      'contemporary': 200000,
      'young_adult': 250000,
      'literary_fiction': 150000,
    };

    return genreReach[genre.toLowerCase()] || 200000;
  }
}

export default BookBubAdsManager;
