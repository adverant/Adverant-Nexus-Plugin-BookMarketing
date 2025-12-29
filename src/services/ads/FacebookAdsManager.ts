/**
 * Facebook/Instagram Ads Manager
 * Manages campaigns across Facebook and Instagram platforms
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
import { MarketingError } from '../../types';
import db from '../../utils/database';
import logger from '../../utils/logger';

export class FacebookAdsManager {
  private fbClient: AxiosInstance;
  private graphApiUrl = 'https://graph.facebook.com/v18.0';
  private accessToken: string;
  private adAccountId: string;

  constructor() {
    this.accessToken = config.facebook.accessToken;
    this.adAccountId = config.facebook.adAccountId;

    this.fbClient = axios.create({
      baseURL: this.graphApiUrl,
      params: {
        access_token: this.accessToken,
      },
      timeout: 15000,
    });
  }

  /**
   * Create Facebook ad campaign
   */
  async createCampaign(params: {
    project_id: string;
    campaign_name: string;
    daily_budget: number;
    audience: {
      age_min: number;
      age_max: number;
      genders: number[]; // 1=male, 2=female
      interests: string[];
      locations: string[];
    };
    creative: {
      image_url: string;
      headline: string;
      description: string;
      link_url: string;
    };
  }): Promise<{ campaign_id: string; ad_set_id: string; ad_id: string }> {
    try {
      // 1. Create campaign
      const campaign = await this.fbClient.post(`/act_${this.adAccountId}/campaigns`, {
        name: params.campaign_name,
        objective: 'LINK_CLICKS',
        status: 'ACTIVE',
        special_ad_categories: [],
      });

      const campaignId = campaign.data.id;
      logger.info('Facebook campaign created', { campaignId });

      // 2. Create ad set with targeting
      const adSet = await this.fbClient.post(`/act_${this.adAccountId}/adsets`, {
        name: `${params.campaign_name} - Ad Set`,
        campaign_id: campaignId,
        daily_budget: Math.round(params.daily_budget * 100), // Convert to cents
        billing_event: 'LINK_CLICKS',
        optimization_goal: 'LINK_CLICKS',
        bid_amount: 50, // 50 cents per click
        targeting: {
          age_min: params.audience.age_min,
          age_max: params.audience.age_max,
          genders: params.audience.genders,
          interests: params.audience.interests.map(interest => ({
            name: interest,
          })),
          geo_locations: {
            countries: params.audience.locations,
          },
        },
        status: 'ACTIVE',
      });

      const adSetId = adSet.data.id;

      // 3. Create ad creative
      const creative = await this.fbClient.post(`/act_${this.adAccountId}/adcreatives`, {
        name: `${params.campaign_name} - Creative`,
        object_story_spec: {
          page_id: config.facebook.adAccountId, // Replace with actual page ID
          link_data: {
            image_url: params.creative.image_url,
            link: params.creative.link_url,
            message: params.creative.description,
            name: params.creative.headline,
            call_to_action: {
              type: 'LEARN_MORE',
            },
          },
        },
      });

      const creativeId = creative.data.id;

      // 4. Create ad
      const ad = await this.fbClient.post(`/act_${this.adAccountId}/ads`, {
        name: `${params.campaign_name} - Ad`,
        adset_id: adSetId,
        creative: { creative_id: creativeId },
        status: 'ACTIVE',
      });

      const adId = ad.data.id;

      // 5. Store in database
      await db.insert('prose.ad_campaigns', {
        platform: 'facebook',
        campaign_name: params.campaign_name,
        ad_copy: params.creative.description,
        targeting: params.audience,
        bidding_strategy: 'manual',
        daily_budget: params.daily_budget,
        status: 'active',
      });

      logger.info('Facebook campaign fully created', { campaignId, adSetId, adId });

      return {
        campaign_id: campaignId,
        ad_set_id: adSetId,
        ad_id: adId,
      };

    } catch (error: any) {
      logger.error('Failed to create Facebook campaign:', error);
      throw new MarketingError(
        'Failed to create Facebook Ads campaign',
        'FACEBOOK_ADS_ERROR',
        500,
        { error: error.message }
      );
    }
  }

  /**
   * Get campaign insights
   */
  async getCampaignInsights(campaignId: string): Promise<{
    impressions: number;
    clicks: number;
    spend: number;
    reach: number;
    ctr: number;
    cpc: number;
  }> {
    try {
      const response = await this.fbClient.get(`/${campaignId}/insights`, {
        params: {
          fields: 'impressions,clicks,spend,reach,ctr,cpc',
        },
      });

      const data = response.data.data[0] || {
        impressions: 0,
        clicks: 0,
        spend: 0,
        reach: 0,
        ctr: 0,
        cpc: 0,
      };

      return {
        impressions: parseInt(data.impressions || '0'),
        clicks: parseInt(data.clicks || '0'),
        spend: parseFloat(data.spend || '0'),
        reach: parseInt(data.reach || '0'),
        ctr: parseFloat(data.ctr || '0'),
        cpc: parseFloat(data.cpc || '0'),
      };

    } catch (error: any) {
      logger.error('Failed to get Facebook campaign insights:', error);
      throw new MarketingError(
        'Failed to fetch campaign insights',
        'INSIGHTS_ERROR',
        500,
        { campaignId, error: error.message }
      );
    }
  }

  /**
   * Create lookalike audience from existing customers
   */
  async createLookalikeAudience(params: {
    name: string;
    source_audience_id: string;
    countries: string[];
    ratio: number; // 0.01 to 0.10 (1% to 10%)
  }): Promise<string> {
    try {
      const response = await this.fbClient.post(`/act_${this.adAccountId}/customaudiences`, {
        name: params.name,
        subtype: 'LOOKALIKE',
        lookalike_spec: {
          origin: [{ id: params.source_audience_id }],
          starting_ratio: params.ratio,
          country: params.countries[0],
        },
      });

      const audienceId = response.data.id;
      logger.info('Lookalike audience created', { audienceId, ratio: params.ratio });

      return audienceId;

    } catch (error: any) {
      logger.error('Failed to create lookalike audience:', error);
      throw new MarketingError(
        'Failed to create lookalike audience',
        'AUDIENCE_ERROR',
        500,
        { error: error.message }
      );
    }
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    try {
      await this.fbClient.post(`/${campaignId}`, {
        status: 'PAUSED',
      });
      logger.info('Facebook campaign paused', { campaignId });
    } catch (error: any) {
      logger.error('Failed to pause Facebook campaign:', error);
      throw new MarketingError(
        'Failed to pause campaign',
        'CAMPAIGN_PAUSE_ERROR',
        500,
        { campaignId, error: error.message }
      );
    }
  }
}

export default FacebookAdsManager;
