
<h1 align="center">BookMarketing</h1>

<p align="center">
  <strong>AI-Driven Book Marketing Campaigns</strong>
</p>

<p align="center">
  <a href="https://github.com/adverant/Adverant-Nexus-Plugin-BookMarketing/actions"><img src="https://github.com/adverant/Adverant-Nexus-Plugin-BookMarketing/workflows/CI/badge.svg" alt="CI Status"></a>
  <a href="https://github.com/adverant/Adverant-Nexus-Plugin-BookMarketing/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License"></a>
  <a href="https://marketplace.adverant.ai/plugins/bookmarketing"><img src="https://img.shields.io/badge/Nexus-Marketplace-purple.svg" alt="Nexus Marketplace"></a>
  <a href="https://discord.gg/adverant"><img src="https://img.shields.io/badge/Discord-Community-7289da.svg" alt="Discord"></a>
</p>

<p align="center">
  <a href="#features">Features</a> |
  <a href="#quick-start">Quick Start</a> |
  <a href="#use-cases">Use Cases</a> |
  <a href="#pricing">Pricing</a> |
  <a href="#documentation">Documentation</a>
</p>

---

## Launch Your Book to Bestseller Status

**BookMarketing** is a Nexus Marketplace plugin that automates your entire book marketing strategy. From social media campaigns to Amazon Ads, email sequences to BookBub promotions, let AI handle your marketing while you focus on writing your next book.

### Why Authors Choose BookMarketing

- **Multi-Channel Campaigns**: Coordinate Amazon Ads, Facebook, BookBub, email, and social media
- **AI-Generated Content**: MageAgent creates compelling ad copy and social posts
- **Smart Budget Allocation**: Automatic optimization based on real-time ROI
- **Performance Analytics**: Track sales, conversions, and ROAS across all channels
- **Launch Automation**: Complete 30-day launch sequences at the click of a button

---

## Features

### Campaign Orchestration

Coordinate marketing across all channels from a single dashboard:

| Channel | Capabilities |
|---------|--------------|
| **Amazon Ads** | Sponsored Products, Sponsored Brands, keyword optimization |
| **Facebook/Instagram** | Lookalike audiences, creative A/B testing, retargeting |
| **BookBub** | Featured Deals, BookBub Ads, genre targeting |
| **Email Marketing** | Automated sequences, list segmentation, performance tracking |
| **Social Media** | Multi-platform scheduling, engagement tracking, content calendar |

### Advertising Platform Integration

#### Amazon Ads
- Sponsored Products and Sponsored Brands campaigns
- Automatic keyword research and bid optimization
- ACOS tracking and budget management
- Competitor analysis and category targeting

#### Facebook & Instagram
- Custom audience creation from reader lists
- Lookalike audience expansion
- Dynamic creative optimization
- Video and carousel ads support

#### BookBub
- Featured Deal applications with optimal timing
- BookBub Ads for targeted genre readers
- New Release promotions
- Price drop alerts

### Email Marketing Automation

Automated email sequences for every stage:

- **Welcome Series**: Onboard new subscribers with free content
- **Launch Campaigns**: Build anticipation with countdown sequences
- **Nurture Flows**: Keep readers engaged between releases
- **Win-Back Campaigns**: Re-engage dormant subscribers

### Social Media Management

- **30-Day Content Calendar**: AI-generated posts scheduled in advance
- **Multi-Platform Publishing**: Twitter, Facebook, Instagram, TikTok
- **Engagement Tracking**: Likes, comments, shares, click-through rates
- **Optimal Timing**: Post at peak engagement times for your audience

### CRM Integration

Built-in reader relationship management:

- **Contact Lifecycle**: Track leads, prospects, customers, and advocates
- **Engagement Scoring**: Identify your most engaged readers (0-100 score)
- **Segmentation**: Target campaigns based on behavior and preferences
- **NexusCRM Sync**: Seamless integration with Nexus CRM

### ARC Distribution

Manage Advance Reader Copy campaigns:

- **NetGalley Integration**: Automated ARC distribution
- **Reviewer Tracking**: Monitor who requested and reviewed
- **Review Collection**: Gather reviews before launch day
- **Genre Matching**: Find reviewers in your specific genre

### Analytics Dashboard

Real-time performance insights:

- **Sales Attribution**: Track sales by marketing channel
- **ROI Calculation**: Understand true return on marketing spend
- **Performance Metrics**: ACOS, ROAS, CPA, CTR, conversion rates
- **Report Generation**: Export PDF reports for stakeholders

---

## Quick Start

### Installation

```bash
# Via Nexus Marketplace (Recommended)
nexus plugin install nexus-bookmarketing

# Or via API
curl -X POST "https://api.adverant.ai/plugins/nexus-bookmarketing/install" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Create Launch Campaign

```bash
curl -X POST "https://api.adverant.ai/proxy/nexus-bookmarketing/marketing/api/campaigns" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "your-book-project-id",
    "campaign_type": "launch",
    "budget": 2000,
    "channels": ["amazon_ads", "facebook", "bookbub", "email", "social"],
    "duration_days": 30
  }'
```

### Get Campaign Analytics

```bash
curl "https://api.adverant.ai/proxy/nexus-bookmarketing/marketing/api/campaigns/:id/analytics" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Create Email Sequence

```bash
curl -X POST "https://api.adverant.ai/proxy/nexus-bookmarketing/marketing/api/email/sequences" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Release Launch",
    "trigger": "new_subscriber",
    "emails": [
      {"delay_hours": 0, "subject": "Welcome! Your free chapter awaits..."},
      {"delay_hours": 48, "subject": "Did you enjoy the preview?"},
      {"delay_hours": 168, "subject": "Launch day is here!"}
    ]
  }'
```

---

## Use Cases

### For Indie Authors

#### 1. Book Launch Automation
Set up a complete 30-day launch campaign with a single click. From pre-launch buzz to post-launch momentum, BookMarketing handles every step.

#### 2. Consistent Marketing
Maintain a steady marketing presence between book releases. Keep your backlist selling while you write the next one.

#### 3. Budget Optimization
Get the most out of limited marketing budgets. AI automatically shifts spend to highest-performing channels.

### For Publishing Houses

#### 4. Portfolio Management
Manage marketing for hundreds of titles from a single dashboard. Compare performance across authors and genres.

#### 5. Author Support
Provide authors with professional marketing tools and reporting. Demonstrate ROI on marketing investments.

### For Marketing Teams

#### 6. Campaign Templates
Create reusable campaign templates for different book types. Romance launches vs. thriller launches optimized separately.

#### 7. Cross-Promotion
Coordinate marketing across author catalogs. Recommend similar authors to engaged readers.

---

## Architecture

```
+------------------------------------------------------------------+
|                      BookMarketing Plugin                         |
+------------------------------------------------------------------+
|  +----------------+  +--------------+  +----------------------+  |
|  | Campaign      |  |  CRM         |  | Analytics            |  |
|  | Orchestrator  |  |  Integration |  | Engine               |  |
|  +-------+-------+  +------+-------+  +----------+-----------+  |
|          |                 |                     |               |
|          v                 v                     v               |
|  +-----------------------------------------------------------+  |
|  |                 Advertising Managers                        |  |
|  |  +----------+ +----------+ +----------+ +----------+       |  |
|  |  |  Amazon  | | Facebook | | BookBub  | |  Email   |       |  |
|  |  |   Ads    | |   Ads    | |   Ads    | | Manager  |       |  |
|  |  +----------+ +----------+ +----------+ +----------+       |  |
|  +-----------------------------------------------------------+  |
|          |                                                       |
|          v                                                       |
|  +-----------------------------------------------------------+  |
|  |                 Social Media Scheduler                      |  |
|  |    Twitter | Facebook | Instagram | TikTok                  |  |
|  +-----------------------------------------------------------+  |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                    Nexus Core Services                            |
|  +----------+  +----------+  +----------+  +----------+          |
|  |MageAgent |  | NexusCRM |  | Billing  |  | GraphRAG |          |
|  | (AI Copy)|  | (Contacts)|  |(Usage)  |  | (Data)   |          |
|  +----------+  +----------+  +----------+  +----------+          |
+------------------------------------------------------------------+
```

---

## Cost Breakdown

### Typical Book Launch (30 days)

