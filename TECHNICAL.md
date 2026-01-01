# BookMarketing - Technical Documentation

## API Reference

### Base URL

```
https://api.adverant.ai/proxy/nexus-bookmarketing/marketing/api
```

### Authentication

All API requests require a Bearer token in the Authorization header:

```bash
Authorization: Bearer YOUR_API_KEY
```

#### Required Scopes

| Scope | Description |
|-------|-------------|
| `marketing:read` | Read campaign data and analytics |
| `marketing:write` | Create and modify campaigns |
| `marketing:ads` | Manage advertising platform integrations |
| `marketing:email` | Access email marketing features |
| `marketing:social` | Manage social media campaigns |

---

## API Endpoints

### Campaign Management

#### Create Marketing Campaign

```http
POST /campaigns
```

**Rate Limit:** 10 requests/minute

**Request Body:**

```json
{
  "project_id": "string",
  "campaign_type": "launch | evergreen | promotion | series",
  "name": "string",
  "budget": 2000,
  "currency": "USD",
  "channels": ["amazon_ads", "facebook", "bookbub", "email", "social"],
  "duration_days": 30,
  "start_date": "2025-02-01",
  "settings": {
    "auto_optimize": true,
    "daily_budget_cap": 100,
    "target_acos": 30
  }
}
```

**Response:**

```json
{
  "campaign_id": "camp_abc123",
  "status": "draft",
  "created_at": "2025-01-15T10:00:00Z",
  "channels_configured": 5,
  "estimated_reach": 50000,
  "budget_allocation": {
    "amazon_ads": 1000,
    "facebook": 400,
    "bookbub": 500,
    "email": 30,
    "social": 70
  }
}
```

#### Get Campaign Details

```http
GET /campaigns/:id
```

**Response:**

```json
{
  "campaign_id": "camp_abc123",
  "name": "New Release Launch",
  "status": "active",
  "campaign_type": "launch",
  "budget": 2000,
  "spent": 1250.50,
  "channels": {
    "amazon_ads": {
      "status": "active",
      "spent": 750,
      "impressions": 45000,
      "clicks": 1200,
      "acos": 28.5
    },
    "facebook": {
      "status": "active",
      "spent": 320,
      "reach": 28000,
      "clicks": 450
    }
  },
  "performance": {
    "total_impressions": 85000,
    "total_clicks": 2100,
    "estimated_sales": 45,
    "roas": 3.2
  }
}
```

#### Get Campaign Analytics

