/**
 * NetGalley ARC Distribution Manager
 * Manages Advanced Reader Copy (ARC) distribution via NetGalley
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { ARCCampaign, MarketingError } from '../types';
import logger from '../utils/logger';

export class NetGalleyManager {
  private netgalleyClient: AxiosInstance;
  private netgalleyUrl = 'https://api.netgalley.com/v2';
  private apiKey: string;
  private publisherId: string;

  constructor() {
    this.apiKey = config.netgalley.apiKey;
    this.publisherId = config.netgalley.publisherId;

    this.netgalleyClient = axios.create({
      baseURL: this.netgalleyUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    });
  }

  /**
   * Create ARC campaign on NetGalley
   */
  async createARCCampaign(params: {
    project_id: string;
    title: string;
    epub_file: Buffer;
    publication_date: Date;
    reviewer_count: number;
    genre: string;
    description: string;
  }): Promise<ARCCampaign> {
    try {
      // Upload EPUB file
      const fileUpload = await this.uploadEPUB(params.epub_file, params.title);

      // Create title on NetGalley
      const response = await this.netgalleyClient.post('/titles', {
        publisher_id: this.publisherId,
        title: params.title,
        description: params.description,
        publication_date: params.publication_date.toISOString().split('T')[0],
        file_id: fileUpload.file_id,
        reviewer_limit: params.reviewer_count,
        categories: this.mapGenreToCategories(params.genre),
        auto_approve: false, // Manual approval of reviewers
        visibility: 'public',
      });

      const campaignId = response.data.id;
      const netgalleyUrl = response.data.url;

      logger.info('NetGalley ARC campaign created', {
        campaignId,
        title: params.title,
        reviewer_limit: params.reviewer_count,
      });

      return {
        campaign_id: campaignId,
        netgalley_url: netgalleyUrl,
        status: 'active',
        reviewer_limit: params.reviewer_count,
      };

    } catch (error: any) {
      logger.error('Failed to create NetGalley campaign:', error);
      throw new MarketingError(
        'Failed to create ARC campaign on NetGalley',
        'NETGALLEY_ERROR',
        500,
        { title: params.title, error: error.message }
      );
    }
  }

  /**
   * Upload EPUB file to NetGalley
   */
  private async uploadEPUB(
    fileBuffer: Buffer,
    title: string
  ): Promise<{ file_id: string }> {
    try {
      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: 'application/epub+zip' });
      formData.append('file', blob, `${title}.epub`);

      const response = await this.netgalleyClient.post('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return { file_id: response.data.id };

    } catch (error: any) {
      logger.error('Failed to upload EPUB to NetGalley:', error);
      throw error;
    }
  }

  /**
   * Map genre to NetGalley categories
   */
  private mapGenreToCategories(genre: string): string[] {
    const genreMap: Record<string, string[]> = {
      'fantasy': ['Fiction', 'Fantasy'],
      'science_fiction': ['Fiction', 'Science Fiction'],
      'romance': ['Fiction', 'Romance'],
      'mystery': ['Fiction', 'Mystery'],
      'thriller': ['Fiction', 'Thriller'],
      'young_adult': ['Fiction', 'Young Adult'],
      'literary_fiction': ['Fiction', 'Literary Fiction'],
      'contemporary': ['Fiction', 'Contemporary'],
    };

    return genreMap[genre.toLowerCase()] || ['Fiction', 'General'];
  }

  /**
   * Get ARC campaign statistics
   */
  async getCampaignStats(campaignId: string): Promise<{
    requests: number;
    approved: number;
    downloads: number;
    reviews_submitted: number;
    average_rating: number;
  }> {
    try {
      const response = await this.netgalleyClient.get(`/titles/${campaignId}/stats`);

      const data = response.data;

      return {
        requests: data.total_requests || 0,
        approved: data.approved_requests || 0,
        downloads: data.downloads || 0,
        reviews_submitted: data.reviews_submitted || 0,
        average_rating: data.average_rating || 0,
      };

    } catch (error: any) {
      logger.error('Failed to get NetGalley campaign stats:', error);
      throw new MarketingError(
        'Failed to fetch campaign statistics',
        'STATS_ERROR',
        500,
        { campaignId, error: error.message }
      );
    }
  }

  /**
   * Close ARC campaign
   */
  async closeCampaign(campaignId: string): Promise<void> {
    try {
      await this.netgalleyClient.put(`/titles/${campaignId}`, {
        status: 'closed',
      });

      logger.info('NetGalley campaign closed', { campaignId });

    } catch (error: any) {
      logger.error('Failed to close NetGalley campaign:', error);
      throw new MarketingError(
        'Failed to close campaign',
        'CAMPAIGN_CLOSE_ERROR',
        500,
        { campaignId, error: error.message }
      );
    }
  }
}

export default NetGalleyManager;
