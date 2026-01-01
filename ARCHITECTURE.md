# BookMarketing Architecture

Technical architecture and system design for AI-powered book marketing automation.

---

## System Overview

```mermaid
flowchart TB
    subgraph Client Layer
        A[Nexus Dashboard] --> B[API Gateway]
        C[SDK Clients] --> B
    end

    subgraph BookMarketing Service
        B --> D[REST API Layer]
        D --> E[Campaign Manager]
        D --> F[Ad Platform Adapters]
        D --> G[Email Engine]
        D --> H[Social Scheduler]
        D --> I[Analytics Engine]
    end

    subgraph Ad Platforms
        F --> J[Amazon Ads API]
        F --> K[Facebook Marketing API]
        F --> L[BookBub API]
    end

    subgraph Email Providers
        G --> M[Mailchimp API]
        G --> N[ConvertKit API]
        G --> O[SendGrid API]
    end

    subgraph AI Services
        E --> P[MageAgent]
        I --> P
    end

    subgraph Data Layer
        E --> Q[(PostgreSQL)]
        I --> Q
        G --> R[(Redis Cache)]
    end
```

---

## Core Components

### 1. REST API Layer

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/marketing/api/campaigns` | POST | Create marketing campaign |
| `/marketing/api/campaigns/:id` | GET | Get campaign details |
| `/marketing/api/campaigns/:id/analytics` | GET | Get campaign analytics |
| `/marketing/api/campaigns/:id/pause` | PUT | Pause campaign |
| `/marketing/api/ads/amazon` | POST | Create Amazon Ads campaign |
| `/marketing/api/ads/facebook` | POST | Create Facebook campaign |
| `/marketing/api/ads/bookbub/featured-deal` | POST | Apply for BookBub Featured Deal |
| `/marketing/api/email/sequences` | POST | Create email sequence |
| `/marketing/api/social/campaigns` | POST | Schedule social campaign |
| `/marketing/api/analytics/dashboard/:projectId` | GET | Get dashboard data |

### 2. Campaign Manager

Orchestrates multi-channel marketing campaigns.

**Capabilities:**
- Campaign creation and lifecycle management
- Budget allocation across channels
- Goal tracking and optimization triggers
- A/B test management

### 3. Ad Platform Adapters

Unified interface to advertising platforms.

**Supported Platforms:**
- Amazon Advertising API (Sponsored Products, Brands, Display)
- Facebook Marketing API (Ads, Custom Audiences, Lookalikes)
- BookBub Partners API (Featured Deals, Ads)
- NetGalley API (Review copies)

### 4. Email Engine

Email marketing automation with AI personalization.

**Features:**
- Sequence builder with branching logic
- A/B testing for subject lines and content
- Behavior-based triggers
- List segmentation and hygiene

### 5. Social Scheduler

Cross-platform social media management.

**Platforms:**
- Twitter/X
- Instagram
- Facebook Pages
- TikTok
- Pinterest

### 6. Analytics Engine

Unified reporting across all marketing channels.

**Features:**
- Real-time performance dashboards
- Multi-touch attribution modeling
- ROI calculation and forecasting
- AI-powered recommendations

---

## Campaign Flow Architecture

```mermaid
flowchart TB
    subgraph Campaign Creation
        A[Create Campaign] --> B[AI Analysis]
        B --> C[Audience Research]
        C --> D[Keyword Research]
        D --> E[Budget Allocation]
    end

    subgraph Channel Setup
        E --> F{Channel Type}
        F -->|Amazon| G[Amazon Campaign Setup]
        F -->|Facebook| H[Facebook Campaign Setup]
        F -->|Email| I[Email Sequence Setup]
        F -->|Social| J[Social Posts Setup]
    end

    subgraph Execution
        G --> K[Launch Campaigns]
        H --> K
        I --> K
        J --> K
        K --> L[Monitor Performance]
    end

    subgraph Optimization
        L --> M[Collect Metrics]
        M --> N[AI Analysis]
        N --> O{Needs Optimization?}
        O -->|Yes| P[Auto-Optimize]
        P --> L
        O -->|No| L
    end