```http
GET /campaigns/:id/analytics
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `start_date` | string | Start of date range (ISO 8601) |
| `end_date` | string | End of date range (ISO 8601) |
| `granularity` | string | `hourly`, `daily`, `weekly` |
| `metrics` | string[] | Specific metrics to include |

**Response:**

```json
{
  "campaign_id": "camp_abc123",
  "date_range": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "summary": {
    "impressions": 125000,
    "clicks": 3500,
    "ctr": 2.8,
    "spend": 1850,
    "sales": 62,
    "revenue": 5580,
    "roas": 3.02,
    "acos": 33.1
  },
  "by_channel": {
    "amazon_ads": { "impressions": 50000, "clicks": 1200, "spend": 1000, "sales": 35 },
    "facebook": { "impressions": 35000, "clicks": 600, "spend": 400, "sales": 12 },
    "email": { "opens": 8500, "clicks": 1200, "sales": 15 }
  },
  "time_series": [
    { "date": "2025-01-01", "impressions": 4200, "clicks": 120, "spend": 65 }
  ]
}
```

#### Pause Campaign

```http
PUT /campaigns/:id/pause
```

**Response:**

```json
{
  "campaign_id": "camp_abc123",
  "status": "paused",
  "paused_at": "2025-01-15T14:30:00Z",
  "active_ads_paused": 12
}
```

### Amazon Ads

#### Create Amazon Ads Campaign

```http
POST /ads/amazon
```

**Request Body:**

```json
{
  "campaign_id": "camp_abc123",
  "asin": "B08N5WRWNW",
  "campaign_type": "sponsored_products | sponsored_brands",
  "targeting_type": "auto | manual",
  "daily_budget": 50,
  "bid_strategy": "dynamic_bids_down",
  "keywords": [
    { "keyword": "fantasy novel", "match_type": "broad", "bid": 0.75 },
    { "keyword": "epic fantasy", "match_type": "phrase", "bid": 0.85 }
  ],
  "negative_keywords": ["free", "kindle unlimited only"],
  "product_targeting": {
    "asins": ["B07EXAMPLE1", "B07EXAMPLE2"],
    "categories": ["Kindle eBooks > Fantasy"]
  }
}
```

**Response:**

```json
{
  "amazon_campaign_id": "amz_abc123",
  "status": "pending_review",
  "estimated_daily_reach": 5000,
  "keywords_added": 2,
  "targeting_enabled": ["keywords", "product_targeting"]
}
```

### Facebook Ads

#### Create Facebook Campaign

```http
POST /ads/facebook
```

**Request Body:**

```json
{
  "campaign_id": "camp_abc123",
  "objective": "conversions | traffic | reach",
  "daily_budget": 25,
  "audience": {
    "interests": ["Fantasy books", "Epic fantasy", "Science fiction"],
    "behaviors": ["Engaged shoppers"],
    "age_min": 25,
    "age_max": 55,
    "genders": ["all"],
    "locations": [
      { "country": "US" },
      { "country": "GB" },
      { "country": "CA" }
    ]
  },
  "lookalike": {
    "source": "email_list",
    "list_id": "list_abc123",
    "percentage": 2
  },
  "creatives": [
    {
      "type": "image",
      "image_url": "https://example.com/cover.jpg",
      "headline": "The Dragon's Heir - Now Available",
      "description": "Epic fantasy adventure awaits",
      "call_to_action": "SHOP_NOW",
      "link": "https://amazon.com/dp/B08N5WRWNW"
    }
  ],
  "placement": ["facebook_feed", "instagram_feed", "instagram_stories"]
}
```

### BookBub

#### Apply for BookBub Featured Deal

```http
POST /ads/bookbub/featured-deal
```

**Request Body:**

```json
{
  "campaign_id": "camp_abc123",
  "book": {
    "title": "The Dragon's Heir",
    "author": "Jane Author",
    "asin": "B08N5WRWNW",
    "isbn": "978-1234567890",
    "genre": "fantasy",
    "subgenres": ["epic_fantasy", "dragons"]
  },
  "deal": {
    "original_price": 4.99,
    "deal_price": 0.99,
    "deal_date": "2025-02-15",
    "countries": ["us", "uk", "ca", "au"]
  },
  "submission": {
    "review_count": 150,
    "average_rating": 4.5,
    "previous_deals": 2,
    "author_followers": 5000
  }
}
```

**Response:**

```json
{
  "application_id": "bb_app_abc123",
  "status": "submitted",
  "estimated_response_days": 7,
  "genre_acceptance_rate": "12%",
  "recommendations": [
    "Consider applying on Tuesday for higher acceptance rates",
    "Your review count exceeds genre average by 40%"
  ]
}
```

### Email Marketing

#### Create Email Sequence

```http
POST /email/sequences
```

**Request Body:**

```json
{
  "name": "New Release Launch",
  "trigger": "new_subscriber | tag_added | purchase | manual",
  "trigger_config": {
    "tag": "new_release_interest"
  },
  "emails": [
    {
      "delay_hours": 0,
      "subject": "Welcome! Your free chapter awaits...",
      "template": "welcome_freebie",
      "variables": {
        "freebie_url": "https://example.com/free-chapter"
      }
    },
    {
      "delay_hours": 48,
      "subject": "Did you enjoy the preview?",
      "template": "follow_up",
      "conditions": {
        "opened_previous": true
      }
    },
    {
      "delay_hours": 168,
      "subject": "Launch day is here!",
      "template": "launch_announcement",
      "variables": {
        "buy_link": "https://amazon.com/dp/B08N5WRWNW"
      }
    }
  ],
  "settings": {
    "send_window": { "start": 9, "end": 21, "timezone": "America/New_York" },
    "skip_weekends": false,
    "unsubscribe_on_purchase": false
  }
}
```

### Social Media

#### Schedule Social Campaign

```http
POST /social/campaigns
```

**Request Body:**

```json
{
  "campaign_id": "camp_abc123",
  "name": "30-Day Launch Campaign",
  "platforms": ["twitter", "facebook", "instagram", "tiktok"],
  "content_calendar": {
    "generate_ai": true,
    "content_types": ["promotional", "behind_the_scenes", "quotes", "engagement"],
    "posts_per_day": 2,
    "hashtags": ["fantasy", "bookstagram", "newrelease"],
    "tone": "enthusiastic but authentic"
  },
  "scheduling": {
    "optimal_times": true,
    "timezone": "America/New_York",
    "start_date": "2025-02-01"
  }
}
```

### Analytics Dashboard

#### Get Dashboard Data

```http
GET /analytics/dashboard/:projectId
```

**Response:**

```json
{
  "project_id": "proj_abc123",
  "period": "last_30_days",
  "summary": {
    "total_spend": 2380,
    "total_revenue": 7140,
    "roi_percentage": 200,
    "total_sales": 142
  },
  "channel_performance": [
    {
      "channel": "amazon_ads",
      "spend": 1000,
      "sales": 65,
      "revenue": 3250,
      "acos": 30.8,
      "roas": 3.25
    }
  ],
  "top_keywords": [
    { "keyword": "epic fantasy novel", "impressions": 12000, "clicks": 450, "sales": 18 }
  ],
  "email_metrics": {
    "subscribers": 5200,
    "open_rate": 32.5,
    "click_rate": 8.2,
    "revenue_attributed": 1500
  },
  "social_metrics": {
    "impressions": 45000,
    "engagement_rate": 3.2,
    "followers_gained": 320
  }
}
```

---

## Rate Limits

| Tier | Campaigns/min | Ad Operations/min | Analytics/min |
|------|--------------|-------------------|---------------|
| Starter | 10 | 20 | 60 |
| Author | 20 | 50 | 120 |
| Pro Publisher | 50 | 100 | 300 |
| Enterprise | 100 | 500 | Unlimited |

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 18
X-RateLimit-Reset: 1705320000
```

