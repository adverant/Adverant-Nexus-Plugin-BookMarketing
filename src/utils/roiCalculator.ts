/**
 * ROI Calculation Utilities
 */

export class ROICalculator {
  /**
   * Calculate ACOS (Advertising Cost of Sales)
   * ACOS = (Ad Spend / Revenue) * 100
   * Target: <30% for profitability
   */
  static calculateACOS(spend: number, revenue: number): number | null {
    if (revenue <= 0) return null;
    return (spend / revenue) * 100;
  }

  /**
   * Calculate ROAS (Return on Ad Spend)
   * ROAS = Revenue / Ad Spend
   * Target: >3.0 for good performance
   */
  static calculateROAS(revenue: number, spend: number): number | null {
    if (spend <= 0) return null;
    return revenue / spend;
  }

  /**
   * Calculate ROI (Return on Investment)
   * ROI = ((Revenue - Spend) / Spend) * 100
   * Target: >200% for excellent performance
   */
  static calculateROI(revenue: number, spend: number): number | null {
    if (spend <= 0) return null;
    return ((revenue - spend) / spend) * 100;
  }

  /**
   * Calculate CPA (Cost Per Acquisition)
   * CPA = Total Spend / Total Conversions
   */
  static calculateCPA(spend: number, conversions: number): number | null {
    if (conversions <= 0) return null;
    return spend / conversions;
  }

  /**
   * Calculate CTR (Click-Through Rate)
   * CTR = (Clicks / Impressions) * 100
   */
  static calculateCTR(clicks: number, impressions: number): number {
    if (impressions <= 0) return 0;
    return (clicks / impressions) * 100;
  }

  /**
   * Calculate Conversion Rate
   * Conversion Rate = (Conversions / Clicks) * 100
   */
  static calculateConversionRate(conversions: number, clicks: number): number {
    if (clicks <= 0) return 0;
    return (conversions / clicks) * 100;
  }

  /**
   * Calculate Email Open Rate
   * Open Rate = (Opens / Recipients) * 100
   */
  static calculateOpenRate(opens: number, recipients: number): number {
    if (recipients <= 0) return 0;
    return (opens / recipients) * 100;
  }

  /**
   * Calculate Email Click Rate
   * Click Rate = (Clicks / Opens) * 100
   */
  static calculateClickRate(clicks: number, opens: number): number {
    if (opens <= 0) return 0;
    return (clicks / opens) * 100;
  }

  /**
   * Determine performance grade based on ACOS
   */
  static gradePerformance(acos: number | null): string {
    if (acos === null) return 'N/A';
    if (acos < 10) return 'Excellent';
    if (acos < 20) return 'Very Good';
    if (acos < 30) return 'Good';
    if (acos < 50) return 'Fair';
    return 'Poor';
  }

  /**
   * Calculate lifetime value based on engagement
   */
  static estimateLifetimeValue(
    averageBookPrice: number,
    purchaseFrequency: number,
    retentionYears: number
  ): number {
    return averageBookPrice * purchaseFrequency * retentionYears;
  }
}

export default ROICalculator;
