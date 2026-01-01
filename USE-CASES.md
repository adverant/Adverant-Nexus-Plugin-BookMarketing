# BookMarketing Use Cases

Real-world marketing strategies and campaign workflows for maximizing book sales.

---

## Use Case 1: New Book Launch Campaign

### Problem

Authors spend weeks manually setting up ads across multiple platforms. Without coordination, launch momentum is lost and ad spend is wasted on poorly optimized campaigns.

### Solution

Unified multi-channel launch campaign with AI-optimized targeting and coordinated timing.

### Implementation

```typescript
import { NexusClient } from '@adverant/nexus-sdk';

class BookLaunchCampaign {
  private marketing;

  constructor(nexusClient: NexusClient) {
    this.marketing = nexusClient.plugin('nexus-bookmarketing');
  }

  async executeLaunch(launchConfig: LaunchConfig) {
    // Create master campaign
    const campaign = await this.marketing.campaigns.create({
      name: `${launchConfig.bookTitle} - Launch Campaign`,
      bookAsin: launchConfig.asin,
      bookTitle: launchConfig.bookTitle,
      genre: launchConfig.genre,
      budget: {
        daily: launchConfig.dailyBudget,
        total: launchConfig.totalBudget
      },
      channels: ['amazon_ads', 'facebook', 'email'],
      goals: {
        primary: 'sales',
        targetRoas: 3.0,
        rankGoal: 'top_100_category'
      },
      startDate: launchConfig.launchDate
    });

    // Pre-launch email blast (3 days before)
    const prelaunchEmail = await this.marketing.email.campaigns.create({
      campaignId: campaign.campaignId,
      name: 'Pre-Launch Announcement',
      type: 'broadcast',
      schedule: this.daysBeforeLaunch(launchConfig.launchDate, 3),
      subject: `Coming in 3 days: ${launchConfig.bookTitle}`,
      template: 'prelaunch_announcement',
      listIds: ['newsletter', 'super_fans']
    });

    // Launch day Amazon Ads
    const amazonCampaign = await this.marketing.ads.amazon.create({
      campaignId: campaign.campaignId,
      adType: 'sponsored_products',
      targeting: {
        useAiKeywords: true,
        keywordMatch: ['broad', 'phrase', 'exact'],
        categories: launchConfig.categories,
        competitorAsins: launchConfig.comparableTitles
      },
      bidStrategy: 'dynamic_bids_up_and_down',
      defaultBid: 0.75, // Aggressive for launch
      dayParting: {
        enabled: true,
        peakHours: [7, 8, 9, 19, 20, 21, 22] // Morning and evening
      }
    });

    // Facebook lookalike campaign
    const facebookCampaign = await this.marketing.ads.facebook.create({
      campaignId: campaign.campaignId,
      objective: 'conversions',
      audience: {
        type: 'lookalike',
        source: 'past_purchasers',
        percentage: 2, // Top 2% similarity
        interests: launchConfig.interests
      },
      creative: {
        type: 'carousel',
        images: launchConfig.adImages,
        headline: `New Release: ${launchConfig.bookTitle}`,
        primaryText: launchConfig.bookBlurb,
        callToAction: 'shop_now'
      },
      budget: {
        type: 'daily',
        amount: launchConfig.dailyBudget * 0.4 // 40% to Facebook
      }
    });

    // Social media posts
    const socialPosts = await this.marketing.social.schedule({
      campaignId: campaign.campaignId,
      platforms: ['twitter', 'instagram', 'facebook'],
      posts: [
        {
          content: `IT'S LIVE! ${launchConfig.bookTitle} is now available! Link in bio. #NewRelease`,
          schedule: launchConfig.launchDate,
          media: launchConfig.coverImage
        },
        {
          content: `Early readers are calling it "${launchConfig.pullQuote}" Get your copy now!`,
          schedule: this.hoursAfterLaunch(launchConfig.launchDate, 6)
        },
        {
          content: `Thank you for making ${launchConfig.bookTitle} a bestseller! 🎉`,
          schedule: this.daysAfterLaunch(launchConfig.launchDate, 2)
        }
      ]
    });

    return {
      campaign,
      amazonCampaign,
      facebookCampaign,
      prelaunchEmail,
      socialPosts,
      projectedResults: campaign.aiRecommendations.projectedRoas
    };
  }
}
```

### Business Impact

- **Coordinated multi-channel launch** with unified tracking
- **Improved launch momentum** through synchronized campaigns
- **Reduced wasted ad spend** through optimization
- **Automated rank tracking** and budget reallocation

---

## Use Case 2: Amazon Ads Optimization

### Problem

Authors waste 40-60% of their Amazon Ads budget on underperforming keywords. Manual bid management is time-consuming and always reactive.

### Solution

AI-powered keyword discovery, automatic bid optimization, and ACOS management.

### Implementation

```python
class AmazonAdsOptimizer:
    def __init__(self, nexus_client):
        self.marketing = nexus_client.plugin("nexus-bookmarketing")

    async def create_optimized_campaign(self, book_info: dict):
        # Get AI keyword recommendations
        keywords = await self.marketing.ads.amazon.research_keywords(
            asin=book_info["asin"],
            genre=book_info["genre"],
            comparable_titles=book_info["comp_asins"],
            max_keywords=100,
            include_long_tail=True
        )

        # Segment keywords by intent
        campaign_structure = {
            "brand_defense": [k for k in keywords if k["intent"] == "brand"],
            "category": [k for k in keywords if k["intent"] == "category"],
            "competitor": [k for k in keywords if k["intent"] == "competitor"],
            "generic": [k for k in keywords if k["intent"] == "generic"]
        }

        # Create segmented ad groups
        ad_groups = []
        for segment_name, segment_keywords in campaign_structure.items():
            ad_group = await self.marketing.ads.amazon.create_ad_group(
                campaign_id=book_info["campaign_id"],
                name=f"{book_info['title']} - {segment_name}",
                targeting_type="keyword",
                keywords=[
                    {
                        "keyword": k["keyword"],
                        "match_type": k["recommended_match"],
                        "bid": k["recommended_bid"]
                    }
                    for k in segment_keywords[:25]  # Top 25 per segment
                ],
                negative_keywords=keywords.get("negatives", [])
            )
            ad_groups.append(ad_group)

        # Enable auto-optimization rules
        await self.marketing.ads.amazon.set_optimization_rules(
            campaign_id=book_info["campaign_id"],
            rules=[
                {
                    "name": "Pause Low Performers",
                    "condition": {"acos": {"gte": 0.70}, "clicks": {"gte": 20}},
                    "action": "pause_keyword"
                },
                {
                    "name": "Boost High Performers",
                    "condition": {"acos": {"lte": 0.25}, "orders": {"gte": 5}},
                    "action": {"increase_bid": 0.15}
                },
                {
                    "name": "Graduate Search Terms",
                    "condition": {"conversions": {"gte": 3}},
                    "action": "promote_to_exact_match"
                }
            ]
        )

        return {
            "ad_groups": ad_groups,
            "total_keywords": sum(len(ag["keywords"]) for ag in ad_groups),
            "estimated_daily_spend": keywords["estimated_spend"],
            "projected_acos": keywords["projected_acos"]
        }

    async def get_optimization_report(self, campaign_id: str, days: int = 30):
        report = await self.marketing.ads.amazon.analytics(
            campaign_id=campaign_id,
            period=f"last_{days}_days",
            breakdown=["keyword", "match_type", "placement"]
        )

        return {
            "total_spend": report["metrics"]["spend"],
            "total_sales": report["metrics"]["sales"],
            "acos": report["metrics"]["acos"],
            "top_keywords": report["top_performers"][:10],
            "keywords_to_pause": report["underperformers"],
            "search_terms_to_add": report["new_opportunities"],
            "ai_recommendations": report["ai_insights"]
        }