```

---

## Amazon Ads Integration

```mermaid
sequenceDiagram
    participant Client
    participant BookMarketing
    participant AmazonAdapter
    participant AmazonAdsAPI

    Client->>BookMarketing: Create Amazon Campaign
    BookMarketing->>BookMarketing: AI Keyword Research
    BookMarketing->>AmazonAdapter: Build Campaign Structure
    AmazonAdapter->>AmazonAdsAPI: Create Campaign
    AmazonAdsAPI-->>AmazonAdapter: Campaign ID
    AmazonAdapter->>AmazonAdsAPI: Create Ad Groups
    AmazonAdapter->>AmazonAdsAPI: Add Keywords/Targets
    AmazonAdapter->>AmazonAdsAPI: Set Bids
    AmazonAdapter-->>BookMarketing: Campaign Ready
    BookMarketing-->>Client: Campaign Created

    loop Daily Optimization
        BookMarketing->>AmazonAdsAPI: Fetch Performance
        BookMarketing->>BookMarketing: AI Bid Optimization
        BookMarketing->>AmazonAdsAPI: Update Bids
        BookMarketing->>AmazonAdsAPI: Pause Underperformers
    end
```

---

## Data Model

```mermaid
erDiagram
    CAMPAIGNS ||--o{ CHANNEL_CAMPAIGNS : contains
    CAMPAIGNS ||--o{ CAMPAIGN_ANALYTICS : tracks
    CHANNEL_CAMPAIGNS ||--o{ KEYWORDS : targets
    CHANNEL_CAMPAIGNS ||--o{ AUDIENCES : targets
    EMAIL_SEQUENCES ||--o{ EMAILS : contains
    EMAILS ||--o{ EMAIL_ANALYTICS : tracks
    SOCIAL_CAMPAIGNS ||--o{ SOCIAL_POSTS : contains

    CAMPAIGNS {
        uuid campaign_id PK
        string name
        string book_asin
        string status
        decimal daily_budget
        decimal total_budget
        date start_date
        date end_date
        jsonb goals
        timestamp created_at
    }

    CHANNEL_CAMPAIGNS {
        uuid channel_campaign_id PK
        uuid campaign_id FK
        string channel
        string external_id
        string status
        jsonb settings
        decimal allocated_budget
    }

    KEYWORDS {
        uuid keyword_id PK
        uuid channel_campaign_id FK
        string keyword
        string match_type
        decimal bid
        string status
        decimal impressions
        decimal clicks
        decimal spend
        decimal sales
    }

    AUDIENCES {
        uuid audience_id PK
        uuid channel_campaign_id FK
        string audience_type
        string external_id
        integer size
        jsonb targeting_criteria
    }

    CAMPAIGN_ANALYTICS {
        uuid analytics_id PK
        uuid campaign_id FK
        date date
        string channel
        integer impressions
        integer clicks
        decimal spend
        decimal revenue
        integer conversions
    }

    EMAIL_SEQUENCES {
        uuid sequence_id PK
        uuid campaign_id FK
        string name
        string trigger_type
        string status
        integer subscribers_count
    }

    EMAILS {
        uuid email_id PK
        uuid sequence_id FK
        string subject
        text content
        integer delay_hours
        integer sequence_order
        jsonb ab_variants
    }

    EMAIL_ANALYTICS {
        uuid analytics_id PK
        uuid email_id FK
        date date
        integer sent
        integer delivered
        integer opened
        integer clicked
        integer unsubscribed
    }

    SOCIAL_CAMPAIGNS {
        uuid social_campaign_id PK
        uuid campaign_id FK
        string name
        array platforms
        string status
    }

    SOCIAL_POSTS {
        uuid post_id PK
        uuid social_campaign_id FK
        string platform
        text content
        string media_url
        timestamp scheduled_at
        string status
        jsonb engagement
    }
```

---

## AI Optimization Pipeline

```mermaid
flowchart TB
    subgraph Data Collection
        A[Amazon Ads Data] --> D[Data Aggregator]
        B[Facebook Ads Data] --> D
        C[Email Metrics] --> D
    end

    subgraph AI Analysis
        D --> E[Performance Analysis]
        E --> F[Pattern Recognition]
        F --> G[Opportunity Detection]
        G --> H[Recommendation Engine]
    end

    subgraph Optimization Actions
        H --> I{Action Type}
        I -->|Bid| J[Bid Adjustments]
        I -->|Budget| K[Budget Reallocation]
        I -->|Creative| L[Creative Suggestions]
        I -->|Audience| M[Audience Refinement]
    end

    subgraph Execution
        J --> N[Auto-Apply]
        K --> N
        L --> O[Human Review]
        M --> O
    end
```

---

## Email Automation Engine

```mermaid
flowchart TB
    subgraph Triggers
        A[Signup] --> E[Sequence Engine]
        B[Purchase] --> E
        C[Tag Added] --> E
        D[Date Trigger] --> E
    end

    subgraph Processing
        E --> F[Load Sequence]
        F --> G[Personalization]
        G --> H[AI Content]
        H --> I[A/B Selection]
    end

    subgraph Delivery
        I --> J[Email Provider]
        J --> K[Send Email]
        K --> L[Track Opens/Clicks]
    end

    subgraph Branching
        L --> M{Engagement?}
        M -->|Opened| N[Engaged Path]
        M -->|Not Opened| O[Re-engagement Path]
        N --> E
        O --> E
    end
```

---

## Security Model

### Authentication
- Bearer token via Nexus API Gateway
- OAuth 2.0 for ad platform connections
- API key rotation for third-party services

### Authorization
- Campaign-level access control
- Role-based permissions (Owner, Manager, Viewer)
- Ad account connection scoping

### Data Protection
- Credentials encrypted at rest (AES-256)
- No storage of ad platform passwords
- Audit logging for all campaign actions

---

## Deployment Architecture

### Kubernetes Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nexus-bookmarketing
  namespace: nexus-plugins
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nexus-bookmarketing
  template:
    spec:
      containers:
      - name: bookmarketing-api
        image: adverant/nexus-bookmarketing:1.0.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        env:
        - name: AMAZON_ADS_CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: bookmarketing-secrets
              key: amazon-client-id
        - name: FACEBOOK_APP_ID
          valueFrom:
            secretKeyRef:
              name: bookmarketing-secrets
              key: facebook-app-id
        livenessProbe:
          httpGet:
            path: /marketing/api/health/live
            port: 8080
        readinessProbe:
          httpGet:
            path: /marketing/api/health/ready
            port: 8080
```

### Resource Allocation

| Component | CPU | Memory | Storage |
|-----------|-----|--------|---------|
| API Server | 500m-1000m | 1Gi-2Gi | - |
| Analytics Worker | 1000m-2000m | 2Gi-4Gi | 20Gi |
| Email Worker | 250m-500m | 512Mi-1Gi | 5Gi |
| Social Worker | 250m-500m | 512Mi-1Gi | 5Gi |

---

## Performance

### Processing Capacity

| Tier | Campaigns | Daily Syncs | Analytics Updates |
|------|-----------|-------------|-------------------|
| Starter | 2 | 2 | Every 6 hours |
| Author | 10 | 4 | Every 2 hours |
| Pro Publisher | 50 | 12 | Every 30 min |
| Enterprise | Unlimited | 24 | Real-time |

### Latency Targets

| Operation | Target |
|-----------|--------|
| Campaign Creation | < 5s |
| Analytics Fetch | < 2s |
| Bid Optimization | < 30s |
| Email Send | < 1s |
| Report Generation | < 60s |

---

## Monitoring

### Metrics (Prometheus)

```
# Campaign metrics
bookmarketing_campaigns_active_total
bookmarketing_ad_spend_total
bookmarketing_revenue_total
bookmarketing_roas_gauge

# Platform metrics
bookmarketing_amazon_api_latency
bookmarketing_facebook_api_latency
bookmarketing_email_delivery_rate

# Optimization metrics
bookmarketing_optimizations_applied_total
bookmarketing_bid_changes_total
```

### Alerting

| Alert | Condition | Severity |
|-------|-----------|----------|
| API Connection Failed | Platform unreachable > 5 min | Critical |
| ROAS Below Threshold | Campaign ROAS < 1.5 | Warning |
| Email Bounce Rate High | Bounce rate > 5% | Warning |
| Budget Overspend | Daily spend > 120% budget | Critical |

---

## Next Steps

- [Quick Start Guide](./QUICKSTART.md) - Get started quickly
- [Use Cases](./USE-CASES.md) - Marketing strategies
- [API Reference](./docs/api-reference/endpoints.md) - Complete docs

