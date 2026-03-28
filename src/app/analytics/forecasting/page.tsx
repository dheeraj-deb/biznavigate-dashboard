'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ForecastChart } from '@/components/ai/forecast-chart'
import { ForecastMetrics } from '@/components/ai/forecast-metrics'
import { ForecastInsights } from '@/components/ai/forecast-insights'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, Download, Settings, Brain } from 'lucide-react'
import type { ForecastResult } from '@/types/forecast'

// Mock data for development - will be replaced with real API calls
const mockForecastData: ForecastResult = {
  forecast_id: 'fc_123',
  business_id: 'biz_001',
  forecast_type: 'revenue',
  period_start: '2025-01-01',
  period_end: '2025-03-31',
  confidence_score: 0.87,
  model_version: 'v1.2',
  created_at: '2025-01-09T10:00:00Z',
  data: [
    // Historical data (actual)
    { date: 'Jan 1', actual: 45000, predicted: 45000, lowerBound: 42000, upperBound: 48000 },
    { date: 'Jan 8', actual: 52000, predicted: 51000, lowerBound: 48000, upperBound: 54000 },
    { date: 'Jan 15', actual: 48000, predicted: 49000, lowerBound: 46000, upperBound: 52000 },
    { date: 'Jan 22', actual: 55000, predicted: 54000, lowerBound: 51000, upperBound: 57000 },
    { date: 'Jan 29', actual: 58000, predicted: 57000, lowerBound: 54000, upperBound: 60000 },
    // Future predictions
    { date: 'Feb 5', predicted: 62000, lowerBound: 58000, upperBound: 66000 },
    { date: 'Feb 12', predicted: 65000, lowerBound: 61000, upperBound: 69000 },
    { date: 'Feb 19', predicted: 68000, lowerBound: 63000, upperBound: 73000 },
    { date: 'Feb 26', predicted: 72000, lowerBound: 67000, upperBound: 77000 },
    { date: 'Mar 5', predicted: 75000, lowerBound: 70000, upperBound: 80000 },
    { date: 'Mar 12', predicted: 78000, lowerBound: 72000, upperBound: 84000 },
    { date: 'Mar 19', predicted: 82000, lowerBound: 76000, upperBound: 88000 },
    { date: 'Mar 26', predicted: 85000, lowerBound: 79000, upperBound: 91000 },
  ],
  metrics: [
    { label: 'Predicted Q1 Revenue', value: '$1.95M', change: 18, changeType: 'increase', trend: 'up' },
    { label: 'Expected Orders', value: '2,450', change: 12, changeType: 'increase', trend: 'up' },
    { label: 'Avg Order Value', value: '$796', change: 5, changeType: 'increase', trend: 'up' },
    { label: 'Forecast Confidence', value: '87%', trend: 'stable' },
  ],
  insights: [
    {
      id: '1',
      type: 'positive',
      title: 'Strong Revenue Growth Expected',
      description: 'Based on current trends and seasonal patterns, revenue is projected to grow by 18% in Q1 2025. This aligns with increased marketing spend and new product launches.',
      confidence: 0.87,
      impact: 'high',
    },
    {
      id: '2',
      type: 'warning',
      title: 'Peak Season Approaching',
      description: 'March typically sees 25% higher demand. Consider increasing inventory levels by 30% to avoid stockouts during peak period.',
      confidence: 0.82,
      impact: 'medium',
    },
    {
      id: '3',
      type: 'neutral',
      title: 'Customer Acquisition Stable',
      description: 'New customer acquisition rate is expected to remain steady at ~150 customers per week throughout Q1.',
      confidence: 0.79,
      impact: 'low',
    },
    {
      id: '4',
      type: 'positive',
      title: 'Improved Conversion Rates',
      description: 'Recent website improvements are showing impact. Conversion rate is predicted to increase from 2.8% to 3.2% by end of Q1.',
      confidence: 0.84,
      impact: 'medium',
    },
  ],
  accuracy: {
    mape: 5.2,
    rmse: 2400,
    lastUpdated: '2025-01-09T10:00:00Z',
    historicalAccuracy: 92.3,
  },
}

export default function ForecastingPage() {
  const [forecastType, setForecastType] = useState<'revenue' | 'orders' | 'customers'>('revenue')
  const [timeRange, setTimeRange] = useState<'30' | '60' | '90'>('90')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsRefreshing(false)
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting forecast data...')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            AI-Powered Forecasting
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Predictive analytics and insights for your business
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Forecast Type
              </label>
              <Select value={forecastType} onValueChange={(v: any) => setForecastType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue Forecast</SelectItem>
                  <SelectItem value="orders">Order Volume</SelectItem>
                  <SelectItem value="customers">Customer Growth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Time Range
              </label>
              <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Next 30 Days</SelectItem>
                  <SelectItem value="60">Next 60 Days</SelectItem>
                  <SelectItem value="90">Next 90 Days (Quarter)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Model Accuracy
              </label>
              <div className="h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center">
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {mockForecastData.accuracy.historicalAccuracy}% Accurate
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (MAPE: {mockForecastData.accuracy.mape}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <ForecastMetrics metrics={mockForecastData.metrics} />

      {/* Tabs for different views */}
      <Tabs defaultValue="forecast" className="space-y-4">
        <TabsList>
          <TabsTrigger value="forecast">Forecast Chart</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="accuracy">Model Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-4">
          <ForecastChart
            data={mockForecastData.data}
            title={`${forecastType === 'revenue' ? 'Revenue' : forecastType === 'orders' ? 'Orders' : 'Customers'} Forecast - Next ${timeRange} Days`}
            type="area"
            showBounds={true}
            currency={forecastType === 'revenue'}
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <ForecastInsights insights={mockForecastData.insights} />
        </TabsContent>

        <TabsContent value="accuracy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Historical Accuracy</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {mockForecastData.accuracy.historicalAccuracy}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Based on last 6 months
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Mean Absolute Percentage Error
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {mockForecastData.accuracy.mape}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Lower is better</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Root Mean Square Error
                  </p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    ${mockForecastData.accuracy.rmse.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Average deviation</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Model Version:</strong> {mockForecastData.model_version} |{' '}
                  <strong>Last Updated:</strong> {new Date(mockForecastData.accuracy.lastUpdated).toLocaleString()}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  Our AI model uses time-series analysis, seasonal patterns, and historical trends to
                  generate accurate predictions with {mockForecastData.confidence_score * 100}%
                  confidence.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