```

### Business Impact

- **Lower ACOS** through AI keyword management
- **More converting keywords** discovered automatically
- **Time saved** on manual bid adjustments
- **Real-time optimization** vs. weekly manual reviews

---

## Use Case 3: BookBub Featured Deal Application

### Problem

BookBub Featured Deals can sell 1,000+ copies in a day, but acceptance rates are under 20%. Authors apply blindly without understanding acceptance criteria.

### Solution

AI-powered application optimization that maximizes acceptance probability.

### Implementation

```typescript
class BookBubOptimizer {
  private marketing;

  constructor(nexusClient: NexusClient) {
    this.marketing = nexusClient.plugin('nexus-bookmarketing');
  }

  async assessBookBubReadiness(bookInfo: BookInfo) {
    // Analyze current book metrics
    const assessment = await this.marketing.ads.bookbub.assess({
      asin: bookInfo.asin,
      title: bookInfo.title,
      author: bookInfo.author,
      categories: bookInfo.categories,
      currentPrice: bookInfo.currentPrice,
      reviewCount: bookInfo.reviewCount,
      averageRating: bookInfo.averageRating,
      description: bookInfo.description
    });

    return {
      acceptanceProbability: assessment.probability,
      readinessScore: assessment.score,
      improvements: assessment.recommendations,
      optimalCategories: assessment.bestCategories,
      optimalDealPrice: assessment.suggestedPrice,
      optimalTiming: assessment.bestSubmissionDates,
      competitorAnalysis: assessment.categoryCompetition
    };
  }

