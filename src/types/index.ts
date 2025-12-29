/**
 * NexusProseCreator Marketing - TypeScript Type Definitions
 */

// ============================================================================
// Core Types
// ============================================================================

export interface MarketingCampaign {
  id: string;
  publishing_project_id: string;
  campaign_name: string;
  campaign_type: 'pre_launch' | 'launch' | 'ongoing' | 'promo';
  start_date: Date;
  end_date?: Date;
  budget_dollars?: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: Date;
  updated_at: Date;
}

export interface MarketingChannel {
  id: string;
  campaign_id: string;
  channel: 'amazon_ads' | 'bookbub' | 'facebook_ads' | 'instagram_ads' | 'email' | 'social_organic';
  budget_allocation_dollars?: number;
  spend_dollars: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue_dollars: number;
}

// ============================================================================
// Advertising Types
// ============================================================================

export interface AdCampaign {
  id: string;
  channel_id: string;
  platform: 'amazon_sp' | 'amazon_sb' | 'facebook' | 'instagram' | 'bookbub';
  campaign_name: string;
  ad_copy?: string;
  targeting: Record<string, any>;
  bidding_strategy?: 'manual' | 'auto' | 'target_acos' | 'target_roas';
  daily_budget?: number;
  status: 'draft' | 'active' | 'paused' | 'archived';
  created_at: Date;
  updated_at: Date;
}

export interface AdPerformance {
  id: string;
  ad_campaign_id: string;
  date: Date;
  impressions: number;
  clicks: number;
  spend_dollars: number;
  sales: number;
  revenue_dollars: number;
  acos?: number; // Advertising Cost of Sales
  roas?: number; // Return on Ad Spend
}

export interface AmazonCampaign {
  campaign_id: string;
  ad_group_id: string;
  keywords_count: number;
  estimated_impressions: number;
}

export interface CampaignPerformance {
  impressions: number;
  clicks: number;
  ctr: number;
  cost: number;
  sales: number;
  acos: number;
  roas: number;
  roi: number;
}

// ============================================================================
// Email Marketing Types
// ============================================================================

export interface EmailCampaign {
  id: string;
  campaign_id: string;
  email_type: 'welcome' | 'nurture' | 'launch' | 'promo' | 'newsletter';
  subject_line: string;
  email_body: string;
  send_date?: Date;
  recipients_count: number;
  opens_count: number;
  clicks_count: number;
  conversions_count: number;
  status: 'draft' | 'scheduled' | 'sent';
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface EmailSequence {
  id: string;
  project_id: string;
  name: string;
  status: 'active' | 'paused';
}

// ============================================================================
// Social Media Types
// ============================================================================

export interface SocialPost {
  id: string;
  campaign_id: string;
  platform: 'instagram' | 'twitter' | 'tiktok' | 'facebook';
  post_type?: 'image' | 'video' | 'carousel' | 'story' | 'reel';
  content: string;
  media_urls: string[];
  scheduled_date?: Date;
  posted_date?: Date;
  status: 'draft' | 'scheduled' | 'posted' | 'failed';
  engagement: Record<string, any>;
}

export interface SocialCampaign {
  campaign_id: string;
  posts_scheduled: number;
  start_date: Date;
  end_date: Date;
}

// ============================================================================
// CRM Types
// ============================================================================

export interface CRMContact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  source?: 'website' | 'reader_magnet' | 'book_purchase' | 'social' | 'referral';
  stage: 'lead' | 'prospect' | 'customer' | 'advocate';
  genre_preferences: string[];
  engagement_score: number;
  lifetime_value_dollars: number;
  subscribed: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CRMSequence {
  id: string;
  sequence_name: string;
  sequence_type: 'welcome' | 'nurture' | 'launch' | 'win_back';
  trigger_event?: string;
  email_count: number;
  status: 'active' | 'paused' | 'archived';
}

export interface CRMSequenceEmail {
  id: string;
  sequence_id: string;
  email_number: number;
  delay_days: number;
  subject_line: string;
  email_body: string;
}

// ============================================================================
// Sales & Analytics Types
// ============================================================================

export interface Sale {
  id: string;
  publishing_project_id: string;
  platform: 'amazon' | 'apple' | 'kobo' | 'audible' | 'direct';
  sale_date: Date;
  format?: 'ebook' | 'print' | 'audiobook';
  units_sold: number;
  revenue_dollars?: number;
  royalty_dollars?: number;
  source?: 'organic' | 'ad' | 'promo' | 'referral';
}

export interface CampaignAnalytics {
  campaign_id: string;
  spend: number;
  revenue: number;
  sales_count: number;
  roi: number;
  acos: number;
  roas: number;
  cpa: number; // Cost Per Acquisition
  channels: {
    amazon_ads?: ChannelMetrics;
    facebook?: ChannelMetrics;
    email?: EmailMetrics;
    social?: SocialMetrics;
  };
}

export interface ChannelMetrics {
  spend: number;
  revenue: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roi: number;
}

export interface EmailMetrics {
  sent: number;
  opens: number;
  clicks: number;
  conversions: number;
  open_rate: number;
  click_rate: number;
}

export interface SocialMetrics {
  posts: number;
  impressions: number;
  engagement: number;
  clicks: number;
  conversions: number;
}

export interface MarketingReport {
  report_file: string;
  generated_at: Date;
  summary: {
    roi: number;
    total_sales: number;
    best_performing_channel: string;
  };
}

// ============================================================================
// ARC & Review Types
// ============================================================================

export interface ARCCampaign {
  campaign_id: string;
  netgalley_url: string;
  status: 'active' | 'closed';
  reviewer_limit: number;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreateCampaignRequest {
  project_id: string;
  campaign_type: 'launch' | 'ongoing' | 'promotion';
  budget: number;
  channels: ('amazon_ads' | 'facebook' | 'bookbub' | 'email' | 'social')[];
  duration_days: number;
}

export interface BudgetAllocation {
  amazon_ads?: number;
  facebook?: number;
  bookbub?: number;
  email?: number;
  social?: number;
}

export interface EmotionContext {
  type: 'joy' | 'fear' | 'anger' | 'sadness' | 'neutral';
  intensity?: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface MarketingConfig {
  database: {
    connectionString: string;
  };
  amazon: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    profileId: string;
  };
  facebook: {
    appId: string;
    appSecret: string;
    accessToken: string;
    adAccountId: string;
  };
  bookbub: {
    apiKey: string;
    publisherId: string;
  };
  netgalley: {
    apiKey: string;
    publisherId: string;
  };
  mailchimp: {
    apiKey: string;
    serverPrefix: string;
    listId: string;
  };
  nexusCRM: {
    url: string;
    apiKey: string;
  };
  mageAgent: {
    url: string;
    apiKey: string;
  };
}

// ============================================================================
// Error Types
// ============================================================================

export class MarketingError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'MarketingError';
    Error.captureStackTrace(this, this.constructor);
  }
}