---

## Data Models

### Campaign

```typescript
interface Campaign {
  campaign_id: string;
  project_id: string;
  name: string;
  campaign_type: 'launch' | 'evergreen' | 'promotion' | 'series';
  status: 'draft' | 'pending' | 'active' | 'paused' | 'completed';
  budget: number;
  currency: string;
  spent: number;
  channels: CampaignChannel[];
  start_date: string;
  end_date?: string;
  settings: CampaignSettings;
  performance: CampaignPerformance;
  created_at: string;
  updated_at: string;
}

interface CampaignChannel {
  channel: 'amazon_ads' | 'facebook' | 'bookbub' | 'email' | 'social';
  status: 'pending' | 'active' | 'paused' | 'error';
  budget_allocation: number;
  spent: number;
  config: Record<string, unknown>;
}

interface CampaignPerformance {
  impressions: number;
  clicks: number;
  ctr: number;
  sales: number;
  revenue: number;
  roas: number;
  acos: number;
}
```

### Contact (CRM)

```typescript
interface Contact {
  contact_id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  tags: string[];
  lifecycle_stage: 'subscriber' | 'lead' | 'customer' | 'advocate';
  engagement_score: number; // 0-100
  source: string;
  purchases: Purchase[];
  email_stats: {
    emails_sent: number;
    emails_opened: number;
    emails_clicked: number;
    last_opened?: string;
  };
  created_at: string;
  updated_at: string;
}

interface Purchase {
  product_id: string;
  product_title: string;
  amount: number;
  currency: string;
  purchase_date: string;
  source_channel?: string;
}
```

