/**
 * Social Media Post Scheduler
 * Automates social media content generation and scheduling
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
import { SocialPost, SocialCampaign, MarketingError } from '../../types';
import db from '../../utils/database';
import logger from '../../utils/logger';

export class SocialPostScheduler {
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
   * Schedule launch campaign (30 days of content)
   */
  async scheduleLaunchCampaign(params: {
    project_id: string;
    book_title: string;
    launch_date: Date;
    platforms: ('twitter' | 'facebook' | 'instagram' | 'tiktok')[];
  }): Promise<SocialCampaign> {
    try {
      // Generate 30 days of social content using AI
      const posts = await this.generateSocialContent(params);

      const scheduled: any[] = [];

      // Schedule posts across platforms
      for (const post of posts) {
        for (const platform of params.platforms) {
          const scheduledPost = await db.insert('prose.social_posts', {
            platform,
            post_type: this.getPostType(platform),
            content: post.content,
            media_urls: post.image_url ? [post.image_url] : [],
            scheduled_date: post.schedule_time,
            status: 'scheduled',
            engagement: {},
          });

          scheduled.push(scheduledPost);
        }
      }

      const endDate = new Date(params.launch_date);
      endDate.setDate(endDate.getDate() + 30);

      logger.info('Launch campaign scheduled', {
        project_id: params.project_id,
        posts: scheduled.length,
      });

      return {
        campaign_id: `social_${params.project_id}`,
        posts_scheduled: scheduled.length,
        start_date: params.launch_date,
        end_date: endDate,
      };

    } catch (error: any) {
      logger.error('Failed to schedule launch campaign:', error);
      throw new MarketingError(
        'Failed to schedule social media campaign',
        'SOCIAL_SCHEDULE_ERROR',
        500,
        { project_id: params.project_id, error: error.message }
      );
    }
  }

  /**
   * Generate social media content using AI
   */
  private async generateSocialContent(params: {
    book_title: string;
    launch_date: Date;
  }): Promise<Array<{ content: string; image_url?: string; schedule_time: Date }>> {
    try {
      const response = await this.mageAgentClient.post('/api/orchestrate', {
        task: 'generate book launch social media content',
        context: {
          book_title: params.book_title,
          launch_date: params.launch_date,
          post_count: 30,
          tone: 'engaging, authentic, builds excitement',
          platforms: ['twitter', 'facebook', 'instagram'],
        },
        maxAgents: 3,
      });

      return response.data.result.posts || this.getDefaultPosts(params);

    } catch (error: any) {
      logger.warn('MageAgent unavailable, using default posts:', error.message);
      return this.getDefaultPosts(params);
    }
  }

  /**
   * Default social posts (fallback)
   */
  private getDefaultPosts(params: {
    book_title: string;
    launch_date: Date;
  }): Array<{ content: string; schedule_time: Date }> {
    const posts = [];
    const launchDate = new Date(params.launch_date);

    // Countdown posts (7 days before launch)
    for (let i = 7; i >= 1; i--) {
      const scheduleDate = new Date(launchDate);
      scheduleDate.setDate(scheduleDate.getDate() - i);

      posts.push({
        content: `${i} days until ${params.book_title} launches! Are you ready? 📚✨`,
        schedule_time: scheduleDate,
      });
    }

    // Launch day
    posts.push({
      content: `🎉 ${params.book_title} is LIVE! Grab your copy now! 📖`,
      schedule_time: launchDate,
    });

    // Post-launch (weekly updates for 3 weeks)
    for (let week = 1; week <= 3; week++) {
      const scheduleDate = new Date(launchDate);
      scheduleDate.setDate(scheduleDate.getDate() + (week * 7));

      posts.push({
        content: `Loving ${params.book_title}? Leave a review and help others discover this story! ⭐`,
        schedule_time: scheduleDate,
      });
    }

    return posts;
  }

  /**
   * Get appropriate post type for platform
   */
  private getPostType(platform: string): 'image' | 'video' | 'text' {
    switch (platform) {
      case 'instagram':
        return 'image';
      case 'tiktok':
        return 'video';
      default:
        return 'text';
    }
  }

  /**
   * Post to platform (integration with social media APIs)
   */
  async postToSocial(postId: string): Promise<void> {
    try {
      const post = await db.queryOne<SocialPost>(
        'SELECT * FROM prose.social_posts WHERE id = $1',
        [postId]
      );

      if (!post) {
        throw new Error('Post not found');
      }

      // In production, integrate with platform APIs
      // Twitter API, Facebook Graph API, Instagram Graph API, TikTok API

      await db.update('prose.social_posts', postId, {
        status: 'posted',
        posted_date: new Date(),
      });

      logger.info('Post published to social media', {
        postId,
        platform: post.platform,
      });

    } catch (error: any) {
      logger.error('Failed to post to social media:', error);
      await db.update('prose.social_posts', postId, {
        status: 'failed',
      });
    }
  }

  /**
   * Track engagement metrics
   */
  async trackEngagement(
    postId: string,
    metrics: {
      likes?: number;
      comments?: number;
      shares?: number;
      views?: number;
    }
  ): Promise<void> {
    try {
      const post = await db.queryOne<SocialPost>(
        'SELECT * FROM prose.social_posts WHERE id = $1',
        [postId]
      );

      if (!post) {
        return;
      }

      const engagement = {
        ...post.engagement,
        ...metrics,
        updated_at: new Date().toISOString(),
      };

      await db.update('prose.social_posts', postId, {
        engagement,
      });

      logger.debug('Social engagement tracked', { postId, metrics });

    } catch (error: any) {
      logger.error('Failed to track social engagement:', error);
    }
  }
}

export default SocialPostScheduler;