  async submitOptimizedApplication(bookInfo: BookInfo, dealConfig: DealConfig) {
    // Pre-optimize the application
    const optimized = await this.marketing.ads.bookbub.optimize({
      asin: bookInfo.asin,
      description: bookInfo.description,
      categories: bookInfo.categories
    });

    // Submit the application
    const application = await this.marketing.ads.bookbub.applyFeaturedDeal({
      bookAsin: bookInfo.asin,
      title: bookInfo.title,
      author: bookInfo.author,
      dealPrice: optimized.optimalPrice || dealConfig.dealPrice,
      originalPrice: bookInfo.currentPrice,
      categories: optimized.bestCategories,
      description: optimized.enhancedDescription,
      buyLinks: {
        amazon: bookInfo.amazonUrl,
        kobo: bookInfo.koboUrl,
        apple: bookInfo.appleUrl
      },
      additionalInfo: {
        reviewCount: bookInfo.reviewCount,
        averageRating: bookInfo.averageRating,
        seriesPosition: bookInfo.seriesInfo,
        previousFeaturedDeals: bookInfo.previousDeals
      }
    });

    // Track application
    await this.marketing.ads.bookbub.trackApplication({
      applicationId: application.applicationId,
      notifyOnDecision: true,
      webhookUrl: dealConfig.webhookUrl
    });

    return {
      applicationId: application.applicationId,
      submittedAt: application.submittedAt,
      estimatedDecisionDate: application.estimatedDecision,
      acceptanceProbability: application.probability,
      projectedSales: application.projectedSalesIfAccepted,
      projectedRevenue: application.projectedRevenueIfAccepted
    };
  }

