# BookMarketing Quick Start Guide

**AI-powered book marketing automation** - Streamline your Amazon Ads, Facebook Ads, BookBub, and email marketing campaigns from a single unified platform.

---

## The BookMarketing Advantage

| Feature | Manual Marketing | BookMarketing |
|---------|------------------|---------------|
| Campaign Setup | Multiple platforms | Unified dashboard |
| Audience Targeting | Manual configuration | AI-assisted optimization |
| Cross-Platform Management | Separate dashboards | Single interface |
| Analytics | Scattered data | Consolidated reporting |

**Results vary based on book genre, market conditions, and campaign strategy.**

---

## Prerequisites

| Requirement | Minimum | Purpose |
|-------------|---------|---------|
| Nexus Platform | v1.0.0+ | Plugin runtime |
| Node.js | v20+ | SDK (TypeScript) |
| Python | v3.9+ | SDK (Python) |
| API Key | - | Authentication |
| Ad Platform Accounts | - | Amazon Ads, Facebook (optional) |

---

## Installation (Choose Your Method)

### Method 1: Nexus Marketplace (Recommended)

1. Navigate to **Marketplace** in your Nexus Dashboard
2. Search for "BookMarketing"
3. Click **Install** and select your tier
4. The plugin activates automatically within 60 seconds

### Method 2: Nexus CLI

```bash
nexus plugin install nexus-bookmarketing
nexus config set BOOKMARKETING_API_KEY your-api-key-here
```

### Method 3: Direct API

```bash
curl -X POST "https://api.adverant.ai/v1/plugins/install" \
  -H "Authorization: Bearer YOUR_NEXUS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "pluginId": "nexus-bookmarketing",
    "tier": "author",
    "autoActivate": true
  }'
```

---

## Your First Campaign: Step-by-Step

### Step 1: Set Your API Key

```bash
export NEXUS_API_KEY="your-api-key-here"
```

### Step 2: Create a Marketing Campaign

```bash
curl -X POST "https://api.adverant.ai/proxy/nexus-bookmarketing/marketing/api/campaigns" \
  -H "Authorization: Bearer $NEXUS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dragon Realm Launch Campaign",
    "bookAsin": "B0ABC123DEF",
    "bookTitle": "The Dragon Realm",
    "genre": "fantasy",
    "budget": {
      "daily": 50.00,
      "total": 1500.00
    },
    "channels": ["amazon_ads", "facebook"],
    "goals": {
      "primary": "sales",
      "targetRoas": 3.0
    },
    "startDate": "2026-01-15",
    "endDate": "2026-02-15"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "camp_Xyz789",
    "name": "Dragon Realm Launch Campaign",
    "status": "draft",
    "channels": ["amazon_ads", "facebook"],
    "aiRecommendations": {
      "suggestedKeywords": ["epic fantasy", "dragon books", "fantasy series"],
      "audienceSize": 2400000,
      "estimatedReach": 150000,
      "projectedRoas": 3.4,
      "optimalBidRange": {
        "min": 0.35,
        "max": 0.75
      }
    },
    "createdAt": "2026-01-01T10:00:00Z"
  }
}
```

### Step 3: Launch Amazon Ads Campaign

```bash
curl -X POST "https://api.adverant.ai/proxy/nexus-bookmarketing/marketing/api/ads/amazon" \
  -H "Authorization: Bearer $NEXUS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "camp_Xyz789",
    "adType": "sponsored_products",
    "targeting": {
      "keywords": ["epic fantasy books", "dragon fantasy", "magic kingdom"],
      "categories": ["Kindle eBooks > Science Fiction & Fantasy > Fantasy"],
      "asins": ["B0COMPETITOR1", "B0COMPETITOR2"]
    },
    "bidStrategy": "dynamic_bids_down",
    "defaultBid": 0.55
  }'
```

### Step 4: Monitor Campaign Analytics

```bash
curl -X GET "https://api.adverant.ai/proxy/nexus-bookmarketing/marketing/api/campaigns/camp_Xyz789/analytics" \
  -H "Authorization: Bearer $NEXUS_API_KEY"
```

