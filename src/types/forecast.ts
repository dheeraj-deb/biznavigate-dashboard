export interface ForecastDataPoint {
  date: string
  actual?: number
  predicted: number
  lowerBound: number
  upperBound: number
}

export interface ForecastInsight {
  id: string
  type: 'positive' | 'negative' | 'neutral' | 'warning'
  title: string
  description: string
  confidence: number
  impact?: 'high' | 'medium' | 'low'
}

export interface ForecastMetric {
  label: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease'
  trend?: 'up' | 'down' | 'stable'
}

export interface ForecastAccuracy {
  mape: number // Mean Absolute Percentage Error
  rmse: number // Root Mean Square Error
  lastUpdated: string
  historicalAccuracy: number
}

export interface ForecastResult {
  forecast_id: string
  business_id: string
  forecast_type: 'revenue' | 'orders' | 'customers' | 'growth'
  period_start: string
  period_end: string
  data: ForecastDataPoint[]
  insights: ForecastInsight[]
  metrics: ForecastMetric[]
  accuracy: ForecastAccuracy
  confidence_score: number
  model_version: string
  created_at: string
}

export interface ForecastRequest {
  forecast_type: 'revenue' | 'orders' | 'customers' | 'growth'
  days: number
  include_insights?: boolean
  granularity?: 'daily' | 'weekly' | 'monthly'
}

export interface CampaignOptimization {
  optimization_id: string
  campaign_id: string
  campaign_name: string
  current_budget: number
  recommended_budget: number
  current_roi: number
  predicted_roi: number
  confidence: number
  recommendations: OptimizationRecommendation[]
  created_at: string
}

export interface OptimizationRecommendation {
  id: string
  type: 'budget' | 'audience' | 'timing' | 'content'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  expected_impact: string
  action_required: boolean
}

export interface BudgetReallocation {
  from_channel: string
  to_channel: string
  amount: number
  reason: string
  expected_improvement: number
}