  async prepareForAcceptance(applicationId: string) {
    // If accepted, coordinate the promotion
    return await this.marketing.ads.bookbub.preparePromotion({
      applicationId,
      crossPromotion: {
        pauseAmazonAds: true, // Don't compete with yourself
        emailList: true,      // Notify your list
        socialMedia: true     // Coordinate social posts
      },
      followUp: {
        enabled: true,
        nextBookPromo: true,  // Promote next in series
        newsletterSignup: true // Capture new readers
      }
    });
  }
}
```

### Business Impact

- **Improved application quality** with AI optimization
- **Coordinated promotion** maximizes deal impact
- **Automatic follow-up** captures new readers for long-term value
- **Data-driven category selection** targets best opportunities

---

## Use Case 4: Email Marketing Automation

### Problem

Authors have email lists but don't know how to monetize them effectively. Sporadic newsletters don't convert, and authors don't have time to write sequences.

### Solution

AI-generated email sequences with behavior-based triggers and A/B testing.

### Implementation

```python
class EmailMarketingAutomation:
    def __init__(self, nexus_client):
        self.marketing = nexus_client.plugin("nexus-bookmarketing")

    async def create_reader_magnet_funnel(self, funnel_config: dict):
        # Create lead magnet landing page
        landing_page = await self.marketing.email.create_landing_page(
            name=funnel_config["name"],
            headline=funnel_config["headline"],
            lead_magnet={
                "type": "free_book",
                "title": funnel_config["free_book_title"],
                "delivery": "instant_download"
            },
            design="modern_author"
        )

        # Create welcome sequence
        welcome_sequence = await self.marketing.email.sequences.create(
            name=f"{funnel_config['name']} - Welcome Sequence",
            trigger="signup",
            landing_page_id=landing_page["page_id"],
            emails=[
                {
                    "subject": "Your free book is here! 📚",
                    "delay_hours": 0,
                    "template": "lead_magnet_delivery",
                    "ai_personalize": True
                },
                {
                    "subject": "Did you enjoy {{lead_magnet_title}}?",
                    "delay_hours": 72,
                    "template": "engagement_check",
                    "branch": {
                        "if_opened_previous": "enthusiast_path",
                        "if_not_opened": "re_engagement_path"
                    }
                },
                {
                    "subject": "Readers who loved {{lead_magnet_title}} also devoured this...",
                    "delay_hours": 120,
                    "template": "book_recommendation",
                    "featured_book": funnel_config["paid_book_asin"]
                },
                {
                    "subject": "Exclusive: {{first_name}}, here's a special offer just for you",
                    "delay_hours": 168,
                    "template": "special_offer",
                    "discount_code": "WELCOME20",
                    "urgency": "48_hours"
                }
            ]
        )

        return {
            "landing_page": landing_page,
            "sequence": welcome_sequence,
            "tracking_pixel": landing_page["tracking_pixel"],
            "estimated_conversion": "15-25%"
        }

    async def create_launch_sequence(self, launch_config: dict):
        # Create multi-phase launch sequence
        launch = await self.marketing.email.sequences.create(
            name=f"{launch_config['book_title']} Launch Sequence",
            trigger="manual",
            emails=[
                # Phase 1: Anticipation
                {
                    "subject": "Something special is coming...",
                    "delay_days": -14,
                    "template": "teaser",
                    "content_hints": ["cover_reveal_hint"]
                },
                {
                    "subject": "Cover Reveal: {{book_title}} 🎉",
                    "delay_days": -10,
                    "template": "cover_reveal",
                    "media": launch_config["cover_image"]
                },
                {
                    "subject": "First look: Read Chapter 1 of {{book_title}}",
                    "delay_days": -7,
                    "template": "sample_chapter",
                    "attachment": launch_config["chapter_1_pdf"]
                },
                # Phase 2: Launch
                {
                    "subject": "🚀 IT'S HERE! {{book_title}} is LIVE!",
                    "delay_days": 0,
                    "template": "launch_announcement",
                    "urgency": True,
                    "buy_links": launch_config["retailer_links"]
                },
                {
                    "subject": "Early readers are saying...",
                    "delay_days": 2,
                    "template": "social_proof",
                    "reviews": launch_config["early_reviews"]
                },
                # Phase 3: Last Chance
                {
                    "subject": "⏰ Last chance: Launch price ends tomorrow",
                    "delay_days": 6,
                    "template": "urgency_reminder",
                    "countdown": True
                }
            ],
            ab_testing={
                "enabled": True,
                "test_subject_lines": True,
                "sample_size": 0.2,
                "winner_criteria": "open_rate"
            }
        )

        return launch

    async def analyze_list_health(self, list_id: str):
        return await self.marketing.email.analytics.list_health(
            list_id=list_id,
            metrics=[
                "engagement_score",
                "open_rate_trend",
                "click_rate_trend",
                "unsubscribe_rate",
                "spam_complaints",
                "list_growth_rate"
            ],
            recommendations=True
        )
```

### Business Impact

- **Higher open rates** with AI-optimized subject lines
- **Improved conversion rates** on welcome sequences vs. single emails
- **Automated list hygiene** maintains deliverability
- **Behavior-based branching** personalizes the reader journey

---

## Use Case 5: Cross-Platform Analytics Dashboard

### Problem

Marketing data is scattered across Amazon Ads, Facebook Business Manager, email platforms, and sales dashboards. Authors can't see the full picture or true ROI.

### Solution

Unified analytics dashboard with attribution tracking and AI insights.

### Implementation

```typescript
class MarketingAnalytics {
  private marketing;