### Ad Performance

```typescript
interface AdPerformance {
  ad_id: string;
  platform: 'amazon' | 'facebook' | 'bookbub';
  campaign_id: string;
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    spend: number;
    conversions: number;
    cpa: number;
    roas: number;
  };
  date: string;
  breakdown?: {
    by_device?: Record<string, AdMetrics>;
    by_placement?: Record<string, AdMetrics>;
    by_age?: Record<string, AdMetrics>;
  };
}
```

---

## SDK Integration

### JavaScript/TypeScript

```typescript
import { NexusClient } from '@adverant/nexus-sdk';

const client = new NexusClient({
  apiKey: process.env.NEXUS_API_KEY
});

// Create a launch campaign
const campaign = await client.bookmarketing.campaigns.create({
  project_id: 'proj_abc123',
  campaign_type: 'launch',
  name: 'New Release Launch',
  budget: 2000,
  channels: ['amazon_ads', 'facebook', 'email'],
  duration_days: 30
});

// Set up Amazon Ads
await client.bookmarketing.ads.amazon.create({
  campaign_id: campaign.campaign_id,
  asin: 'B08N5WRWNW',
  campaign_type: 'sponsored_products',
  daily_budget: 50,
  bid_strategy: 'dynamic_bids_down'
});

// Create email sequence
await client.bookmarketing.email.sequences.create({
  name: 'Launch Sequence',
  trigger: 'tag_added',
  trigger_config: { tag: 'launch_interest' },
  emails: [
    { delay_hours: 0, subject: 'Welcome!', template: 'welcome' },
    { delay_hours: 48, subject: 'Special preview', template: 'preview' }
  ]
});

// Get campaign analytics
const analytics = await client.bookmarketing.campaigns.analytics(campaign.campaign_id, {
  start_date: '2025-01-01',
  end_date: '2025-01-31',
  granularity: 'daily'
});

console.log(`ROAS: ${analytics.summary.roas}x`);
```

### Python

```python
from nexus_sdk import NexusClient

client = NexusClient(api_key=os.environ["NEXUS_API_KEY"])

# Create launch campaign
campaign = client.bookmarketing.campaigns.create(
    project_id="proj_abc123",
    campaign_type="launch",
    name="New Release Launch",
    budget=2000,
    channels=["amazon_ads", "facebook", "email"],
    duration_days=30
)

# Configure Facebook audience
client.bookmarketing.ads.facebook.create(
    campaign_id=campaign["campaign_id"],
    objective="conversions",
    daily_budget=25,
    audience={
        "interests": ["Fantasy books", "Epic fantasy"],
        "age_min": 25,
        "age_max": 55,
        "locations": [{"country": "US"}, {"country": "GB"}]
    },
    creatives=[{
        "type": "image",
        "image_url": "https://example.com/cover.jpg",
        "headline": "Epic Fantasy Adventure",
        "call_to_action": "SHOP_NOW"
    }]
)

# Schedule social media content
client.bookmarketing.social.campaigns.create(
    campaign_id=campaign["campaign_id"],
    platforms=["twitter", "instagram"],
    content_calendar={
        "generate_ai": True,
        "posts_per_day": 2,
        "content_types": ["promotional", "quotes", "engagement"]
    }
)
```

---

## Webhook Events

### Available Events

| Event | Description |
|-------|-------------|
| `campaign.created` | New campaign created |
| `campaign.started` | Campaign activated |
| `campaign.paused` | Campaign paused |
| `campaign.completed` | Campaign ended |
| `campaign.budget_alert` | Budget threshold reached |
| `ad.approved` | Ad approved by platform |
| `ad.rejected` | Ad rejected by platform |
| `email.sent` | Email sequence email sent |
| `email.bounced` | Email bounced |
| `contact.subscribed` | New contact added |
| `contact.purchased` | Contact made purchase |
| `bookbub.accepted` | BookBub deal accepted |
| `bookbub.rejected` | BookBub deal rejected |