**Response:**
```json
{
  "campaignId": "camp_Xyz789",
  "period": "last_7_days",
  "metrics": {
    "impressions": 45000,
    "clicks": 1350,
    "ctr": 0.03,
    "spend": 350.00,
    "sales": 1190.00,
    "orders": 170,
    "roas": 3.4,
    "acos": 0.29
  },
  "byChannel": {
    "amazon_ads": {
      "spend": 250.00,
      "sales": 875.00,
      "roas": 3.5
    },
    "facebook": {
      "spend": 100.00,
      "sales": 315.00,
      "roas": 3.15
    }
  },
  "aiInsights": [
    "Top performing keyword: 'epic fantasy books' (4.2x ROAS)",
    "Consider increasing budget for weekends (+23% conversion)",
    "Audience segment 'Fantasy Series Readers' outperforming by 40%"
  ]
}
```

---

## Core API Endpoints

**Base URL:** `https://api.adverant.ai/proxy/nexus-bookmarketing/marketing/api`

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| `POST` | `/campaigns` | Create marketing campaign | 10/min |
| `GET` | `/campaigns/:id` | Get campaign details | 60/min |
| `GET` | `/campaigns/:id/analytics` | Get campaign analytics | 60/min |
| `PUT` | `/campaigns/:id/pause` | Pause campaign | 30/min |
| `POST` | `/ads/amazon` | Create Amazon Ads campaign | 10/min |
| `POST` | `/ads/facebook` | Create Facebook campaign | 10/min |
| `POST` | `/ads/bookbub/featured-deal` | Apply for BookBub Featured Deal | 5/min |
| `POST` | `/email/sequences` | Create email sequence | 10/min |
| `POST` | `/social/campaigns` | Schedule social campaign | 30/min |
| `GET` | `/analytics/dashboard/:projectId` | Get dashboard data | 60/min |

---

## SDK Examples

### TypeScript/JavaScript

```typescript
import { NexusClient } from '@adverant/nexus-sdk';

const nexus = new NexusClient({
  apiKey: process.env.NEXUS_API_KEY!
});

const marketing = nexus.plugin('nexus-bookmarketing');

// Create a multi-channel campaign
const campaign = await marketing.campaigns.create({
  name: "Summer Romance Promo",
  bookAsin: "B0ABC123DEF",
  bookTitle: "Love in Bloom",
  genre: "romance",
  budget: {
    daily: 75.00,
    total: 2000.00
  },
  channels: ["amazon_ads", "facebook", "bookbub"],
  goals: {
    primary: "sales",
    targetRoas: 3.0
  }
});

console.log(`Campaign created: ${campaign.campaignId}`);
console.log(`Projected ROAS: ${campaign.aiRecommendations.projectedRoas}`);

// Set up Amazon Ads with AI-optimized keywords
const amazonAds = await marketing.ads.amazon.create({
  campaignId: campaign.campaignId,
  adType: "sponsored_products",
  targeting: {
    useAiKeywords: true,
    maxKeywords: 50,
    includeCompetitorAsins: true
  },
  bidStrategy: "dynamic_bids_up_and_down",
  defaultBid: 0.65
});

// Create email sequence for launch
const emailSequence = await marketing.email.sequences.create({
  campaignId: campaign.campaignId,
  name: "Launch Sequence",
  listId: "list_subscribers",
  emails: [
    {
      subject: "The wait is over! {{book_title}} is LIVE",
      delay: 0,
      template: "book_launch"
    },
    {
      subject: "Readers are loving {{book_title}} (Early reviews inside)",
      delay: 3,
      template: "social_proof"
    },
    {
      subject: "Last chance: {{book_title}} launch price ends soon",
      delay: 7,
      template: "urgency"
    }
  ]
});

console.log(`Email sequence created with ${emailSequence.emails.length} emails`);

// Get real-time analytics
const analytics = await marketing.campaigns.analytics({
  campaignId: campaign.campaignId,
  period: "last_30_days",
  breakdown: ["channel", "day"]
});

console.log(`Total ROAS: ${analytics.metrics.roas}`);
console.log(`Best channel: ${analytics.topPerformer.channel}`);
```

### Python