  constructor(nexusClient: NexusClient) {
    this.marketing = nexusClient.plugin('nexus-bookmarketing');
  }

  async getUnifiedDashboard(projectId: string, period: string = 'last_30_days') {
    const dashboard = await this.marketing.analytics.dashboard({
      projectId,
      period,
      includeChannels: ['amazon_ads', 'facebook', 'email', 'organic'],
      metrics: [
        'spend', 'impressions', 'clicks', 'conversions',
        'revenue', 'roas', 'cpa', 'ltv'
      ]
    });

    return {
      summary: {
        totalSpend: dashboard.totalSpend,
        totalRevenue: dashboard.totalRevenue,
        overallRoas: dashboard.overallRoas,
        topChannel: dashboard.topPerformingChannel,
        recommendations: dashboard.aiRecommendations
      },
      byChannel: dashboard.channelBreakdown,
      attribution: dashboard.attributionModel,
      trends: dashboard.trends,
      alerts: dashboard.alerts
    };
  }

  async getAttributionReport(projectId: string) {
    // Multi-touch attribution across all channels
    const attribution = await this.marketing.analytics.attribution({
      projectId,
      model: 'data_driven', // AI-powered attribution
      lookbackWindow: 30,
      channels: ['amazon_ads', 'facebook', 'email', 'social', 'organic']
    });

    return {
      touchpointAnalysis: attribution.touchpoints,
      conversionPaths: attribution.topPaths,
      channelContribution: attribution.channelValue,
      recommendations: [
        `${attribution.undervalued[0].channel} is undervalued - consider +${attribution.undervalued[0].suggestedIncrease}% budget`,
        `${attribution.overvalued[0].channel} may be over-credited - audit tracking`
      ]
    };
  }

  async generateMonthlyReport(projectId: string, month: string) {
    const report = await this.marketing.analytics.generateReport({
      projectId,
      period: month,
      format: 'pdf',
      sections: [
        'executive_summary',
        'channel_performance',
        'keyword_analysis',
        'audience_insights',
        'roi_analysis',
        'recommendations'
      ],
      comparison: 'previous_month',
      branding: {
        logo: 'custom', // Use author's branding
        colors: 'custom'
      }
    });

    return {
      reportUrl: report.downloadUrl,
      keyMetrics: report.highlights,
      trendsVsPrevious: report.comparison,
      nextMonthPlan: report.aiGeneratedPlan
    };
  }

  async setupAlerts(projectId: string) {
    return await this.marketing.analytics.alerts.create({
      projectId,
      alerts: [
        {
          name: 'ROAS Drop',
          condition: { metric: 'roas', operator: 'lt', value: 2.0 },
          channels: ['email', 'slack'],
          frequency: 'immediate'
        },
        {
          name: 'Budget Pacing',
          condition: { metric: 'spend_rate', operator: 'gt', value: 1.2 },
          channels: ['email'],
          frequency: 'daily'
        },
        {
          name: 'High Performer Detected',
          condition: { metric: 'keyword_roas', operator: 'gt', value: 5.0 },
          channels: ['email'],
          frequency: 'immediate'
        }
      ]
    });
  }
}
```

### Business Impact

- **Single source of truth** for all marketing data
- **True ROI visibility** with multi-touch attribution
- **Proactive alerts** catch problems before they waste budget
- **AI-generated recommendations** guide optimization decisions

---

## Integration with Nexus Ecosystem

| Plugin | Integration |
|--------|-------------|
| **ProseCreator** | Book project metadata import |
| **Audiobook** | Audio edition cross-promotion |
| **NexusCRM** | Reader relationship management |
| **GraphRAG** | Campaign knowledge retention |

---

## Next Steps

- [Architecture Overview](./ARCHITECTURE.md) - System design and ad platform integrations
- [API Reference](./docs/api-reference/endpoints.md) - Complete endpoint docs
- [Support](https://discord.gg/adverant) - Discord community