### Webhook Payload

```json
{
  "event": "campaign.budget_alert",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "campaign_id": "camp_abc123",
    "budget": 2000,
    "spent": 1800,
    "percentage_used": 90,
    "alert_type": "90_percent"
  },
  "metadata": {
    "organization_id": "org_xyz789",
    "project_id": "proj_abc123"
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "CAMPAIGN_BUDGET_EXCEEDED",
    "message": "Campaign budget of $2000 has been exceeded",
    "details": {
      "current_spend": 2150,
      "budget": 2000,
      "overage": 150
    },
    "request_id": "req_abc123"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `CAMPAIGN_NOT_FOUND` | 404 | Campaign does not exist |
| `CAMPAIGN_BUDGET_EXCEEDED` | 400 | Spending exceeds budget |
| `INVALID_CHANNEL_CONFIG` | 400 | Channel configuration invalid |
| `AD_PLATFORM_ERROR` | 502 | Error from ad platform |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INSUFFICIENT_PERMISSIONS` | 403 | Missing required scope |
| `EMAIL_LIST_EMPTY` | 400 | No contacts in email list |
| `BOOKBUB_SUBMISSION_FAILED` | 400 | BookBub submission requirements not met |

---

## Deployment Requirements

### Container Specifications

| Resource | Value |
|----------|-------|
| CPU | 1000m (1 core) |
| Memory | 2048 MB |
| Disk | 10 GB |
| Timeout | 300,000 ms (5 min) |
| Max Concurrent Jobs | 20 |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AMAZON_ADS_CLIENT_ID` | Yes | Amazon Advertising API client ID |
| `AMAZON_ADS_CLIENT_SECRET` | Yes | Amazon Advertising API secret |
| `FACEBOOK_APP_ID` | Yes | Facebook App ID |
| `FACEBOOK_APP_SECRET` | Yes | Facebook App Secret |
| `BOOKBUB_PARTNER_ID` | Yes | BookBub partner ID |
| `MAILCHIMP_API_KEY` | Yes | Mailchimp API key |
| `NETGALLEY_API_KEY` | Optional | NetGalley integration |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis for caching |
| `MAGEAGENT_URL` | Yes | MageAgent service URL |

### Health Checks

| Endpoint | Purpose |
|----------|---------|
| `/marketing/api/health` | General health check |
| `/marketing/api/health/ready` | Readiness probe |
| `/marketing/api/health/live` | Liveness probe |

---

## Quotas and Limits

### By Pricing Tier

| Limit | Starter | Author | Pro Publisher | Enterprise |
|-------|---------|--------|---------------|------------|
| Campaigns/month | 2 | 10 | 50 | Unlimited |
| Ad Spend Managed | $500/mo | $2,500/mo | $10,000/mo | Unlimited |
| Email Subscribers | 1,000 | 10,000 | 50,000 | Unlimited |
| Social Accounts | 2 | 5 | 15 | Unlimited |
| Amazon Ads | - | Yes | Yes | Yes |
| Facebook Ads | - | Yes | Yes | Yes |
| BookBub Integration | - | - | Yes | Yes |
| NetGalley Integration | - | - | Yes | Yes |

### Pricing

| Tier | Monthly | Annual |
|------|---------|--------|
| Starter | $39 | $390 |
| Author | $99 | $990 |
| Pro Publisher | $299 | $2,990 |
| Enterprise | $799 | $7,990 |

---

## Support

- **Documentation**: [docs.adverant.ai/plugins/bookmarketing](https://docs.adverant.ai/plugins/bookmarketing)
- **Discord**: [discord.gg/adverant](https://discord.gg/adverant)
- **Email**: support@adverant.ai
- **GitHub Issues**: [Report a bug](https://github.com/adverant/Adverant-Nexus-Plugin-BookMarketing/issues)