| Channel | Budget | Expected Results |
|---------|--------|------------------|
| Amazon Ads | $1,000 (50%) | 50,000 impressions, 1,000 clicks |
| Facebook Ads | $400 (20%) | 30,000 reach, 500 clicks |
| BookBub Deal | $500 (one-time) | 200-500 sales |
| Email Service | $30/mo | 10,000 sends |
| Social Media | $0 (organic) | 5,000 impressions |
| NetGalley | $450 | 50 reviewers |
| **Total** | **$2,380** | |

**Expected ROI:**
- 50,000+ impressions
- 500-1,000 clicks
- 20-50 sales
- 10-20 reviews
- **ROI: 150-300%**

---

## Pricing

| Feature | Starter | Author | Pro Publisher | Enterprise |
|---------|---------|--------|---------------|------------|
| **Price** | $39/mo | $99/mo | $299/mo | $799/mo |
| **Campaigns/month** | 2 | 10 | 50 | Unlimited |
| **Ad Spend Management** | $500/mo | $2,500/mo | $10,000/mo | Unlimited |
| **Email Subscribers** | 1,000 | 10,000 | 50,000 | Unlimited |
| **Social Accounts** | 2 | 5 | 15 | Unlimited |
| **Amazon Ads** | - | Yes | Yes | Yes |
| **Facebook Ads** | - | Yes | Yes | Yes |
| **BookBub Integration** | - | - | Yes | Yes |
| **NetGalley Integration** | - | - | Yes | Yes |
| **White-Label Reports** | - | - | - | Yes |
| **Dedicated Support** | - | - | - | Yes |

[View on Nexus Marketplace](https://marketplace.adverant.ai/plugins/bookmarketing)

---

## Performance Targets

| Metric | Target | Description |
|--------|--------|-------------|
| **ACOS** | <30% | Amazon Advertising Cost of Sale |
| **ROAS** | >3.0x | Return on Ad Spend |
| **ROI** | >200% | Overall Campaign Return |
| **Email Open Rate** | >25% | Industry: 15-25% |
| **Email Click Rate** | >3% | Industry: 2-5% |
| **Social Engagement** | >1.5% | Likes + Comments / Reach |

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/campaigns` | Create marketing campaign |
| `GET` | `/campaigns/:id` | Get campaign details |
| `GET` | `/campaigns/:id/analytics` | Get campaign analytics |
| `PUT` | `/campaigns/:id/pause` | Pause campaign |
| `POST` | `/ads/amazon` | Create Amazon Ads campaign |
| `POST` | `/ads/facebook` | Create Facebook campaign |
| `POST` | `/ads/bookbub/featured-deal` | Apply for BookBub Featured Deal |
| `POST` | `/email/sequences` | Create email sequence |
| `POST` | `/email/contacts` | Add CRM contact |
| `POST` | `/social/campaigns` | Schedule social campaign |
| `GET` | `/analytics/dashboard/:projectId` | Get dashboard data |
| `POST` | `/analytics/reports` | Generate PDF report |

Full API documentation: [docs/api-reference/endpoints.md](docs/api-reference/endpoints.md)

---

## Documentation

- [Installation Guide](docs/getting-started/installation.md)
- [Configuration](docs/getting-started/configuration.md)
- [Quick Start](docs/getting-started/quickstart.md)
- [API Reference](docs/api-reference/endpoints.md)
- [Amazon Ads Guide](docs/guides/amazon-ads.md)
- [Email Marketing Guide](docs/guides/email-marketing.md)

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/adverant/Adverant-Nexus-Plugin-BookMarketing.git
cd Adverant-Nexus-Plugin-BookMarketing

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

---

## Community & Support

- **Documentation**: [docs.adverant.ai/plugins/bookmarketing](https://docs.adverant.ai/plugins/bookmarketing)
- **Discord**: [discord.gg/adverant](https://discord.gg/adverant)
- **Email**: support@adverant.ai
- **GitHub Issues**: [Report a bug](https://github.com/adverant/Adverant-Nexus-Plugin-BookMarketing/issues)

---

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with care by <a href="https://adverant.ai">Adverant</a></strong>
</p>

<p align="center">
  <a href="https://adverant.ai">Website</a> |
  <a href="https://docs.adverant.ai">Docs</a> |
  <a href="https://marketplace.adverant.ai">Marketplace</a> |
  <a href="https://twitter.com/adverant">Twitter</a>
</p>