```python
import os
from nexus_sdk import NexusClient

client = NexusClient(api_key=os.environ["NEXUS_API_KEY"])
marketing = client.plugin("nexus-bookmarketing")

# Create campaign with AI optimization
campaign = marketing.campaigns.create(
    name="Thriller Series Launch",
    book_asin="B0XYZ789ABC",
    book_title="The Last Witness",
    genre="thriller",
    budget={
        "daily": 100.00,
        "total": 3000.00
    },
    channels=["amazon_ads", "facebook"],
    goals={
        "primary": "sales",
        "target_roas": 3.5
    },
    ai_optimization=True
)

print(f"Campaign: {campaign.campaign_id}")
print(f"AI-suggested keywords: {campaign.ai_recommendations.suggested_keywords}")

# Apply for BookBub Featured Deal
bookbub = marketing.ads.bookbub.apply_featured_deal(
    campaign_id=campaign.campaign_id,
    book_asin="B0XYZ789ABC",
    deal_price=0.99,
    original_price=4.99,
    categories=["Mystery & Thrillers", "Suspense"],
    book_description="A gripping thriller that will keep you up all night...",
    reviews_count=150,
    average_rating=4.3
)

print(f"BookBub application status: {bookbub.status}")
print(f"Estimated acceptance: {bookbub.acceptance_probability}%")

# Schedule social media campaign
social = marketing.social.campaigns.create(
    campaign_id=campaign.campaign_id,
    platforms=["twitter", "instagram", "facebook"],
    posts=[
        {
            "content": "The Last Witness is HERE! Grab your copy now: {{book_link}}",
            "media_url": "https://storage.example.com/cover.jpg",
            "schedule": "2026-01-15T09:00:00Z"
        },
        {
            "content": "5-star review: 'Couldn't put it down!' What are you waiting for?",
            "schedule": "2026-01-17T12:00:00Z"
        }
    ],
    hashtags=["#ThrillerBooks", "#NewRelease", "#MustRead"]
)

print(f"Social campaign scheduled: {social.posts_scheduled} posts")
```

---

## Pricing

| Feature | Starter | Author | Pro Publisher | Enterprise |
|---------|---------|--------|---------------|------------|
| **Monthly Price** | $39 | $99 | $299 | $799 |
| **Campaigns/Month** | 2 | 10 | 50 | Unlimited |
| **Ad Spend Limit** | $500 | $2,500 | $10,000 | Unlimited |
| **Email Subscribers** | 1,000 | 10,000 | 50,000 | Unlimited |
| **Social Accounts** | 2 | 5 | 15 | Unlimited |
| **Amazon Ads** | - | Yes | Yes | Yes |
| **Facebook Ads** | - | Yes | Yes | Yes |
| **BookBub Integration** | - | - | Yes | Yes |
| **NetGalley Integration** | - | - | Yes | Yes |
| **CRM Integration** | - | Yes | Yes | Yes |
| **Advanced Analytics** | - | - | Yes | Yes |
| **White-Label Reports** | - | - | - | Yes |

**14-day free trial. No credit card required.**

[Start Free Trial](https://marketplace.adverant.ai/plugins/nexus-bookmarketing)

---

## Rate Limits

| Tier | Requests/Minute | Concurrent Jobs | Timeout |
|------|-----------------|-----------------|---------|
| Starter | 30 | 5 | 60s |
| Author | 60 | 10 | 180s |
| Pro Publisher | 120 | 20 | 300s |
| Enterprise | Custom | Custom | Custom |

---

## Next Steps

1. **[Use Cases Guide](./USE-CASES.md)** - Book launch strategies and campaign workflows
2. **[Architecture Overview](./ARCHITECTURE.md)** - System design and integrations
3. **[API Reference](./docs/api-reference/endpoints.md)** - Complete endpoint documentation

---

## Support

| Channel | Response Time | Availability |
|---------|---------------|--------------|
| **Documentation** | Instant | [docs.adverant.ai/plugins/bookmarketing](https://docs.adverant.ai/plugins/bookmarketing) |
| **Discord Community** | < 2 hours | [discord.gg/adverant](https://discord.gg/adverant) |
| **Email Support** | < 24 hours | support@adverant.ai |
| **Priority Support** | < 1 hour | Enterprise only |

---

*BookMarketing is built and maintained by [Adverant](https://adverant.ai) - Verified Nexus Plugin Developer*
