/**
 * Amazon Marketing Services (AMS) Integration
 * Manages Amazon Ads campaigns, keywords, and performance tracking
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
import { AmazonCampaign, CampaignPerformance, MarketingError } from '../../types';
import db from '../../utils/database';
import logger from '../../utils/logger';

export class AmazonAdsManager {
  private amsClient: AxiosInstance;
  private amsUrl = 'https://advertising-api.amazon.com';
  private apiKey: string;
  private profileId: string;

  constructor() {
    this.apiKey = config.amazon.clientId; // Use access token in production
    this.profileId = config.amazon.profileId;

    this.amsClient = axios.create({
      baseURL: this.amsUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Amazon-Advertising-API-ClientId': config.amazon.clientId,
        'Amazon-Advertising-API-Scope': this.profileId,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  /**
   * Create Sponsored Product Campaign
   */
  async createSponsoredProductCampaign(params: {
    project_id: string;
    asin: string;
    daily_budget: number;
    keywords: string[];
  }): Promise<AmazonCampaign> {
    try {
      // 1. Create campaign
      const campaign = await this.amsClient.post('/v2/sp/campaigns', {
        name: `SP - ${params.asin}`,
        campaignType: 'sponsoredProducts',
        targetingType: 'manual',
        state: 'enabled',
        dailyBudget: params.daily_budget,
        startDate: new Date().toISOString().split('T')[0],
      });

      const campaignId = campaign.data.campaignId;
      logger.info('Amazon campaign created', { campaignId, asin: params.asin });

      // 2. Create ad group
      const adGroup = await this.amsClient.post('/v2/sp/adGroups', {
        campaignId: campaignId,
        name: 'Main Ad Group',
        state: 'enabled',
        defaultBid: 0.50, // $0.50 default bid
      });

      const adGroupId = adGroup.data.adGroupId;

      // 3. Add product ad
      await this.amsClient.post('/v2/sp/productAds', {
        adGroupId: adGroupId,
        campaignId: campaignId,
        sku: params.asin,
        state: 'enabled',
      });

      // 4. Add keywords
      const keywords = await this.addKeywords(adGroupId, params.keywords);

      // 5. Store in database
      await db.insert('prose.ad_campaigns', {
        platform: 'amazon_sp',
        campaign_name: `SP - ${params.asin}`,
        ad_copy: `Amazon Sponsored Product for ${params.asin}`,
        targeting: { keywords: params.keywords, asin: params.asin },
        bidding_strategy: 'manual',
        daily_budget: params.daily_budget,
        status: 'active',
      });

      return {
        campaign_id: campaignId,
        ad_group_id: adGroupId,
        keywords_count: keywords.length,
        estimated_impressions: this.estimateImpressions(params.daily_budget),
      };

    } catch (error: any) {
      logger.error('Failed to create Amazon campaign:', error);
      throw new MarketingError(
        'Failed to create Amazon Ads campaign',
        'AMAZON_ADS_ERROR',
        500,
        { asin: params.asin, error: error.message }
      );
    }
  }

  /**
   * Add keywords to ad group
   */
  private async addKeywords(
    adGroupId: string,
    keywords: string[]
  ): Promise<any[]> {
    const keywordRequests = keywords.map(keyword => ({
      adGroupId: adGroupId,
      campaignId: '', // Will be set by API
      keywordText: keyword,
      matchType: 'broad', // broad, phrase, exact
      state: 'enabled',
      bid: 0.50,
    }));

    try {
      const response = await this.amsClient.post(
        '/v2/sp/keywords',
        keywordRequests
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to add keywords:', error);
      throw error;
    }
  }

  /**
   * Get campaign performance
   */
  async getPerformance(campaignId: string): Promise<CampaignPerformance> {
    try {
      const response = await this.amsClient.post('/v2/sp/campaigns/report', {
        campaignIdFilter: [campaignId],
        metrics: 'impressions,clicks,cost,sales,acos',
      });

      const data = response.data[0] || {
        impressions: 0,
        clicks: 0,
        cost: 0,
        sales: 0,
      };

      const clicks = data.clicks || 0;
      const impressions = data.impressions || 0;
      const cost = data.cost || 0;
      const revenue = data.sales || 0;

      return {
        impressions: impressions,
        clicks: clicks,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cost: cost,
        sales: revenue,
        acos: revenue > 0 ? (cost / revenue) * 100 : 0,
        roas: cost > 0 ? revenue / cost : 0,
        roi: cost > 0 ? ((revenue - cost) / cost) * 100 : 0,
      };

    } catch (error: any) {
      logger.error('Failed to get Amazon campaign performance:', error);
      throw new MarketingError(
        'Failed to fetch campaign performance',
        'PERFORMANCE_ERROR',
        500,
        { campaignId, error: error.message }
      );
    }
  }

  /**
   * Update campaign bid strategy
   */
  async updateBiddingStrategy(
    campaignId: string,
    strategy: 'manual' | 'auto' | 'target_acos',
    targetAcos?: number
  ): Promise<void> {
    try {
      const updateData: any = {
        campaignId: campaignId,
      };

      if (strategy === 'target_acos' && targetAcos) {
        updateData.portfolioBiddingStrategy = {
          strategy: 'autoForSales',
          targetAcos: targetAcos,
        };
      }

      await this.amsClient.put(`/v2/sp/campaigns/${campaignId}`, updateData);
      logger.info('Updated campaign bidding strategy', { campaignId, strategy });

    } catch (error: any) {
      logger.error('Failed to update bidding strategy:', error);
      throw new MarketingError(
        'Failed to update bidding strategy',
        'BID_UPDATE_ERROR',
        500,
        { campaignId, error: error.message }
      );
    }
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    try {
      await this.amsClient.put(`/v2/sp/campaigns/${campaignId}`, {
        state: 'paused',
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

  /**
   * Estimate impressions based on daily budget
   */
  private estimateImpressions(dailyBudget: number): number {
    // Average CPC for book ads: $0.30-0.50
    const avgCPC = 0.40;
    const avgCTR = 0.003; // 0.3% CTR
    const estimatedClicks = dailyBudget / avgCPC;
    return Math.round(estimatedClicks / avgCTR);
  }

  /**
   * Get keyword suggestions based on book metadata
   */
  async getKeywordSuggestions(
    asin: string,
    genre: string
  ): Promise<string[]> {
    // In production, use Amazon Keyword Research API or Publisher Rocket
    // For now, return genre-based suggestions
    const baseKeywords = [
      genre.toLowerCase(),
      `${genre} books`,
      `${genre} novels`,
      `best ${genre} books`,
    ];

    logger.info('Generated keyword suggestions', { asin, keywords: baseKeywords.length });
    return baseKeywords;
  }
}

export default AmazonAdsManager;
