/**
 * Performance Tracker & Analytics
 * Tracks ROI, calculates metrics, generates reports
 */

import { CampaignAnalytics, ChannelMetrics, EmailMetrics, SocialMetrics, MarketingReport, MarketingError } from '../../types';
import db from '../../utils/database';
import logger from '../../utils/logger';
import ROICalculator from '../../utils/roiCalculator';

export class PerformanceTracker {
  /**
   * Get comprehensive campaign analytics
   */
  async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    try {
      // Get campaign details
      const campaign = await db.queryOne(
        'SELECT * FROM prose.marketing_campaigns WHERE id = $1',
        [campaignId]
      );

      if (!campaign) {
        throw new MarketingError('Campaign not found', 'CAMPAIGN_NOT_FOUND', 404);
      }

      // Get channels
      const channels = await db.query(
        'SELECT * FROM prose.marketing_channels WHERE campaign_id = $1',
        [campaignId]
      );

      // Get ad performance
      const adPerformance = await db.query(
        `SELECT ap.* FROM prose.ad_performance ap
         JOIN prose.ad_campaigns ac ON ap.ad_campaign_id = ac.id
         JOIN prose.marketing_channels mc ON ac.channel_id = mc.id
         WHERE mc.campaign_id = $1`,
        [campaignId]
      );

      // Get email performance
      const emailPerformance = await db.query(
        'SELECT * FROM prose.email_campaigns WHERE campaign_id = $1',
        [campaignId]
      );

      // Calculate total metrics
      const totalSpend = campaign.budget_dollars || 0;
      const totalRevenue = channels.reduce((sum: number, ch: any) => sum + (ch.revenue_dollars || 0), 0);
      const totalConversions = channels.reduce((sum: number, ch: any) => sum + (ch.conversions || 0), 0);

      const roi = ROICalculator.calculateROI(totalRevenue, totalSpend) || 0;
      const acos = ROICalculator.calculateACOS(totalSpend, totalRevenue) || 0;
      const roas = ROICalculator.calculateROAS(totalRevenue, totalSpend) || 0;
      const cpa = ROICalculator.calculateCPA(totalSpend, totalConversions) || 0;

      // Build channel breakdown
      const channelMetrics: any = {};

      for (const channel of channels) {
        if (channel.channel === 'amazon_ads') {
          channelMetrics.amazon_ads = this.calculateChannelMetrics(channel);
        } else if (channel.channel === 'facebook_ads') {
          channelMetrics.facebook = this.calculateChannelMetrics(channel);
        } else if (channel.channel === 'email') {
          channelMetrics.email = this.calculateEmailMetrics(emailPerformance);
        } else if (channel.channel === 'social_organic') {
          channelMetrics.social = await this.calculateSocialMetrics(campaignId);
        }
      }

      return {
        campaign_id: campaignId,
        spend: totalSpend,
        revenue: totalRevenue,
        sales_count: totalConversions,
        roi,
        acos,
        roas,
        cpa,
        channels: channelMetrics,
      };

    } catch (error: any) {
      logger.error('Failed to get campaign analytics:', error);
      throw new MarketingError(
        'Failed to retrieve campaign analytics',
        'ANALYTICS_ERROR',
        500,
        { campaignId, error: error.message }
      );
    }
  }

  /**
   * Calculate channel-specific metrics
   */
  private calculateChannelMetrics(channel: any): ChannelMetrics {
    const spend = channel.spend_dollars || 0;
    const revenue = channel.revenue_dollars || 0;
    const roi = ROICalculator.calculateROI(revenue, spend) || 0;

    return {
      spend,
      revenue,
      impressions: channel.impressions || 0,
      clicks: channel.clicks || 0,
      conversions: channel.conversions || 0,
      roi,
    };
  }

  /**
   * Calculate email metrics
   */
  private calculateEmailMetrics(emails: any[]): EmailMetrics {
    const sent = emails.reduce((sum, e) => sum + (e.recipients_count || 0), 0);
    const opens = emails.reduce((sum, e) => sum + (e.opens_count || 0), 0);
    const clicks = emails.reduce((sum, e) => sum + (e.clicks_count || 0), 0);
    const conversions = emails.reduce((sum, e) => sum + (e.conversions_count || 0), 0);

    return {
      sent,
      opens,
      clicks,
      conversions,
      open_rate: ROICalculator.calculateOpenRate(opens, sent),
      click_rate: ROICalculator.calculateClickRate(clicks, opens),
    };
  }

  /**
   * Calculate social media metrics
   */
  private async calculateSocialMetrics(campaignId: string): Promise<SocialMetrics> {
    const posts = await db.query(
      'SELECT * FROM prose.social_posts WHERE campaign_id = $1',
      [campaignId]
    );

    let totalImpressions = 0;
    let totalEngagement = 0;
    let totalClicks = 0;
    let totalConversions = 0;

    for (const post of posts) {
      const engagement = post.engagement || {};
      totalImpressions += engagement.views || 0;
      totalEngagement += (engagement.likes || 0) + (engagement.comments || 0) + (engagement.shares || 0);
      totalClicks += engagement.clicks || 0;
      totalConversions += engagement.conversions || 0;
    }

    return {
      posts: posts.length,
      impressions: totalImpressions,
      engagement: totalEngagement,
      clicks: totalClicks,
      conversions: totalConversions,
    };
  }

  /**
   * Generate marketing report
   */
  async generateReport(params: {
    campaign_id: string;
    date_range: { start: Date; end: Date };
  }): Promise<MarketingReport> {
    try {
      const analytics = await this.getCampaignAnalytics(params.campaign_id);

      // Determine best performing channel
      const channels = analytics.channels;
      let bestChannel = 'N/A';
      let bestROI = -Infinity;

      for (const [channelName, metrics] of Object.entries(channels)) {
        const channelMetrics = metrics as ChannelMetrics;
        if (channelMetrics.roi > bestROI) {
          bestROI = channelMetrics.roi;
          bestChannel = channelName;
        }
      }

      // In production, generate PDF report with charts
      const reportFile = `/reports/campaign_${params.campaign_id}_${Date.now()}.pdf`;

      logger.info('Report generated', {
        campaign_id: params.campaign_id,
        file: reportFile,
      });

      return {
        report_file: reportFile,
        generated_at: new Date(),
        summary: {
          roi: analytics.roi,
          total_sales: analytics.sales_count,
          best_performing_channel: bestChannel,
        },
      };

    } catch (error: any) {
      logger.error('Failed to generate report:', error);
      throw new MarketingError(
        'Failed to generate marketing report',
        'REPORT_ERROR',
        500,
        { campaign_id: params.campaign_id, error: error.message }
      );
    }
  }

  /**
   * Track sales attribution
   */
  async trackSale(params: {
    project_id: string;
    platform: string;
    format: 'ebook' | 'print' | 'audiobook';
    revenue: number;
    source?: 'organic' | 'ad' | 'promo' | 'referral';
  }): Promise<void> {
    try {
      await db.insert('prose.sales', {
        publishing_project_id: params.project_id,
        platform: params.platform,
        sale_date: new Date(),
        format: params.format,
        units_sold: 1,
        revenue_dollars: params.revenue,
        royalty_dollars: params.revenue * 0.70, // 70% royalty estimate
        source: params.source || 'organic',
      });

      logger.info('Sale tracked', {
        project_id: params.project_id,
        platform: params.platform,
        revenue: params.revenue,
      });

    } catch (error: any) {
      logger.error('Failed to track sale:', error);
    }
  }

  /**
   * Get real-time dashboard data
   */
  async getDashboardData(projectId: string): Promise<{
    total_sales: number;
    total_revenue: number;
    total_spend: number;
    roi: number;
    active_campaigns: number;
    top_performing_campaign: string | null;
  }> {
    try {
      // Get sales
      const salesResult = await db.query(
        `SELECT COUNT(*) as count, SUM(revenue_dollars) as revenue
         FROM prose.sales
         WHERE publishing_project_id = $1`,
        [projectId]
      );

      const totalSales = parseInt(salesResult[0]?.count || '0');
      const totalRevenue = parseFloat(salesResult[0]?.revenue || '0');

      // Get spend
      const spendResult = await db.query(
        `SELECT SUM(budget_dollars) as spend
         FROM prose.marketing_campaigns
         WHERE publishing_project_id = $1 AND status = 'active'`,
        [projectId]
      );

      const totalSpend = parseFloat(spendResult[0]?.spend || '0');
      const roi = ROICalculator.calculateROI(totalRevenue, totalSpend) || 0;

      // Get active campaigns
      const campaigns = await db.query(
        `SELECT COUNT(*) as count
         FROM prose.marketing_campaigns
         WHERE publishing_project_id = $1 AND status = 'active'`,
        [projectId]
      );

      const activeCampaigns = parseInt(campaigns[0]?.count || '0');

      return {
        total_sales: totalSales,
        total_revenue: totalRevenue,
        total_spend: totalSpend,
        roi,
        active_campaigns: activeCampaigns,
        top_performing_campaign: null, // Would calculate from analytics
      };

    } catch (error: any) {
      logger.error('Failed to get dashboard data:', error);
      throw new MarketingError(
        'Failed to retrieve dashboard data',
        'DASHBOARD_ERROR',
        500,
        { projectId, error: error.message }
      );
    }
  }
}

export default PerformanceTracker;
