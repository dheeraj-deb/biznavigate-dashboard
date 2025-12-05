'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  TrendingUp,
  MessageSquare,
  Calendar,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Eye,
  Copy,
  BarChart,
  Target,
  Zap,
  Image as ImageIcon,
  FileText,
  Edit,
  Sparkles,
  Link as LinkIcon,
  Loader2,
  CheckCircle,
  Filter,
  Search,
  ChevronLeft,
} from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'

type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'paused'
type CampaignType = 'promotional' | 'transactional' | 'announcement' | 'reminder'

interface Campaign {
  campaign_id: string
  campaign_name: string
  campaign_type: CampaignType
  channel: 'whatsapp' | 'sms'
  status: CampaignStatus
  message_template: string
  total_recipients: number
  sent_count: number
  delivered_count: number
  read_count: number
  clicked_count: number
  replied_count: number
  failed_count: number
  scheduled_at?: Date
  sent_at?: Date
  created_at: Date
  has_media?: boolean
  buttons?: string[]
  target_audience?: string[]
}

interface AISuggestion {
  id: string
  title: string
  type: CampaignType
  message: string
  targetAudience: string[]
  hasMedia: boolean
  buttons: string[]
  reasoning: string
  productInfo?: {
    name: string
    price: string
    discount?: string
    specs?: string[]
    imageUrl?: string
  }
  offerInfo?: {
    title: string
    validUntil: string
    discountPercent: string
  }
}

const mockCampaigns: Campaign[] = [
  {
    campaign_id: '1',
    campaign_name: '🎉 Flash Sale - 50% Off',
    campaign_type: 'promotional',
    channel: 'whatsapp',
    status: 'completed',
    message_template: 'Hi {{name}}! 🎉 Exclusive Flash Sale just for you! Get 50% OFF on all products. Shop now: {{link}}',
    total_recipients: 1250,
    sent_count: 1250,
    delivered_count: 1180,
    read_count: 950,
    clicked_count: 340,
    replied_count: 120,
    failed_count: 70,
    scheduled_at: new Date('2024-12-01T10:00:00'),
    sent_at: new Date('2024-12-01T10:00:00'),
    created_at: new Date('2024-11-28'),
    has_media: true,
    buttons: ['Shop Now', 'View Details'],
  },
  {
    campaign_id: '2',
    campaign_name: '📦 Order Delivery Update',
    campaign_type: 'transactional',
    channel: 'whatsapp',
    status: 'active',
    message_template: 'Hello {{name}}! Your order #{{order_id}} is out for delivery. Track: {{link}}',
    total_recipients: 450,
    sent_count: 320,
    delivered_count: 315,
    read_count: 280,
    clicked_count: 180,
    replied_count: 45,
    failed_count: 5,
    scheduled_at: new Date('2024-12-02T09:00:00'),
    created_at: new Date('2024-12-01'),
    has_media: false,
  },
  {
    campaign_id: '3',
    campaign_name: '🆕 New Collection Launch',
    campaign_type: 'announcement',
    channel: 'whatsapp',
    status: 'scheduled',
    message_template: 'Hi {{name}}! Check out our NEW Winter Collection 2024! ❄️ Exclusive designs now available.',
    total_recipients: 2100,
    sent_count: 0,
    delivered_count: 0,
    read_count: 0,
    clicked_count: 0,
    replied_count: 0,
    failed_count: 0,
    scheduled_at: new Date('2024-12-05T11:00:00'),
    created_at: new Date('2024-12-01'),
    has_media: true,
    buttons: ['Explore Collection'],
  },
  {
    campaign_id: '4',
    campaign_name: 'Cart Abandonment Reminder',
    campaign_type: 'reminder',
    channel: 'whatsapp',
    status: 'draft',
    message_template: 'Hey {{name}}, you left items in your cart! Complete your purchase now and get 10% off.',
    total_recipients: 0,
    sent_count: 0,
    delivered_count: 0,
    read_count: 0,
    clicked_count: 0,
    replied_count: 0,
    failed_count: 0,
    created_at: new Date('2024-12-02'),
    has_media: false,
  },
]

// Message templates
const messageTemplates = [
  {
    id: '1',
    name: 'Flash Sale Promotion',
    category: 'promotional',
    message: 'Hi {{name}}! 🎉 Exclusive Flash Sale just for you! Get {{discount}}% OFF on all products. Shop now: {{link}}',
    hasMedia: true,
  },
  {
    id: '2',
    name: 'Order Confirmation',
    category: 'transactional',
    message: 'Hello {{name}}! Your order #{{order_id}} has been confirmed. Expected delivery: {{date}}. Track: {{link}}',
    hasMedia: false,
  },
  {
    id: '3',
    name: 'Welcome Message',
    category: 'announcement',
    message: 'Welcome to {{business_name}}! 👋 We\'re excited to have you. Explore our products: {{link}}',
    hasMedia: true,
  },
  {
    id: '4',
    name: 'Payment Reminder',
    category: 'reminder',
    message: 'Hi {{name}}, your payment of ₹{{amount}} is due on {{date}}. Pay now to avoid late fees: {{link}}',
    hasMedia: false,
  },
]

// Audience segments
const audienceSegments = [
  { id: 'all', label: 'All Customers', count: 5420 },
  { id: 'new', label: 'New Customers', count: 850 },
  { id: 'repeated', label: 'Repeated Buyers', count: 2340 },
  { id: 'inactive', label: 'Inactive (30+ days)', count: 1180 },
  { id: 'vip', label: 'VIP Customers', count: 420 },
  { id: 'high_value', label: 'High Value (₹50k+)', count: 630 },
]

export default function CampaignsPage() {
  const [selectedTab, setSelectedTab] = useState<CampaignStatus | 'all'>('all')
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns)

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showAIGeneratorDialog, setShowAIGeneratorDialog] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null)

  // AI Generator states
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<AISuggestion | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'promotional' as CampaignType,
    channel: 'whatsapp' as 'whatsapp' | 'sms',
    message: '',
    recipients: '',
    scheduledDate: '',
    scheduledTime: '',
    hasMedia: false,
    buttons: '',
    targetAudience: [] as string[],
    mediaFile: null as File | null,
    mediaPreview: '' as string,
  })

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'promotional',
      channel: 'whatsapp',
      message: '',
      recipients: '',
      scheduledDate: '',
      scheduledTime: '',
      hasMedia: false,
      buttons: '',
      targetAudience: [],
      mediaFile: null,
      mediaPreview: '',
    })
  }

  // Handle media upload
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        mediaFile: file,
        hasMedia: true,
        mediaPreview: URL.createObjectURL(file)
      }))
    }
  }

  const removeMedia = () => {
    if (formData.mediaPreview) {
      URL.revokeObjectURL(formData.mediaPreview)
    }
    setFormData(prev => ({
      ...prev,
      mediaFile: null,
      mediaPreview: '',
      hasMedia: false
    }))
  }

  // AI URL Analyzer - simulates AI analyzing website and generating campaigns
  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl) return

    setIsAnalyzing(true)

    // Simulate API call to AI
    await new Promise(resolve => setTimeout(resolve, 2500))

    const domainName = websiteUrl.replace('https://', '').replace('http://', '').split('/')[0]

    // Generate AI suggestions based on URL (mock data with detected products & offers)
    const suggestions: AISuggestion[] = [
      // New Product Launch Campaign
      {
        id: '1',
        title: '🚀 New Product Launch - Premium Wireless Earbuds',
        type: 'announcement',
        message: `Hi {{name}}! 🎉 JUST LAUNCHED: Premium Wireless Earbuds Pro!\n\n✨ Features:\n• 40H Battery Life\n• Active Noise Cancellation\n• Premium Sound Quality\n• Water Resistant (IPX7)\n\n💰 Launch Price: ₹2,999 (Save 40%!)\nOriginal Price: ₹4,999\n\nOrder now: {{link}}`,
        targetAudience: ['all'],
        hasMedia: true,
        buttons: ['Order Now', 'View Details'],
        reasoning: 'AI detected new product launch on website - Perfect for announcing to all customers',
        productInfo: {
          name: 'Premium Wireless Earbuds Pro',
          price: '₹2,999',
          discount: '40% OFF',
          specs: ['40H Battery', 'ANC', 'IPX7 Waterproof', 'Fast Charging'],
          imageUrl: 'https://example.com/earbuds.jpg'
        }
      },
      // Upcoming Sale Campaign
      {
        id: '2',
        title: '🔥 MEGA SALE ALERT - Starts Tomorrow!',
        type: 'promotional',
        message: `🚨 MEGA SALE STARTS TOMORROW! 🚨\n\n{{name}}, get ready for our BIGGEST sale of the year!\n\n⏰ Starts: Dec 5, 2024 at 12:00 AM\n⏰ Ends: Dec 8, 2024 at 11:59 PM\n\n🎁 Up to 70% OFF\n🎁 Extra 10% on prepaid orders\n🎁 FREE shipping on all orders\n\nSet your reminder: {{link}}`,
        targetAudience: ['all'],
        hasMedia: true,
        buttons: ['Set Reminder', 'Browse Deals'],
        reasoning: 'AI detected upcoming sale event - Creates anticipation and urgency',
        offerInfo: {
          title: 'Mega Sale 2024',
          validUntil: 'Dec 8, 2024',
          discountPercent: 'Up to 70%'
        }
      },
      // New Product for VIPs
      {
        id: '3',
        title: '⭐ VIP Early Access - Smart Watch Series 5',
        type: 'announcement',
        message: `{{name}}, you're a VIP! ⭐\n\nGet EARLY ACCESS to our NEW Smart Watch Series 5!\n\n🔥 Launching publicly tomorrow\n🔥 Your exclusive price: ₹7,999 (₹3,000 OFF)\n\n✨ Key Features:\n• AMOLED Display\n• 7-Day Battery\n• Health Tracking\n• 100+ Sports Modes\n\nReserve yours: {{link}}`,
        targetAudience: ['vip', 'high_value'],
        hasMedia: true,
        buttons: ['Reserve Now', 'View Specs'],
        reasoning: 'AI detected new premium product - Perfect for VIP early access',
        productInfo: {
          name: 'Smart Watch Series 5',
          price: '₹7,999',
          discount: '₹3,000 OFF',
          specs: ['AMOLED Display', '7-Day Battery', 'Health Tracking', '100+ Sports Modes'],
          imageUrl: 'https://example.com/smartwatch.jpg'
        }
      },
      // Flash Sale for Inactive
      {
        id: '4',
        title: '⚡ We Miss You - Exclusive 50% OFF',
        type: 'promotional',
        message: `Hey {{name}}! We miss you! 😊\n\nCome back with an EXCLUSIVE 50% OFF on our NEW ARRIVALS!\n\n🎁 New Products Just Added:\n• Wireless Earbuds Pro - ₹2,999\n• Smart Watch Series 5 - ₹7,999\n• Power Bank 20000mAh - ₹1,499\n\n⏰ Valid for 48 hours only!\n\nShop now: {{link}}`,
        targetAudience: ['inactive'],
        hasMedia: true,
        buttons: ['Shop Now', 'View Products'],
        reasoning: 'AI detected new products - Great re-engagement opportunity for inactive users'
      },
      // Standard Welcome Campaign
      {
        id: '5',
        title: '🎯 Welcome New Customers',
        type: 'promotional',
        message: `Hi {{name}}! 👋 Welcome to ${domainName}! As a new customer, enjoy 20% OFF your first purchase. Use code: WELCOME20 🎁 Shop now: {{link}}`,
        targetAudience: ['new'],
        hasMedia: true,
        buttons: ['Shop Now', 'View Offers'],
        reasoning: 'Perfect for onboarding new customers and driving first purchase'
      },
      // Loyalty Reward Campaign
      {
        id: '6',
        title: '🎊 Thank You - Repeated Buyers Reward',
        type: 'promotional',
        message: `Hi {{name}}! 🙏 Thank you for being a loyal customer!\n\nAs our appreciation, here's 25% OFF your next order + FREE shipping!\n\nValid on all products including new arrivals.\n\nShop now: {{link}}`,
        targetAudience: ['repeated'],
        hasMedia: false,
        buttons: ['Shop Now', 'View Rewards'],
        reasoning: 'Rewards loyalty and encourages repeat purchases'
      },
    ]

    setAiSuggestions(suggestions)
    setIsAnalyzing(false)
  }

  // Use AI suggestion to create campaign
  const handleUseAISuggestion = (suggestion: AISuggestion) => {
    const totalRecipients = suggestion.targetAudience.reduce((sum, audienceId) => {
      const segment = audienceSegments.find(s => s.id === audienceId)
      return sum + (segment?.count || 0)
    }, 0)

    setFormData({
      name: suggestion.title,
      type: suggestion.type,
      channel: 'whatsapp',
      message: suggestion.message,
      recipients: totalRecipients.toString(),
      scheduledDate: '',
      scheduledTime: '',
      hasMedia: suggestion.hasMedia,
      buttons: suggestion.buttons.join(', '),
      targetAudience: suggestion.targetAudience,
    })
    setShowAIGeneratorDialog(false)
    setShowCreateDialog(true)
  }

  // Calculate stats
  const stats = {
    total: campaigns.length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    active: campaigns.filter(c => c.status === 'active').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    totalSent: campaigns.reduce((sum, c) => sum + c.sent_count, 0),
    totalDelivered: campaigns.reduce((sum, c) => sum + c.delivered_count, 0),
    totalRead: campaigns.reduce((sum, c) => sum + c.read_count, 0),
    totalClicked: campaigns.reduce((sum, c) => sum + c.clicked_count, 0),
    avgReadRate: campaigns.filter(c => c.delivered_count > 0).length > 0
      ? ((campaigns.reduce((sum, c) => sum + (c.delivered_count > 0 ? (c.read_count / c.delivered_count) * 100 : 0), 0) / campaigns.filter(c => c.delivered_count > 0).length)).toFixed(1)
      : '0.0',
    avgClickRate: campaigns.filter(c => c.delivered_count > 0).length > 0
      ? ((campaigns.reduce((sum, c) => sum + (c.delivered_count > 0 ? (c.clicked_count / c.delivered_count) * 100 : 0), 0) / campaigns.filter(c => c.delivered_count > 0).length)).toFixed(1)
      : '0.0',
  }

  // Filter campaigns
  const filteredCampaigns = selectedTab === 'all'
    ? campaigns
    : campaigns.filter(c => c.status === selectedTab)

  // Create campaign
  const handleCreateCampaign = () => {
    if (!formData.name || !formData.message || !formData.recipients) {
      return
    }

    const newCampaign: Campaign = {
      campaign_id: (campaigns.length + 1).toString(),
      campaign_name: formData.name,
      campaign_type: formData.type,
      channel: formData.channel,
      status: formData.scheduledDate && formData.scheduledTime ? 'scheduled' : 'draft',
      message_template: formData.message,
      total_recipients: parseInt(formData.recipients) || 0,
      sent_count: 0,
      delivered_count: 0,
      read_count: 0,
      clicked_count: 0,
      replied_count: 0,
      failed_count: 0,
      scheduled_at: formData.scheduledDate && formData.scheduledTime
        ? new Date(`${formData.scheduledDate}T${formData.scheduledTime}`)
        : undefined,
      created_at: new Date(),
      has_media: formData.hasMedia,
      buttons: formData.buttons ? formData.buttons.split(',').map(b => b.trim()) : undefined,
    }

    setCampaigns(prev => [newCampaign, ...prev])
    setShowCreateDialog(false)
    resetForm()
  }

  // Use template
  const handleUseTemplate = (template: typeof messageTemplates[0]) => {
    setFormData(prev => ({
      ...prev,
      message: template.message,
      type: template.category as CampaignType,
      hasMedia: template.hasMedia,
    }))
    setShowTemplateDialog(false)
    setShowCreateDialog(true)
  }

  // Delete campaign
  const handleDeleteCampaign = (campaignId: string) => {
    setCampaigns(prev => prev.filter(c => c.campaign_id !== campaignId))
    setCampaignToDelete(null)
  }

  // Duplicate campaign
  const handleDuplicateCampaign = (campaign: Campaign) => {
    const newCampaign: Campaign = {
      ...campaign,
      campaign_id: (campaigns.length + 1).toString(),
      campaign_name: `${campaign.campaign_name} (Copy)`,
      status: 'draft',
      sent_count: 0,
      delivered_count: 0,
      read_count: 0,
      clicked_count: 0,
      replied_count: 0,
      failed_count: 0,
      created_at: new Date(),
    }
    setCampaigns(prev => [newCampaign, ...prev])
  }

  // Get status config
  const getStatusBadge = (status: CampaignStatus) => {
    const config = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
      scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
      active: { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
      completed: { label: 'Completed', className: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
      paused: { label: 'Paused', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    }
    return config[status]
  }

  // Get type icon
  const getTypeIcon = (type: CampaignType) => {
    const icons = {
      promotional: Target,
      transactional: FileText,
      announcement: Zap,
      reminder: Clock,
    }
    return icons[type]
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Campaigns</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Create and manage WhatsApp marketing campaigns</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAIGeneratorDialog(true)}
              className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI Generator
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowTemplateDialog(true)}
              className="border-gray-300 dark:border-gray-700"
            >
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Campaigns</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{stats.active} active</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
                  <Send className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Messages Sent</p>
                  <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalSent.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{stats.totalDelivered.toLocaleString()} delivered</p>
                </div>
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-950">
                  <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Read Rate</p>
                  <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.avgReadRate}%</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{stats.totalRead.toLocaleString()} reads</p>
                </div>
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-950">
                  <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Click Rate</p>
                  <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.avgClickRate}%</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{stats.totalClicked.toLocaleString()} clicks</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">All Campaigns</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Manage and monitor your campaign performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as CampaignStatus | 'all')}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="draft">Draft ({stats.draft})</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled ({stats.scheduled})</TabsTrigger>
                <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
                <TabsTrigger value="paused">Paused</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab} className="mt-6">
                {filteredCampaigns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6 mb-4">
                      <Send className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No campaigns found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                      Create your first campaign to start engaging with your customers
                    </p>
                    <Button
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                      onClick={() => setShowCreateDialog(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Campaign
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCampaigns.map((campaign) => {
                      const TypeIcon = getTypeIcon(campaign.campaign_type)
                      const statusBadge = getStatusBadge(campaign.status)
                      const deliveryRate = campaign.sent_count > 0
                        ? ((campaign.delivered_count / campaign.sent_count) * 100).toFixed(1)
                        : '0'
                      const readRate = campaign.delivered_count > 0
                        ? ((campaign.read_count / campaign.delivered_count) * 100).toFixed(1)
                        : '0'

                      return (
                        <Card key={campaign.campaign_id} className="border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              {/* Icon */}
                              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md flex-shrink-0">
                                <MessageSquare className="h-7 w-7" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        {campaign.campaign_name}
                                      </h3>
                                      <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                                      {campaign.has_media && (
                                        <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300">
                                          <ImageIcon className="mr-1 h-3 w-3" />
                                          Media
                                        </Badge>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                      <div className="flex items-center gap-1.5">
                                        <TypeIcon className="h-4 w-4" />
                                        <span className="capitalize">{campaign.campaign_type}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Users className="h-4 w-4" />
                                        <span>{campaign.total_recipients.toLocaleString()} recipients</span>
                                      </div>
                                      {campaign.scheduled_at && (
                                        <div className="flex items-center gap-1.5">
                                          <Calendar className="h-4 w-4" />
                                          <span>{formatDateTime(campaign.scheduled_at)}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Message Preview */}
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-4 border border-gray-200 dark:border-gray-800">
                                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                        {campaign.message_template}
                                      </p>
                                      {campaign.buttons && campaign.buttons.length > 0 && (
                                        <div className="flex gap-2 mt-2">
                                          {campaign.buttons.map((button, idx) => (
                                            <Badge key={idx} variant="outline" className="text-xs">
                                              {button}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Metrics */}
                                    {campaign.sent_count > 0 && (
                                      <div className="grid grid-cols-6 gap-4">
                                        <div>
                                          <div className="text-xs font-medium text-gray-500 dark:text-gray-500 mb-1">Sent</div>
                                          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                            {campaign.sent_count.toLocaleString()}
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-xs font-medium text-gray-500 dark:text-gray-500 mb-1">Delivered</div>
                                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                            {campaign.delivered_count.toLocaleString()}
                                            <span className="text-xs ml-1">({deliveryRate}%)</span>
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-xs font-medium text-gray-500 dark:text-gray-500 mb-1">Read</div>
                                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                            {campaign.read_count.toLocaleString()}
                                            <span className="text-xs ml-1">({readRate}%)</span>
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-xs font-medium text-gray-500 dark:text-gray-500 mb-1">Clicked</div>
                                          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                            {campaign.clicked_count.toLocaleString()}
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-xs font-medium text-gray-500 dark:text-gray-500 mb-1">Replied</div>
                                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                            {campaign.replied_count.toLocaleString()}
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-xs font-medium text-gray-500 dark:text-gray-500 mb-1">Failed</div>
                                          <div className="text-lg font-bold text-red-600 dark:text-red-400">
                                            {campaign.failed_count.toLocaleString()}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="flex-shrink-0">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedCampaign(campaign)
                                        setShowDetailsDialog(true)
                                      }}>
                                        <BarChart className="mr-2 h-4 w-4" />
                                        View Analytics
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDuplicateCampaign(campaign)}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Duplicate
                                      </DropdownMenuItem>
                                      {campaign.status === 'draft' && (
                                        <DropdownMenuItem>
                                          <Send className="mr-2 h-4 w-4" />
                                          Send Now
                                        </DropdownMenuItem>
                                      )}
                                      {campaign.status === 'active' && (
                                        <DropdownMenuItem>
                                          <Pause className="mr-2 h-4 w-4" />
                                          Pause
                                        </DropdownMenuItem>
                                      )}
                                      {campaign.status === 'paused' && (
                                        <DropdownMenuItem>
                                          <Play className="mr-2 h-4 w-4" />
                                          Resume
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteCampaign(campaign.campaign_id)}
                                        className="text-red-600 dark:text-red-400"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Create New Campaign</DialogTitle>
                <DialogDescription className="text-base mt-1">Design and launch your WhatsApp marketing campaign</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex gap-0 overflow-hidden h-[calc(90vh-140px)]">
            {/* Left Side - Form */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-800">
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid gap-6 max-w-2xl">
                  {/* Basic Details Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
                      <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950">
                        <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Basic Details</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">Campaign Name *</Label>
                        <Input
                          id="name"
                          placeholder="e.g., Flash Sale - 50% Off"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type" className="text-sm font-medium">Campaign Type *</Label>
                        <Select value={formData.type} onValueChange={(value: CampaignType) => setFormData(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="promotional">🎯 Promotional</SelectItem>
                            <SelectItem value="transactional">📦 Transactional</SelectItem>
                            <SelectItem value="announcement">📢 Announcement</SelectItem>
                            <SelectItem value="reminder">⏰ Reminder</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="channel" className="text-sm font-medium">Channel *</Label>
                        <Select value={formData.channel} onValueChange={(value: 'whatsapp' | 'sms') => setFormData(prev => ({ ...prev, channel: value }))}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="whatsapp">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-green-600" />
                                WhatsApp
                              </div>
                            </SelectItem>
                            <SelectItem value="sms">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-blue-600" />
                                SMS
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recipients" className="text-sm font-medium">Total Recipients *</Label>
                        <Input
                          id="recipients"
                          type="number"
                          placeholder="e.g., 1000"
                          value={formData.recipients}
                          onChange={(e) => setFormData(prev => ({ ...prev, recipients: e.target.value }))}
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Message Content Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
                      <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-950">
                        <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Message Content</h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium">Message Template *</Label>
                      <Textarea
                        id="message"
                        placeholder="Hi {{name}}! 🎉 Exclusive offer just for you! Get {{discount}}% OFF on all products. Shop now: {{link}}"
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        className="resize-none"
                      />
                      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                          <p className="font-medium mb-1">Use dynamic variables:</p>
                          <p className="text-blue-600 dark:text-blue-400">{'{{name}} {{link}} {{discount}} {{order_id}} {{date}} {{amount}}'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buttons" className="text-sm font-medium">Call-to-Action Buttons</Label>
                      <Input
                        id="buttons"
                        placeholder="e.g., Shop Now, View Details, Learn More"
                        value={formData.buttons}
                        onChange={(e) => setFormData(prev => ({ ...prev, buttons: e.target.value }))}
                        className="h-11"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Separate multiple buttons with commas
                      </p>
                    </div>

                    {/* Media Upload */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Media Attachment (Optional)</Label>

                      {!formData.mediaPreview ? (
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                          <label htmlFor="media-upload" className="cursor-pointer">
                            <div className="flex flex-col items-center text-center">
                              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                                <ImageIcon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                              </div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                                Click to upload image or video
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                PNG, JPG, GIF, MP4 up to 10MB
                              </p>
                            </div>
                            <input
                              id="media-upload"
                              type="file"
                              accept="image/*,video/*"
                              onChange={handleMediaUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="relative border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                          {formData.mediaFile?.type.startsWith('image/') ? (
                            <img
                              src={formData.mediaPreview}
                              alt="Preview"
                              className="w-full h-48 object-cover"
                            />
                          ) : (
                            <video
                              src={formData.mediaPreview}
                              className="w-full h-48 object-cover"
                              controls
                            />
                          )}
                          <div className="absolute top-2 right-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={removeMedia}
                              className="h-8 w-8 p-0"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                            <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                              {formData.mediaFile?.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {(formData.mediaFile?.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scheduling Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
                      <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-950">
                        <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Schedule Campaign</h3>
                      <Badge variant="secondary" className="ml-auto text-xs">Optional</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="scheduledDate" className="text-sm font-medium">Date</Label>
                        <Input
                          id="scheduledDate"
                          type="date"
                          value={formData.scheduledDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="scheduledTime" className="text-sm font-medium">Time</Label>
                        <Input
                          id="scheduledTime"
                          type="time"
                          value={formData.scheduledTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                          className="h-11"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Leave empty to save as draft
                    </p>
                  </div>

                  {/* Target Audience Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
                      <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Target Audience</h3>
                      <Badge variant="secondary" className="ml-auto text-xs">Optional</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {audienceSegments.map((segment) => (
                        <div
                          key={segment.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${formData.targetAudience.includes(segment.id)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-sm'
                              : 'border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
                            }`}
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              targetAudience: prev.targetAudience.includes(segment.id)
                                ? prev.targetAudience.filter(id => id !== segment.id)
                                : [...prev.targetAudience, segment.id]
                            }))
                          }}
                        >
                          <div>
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{segment.label}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">{segment.count.toLocaleString()} contacts</div>
                          </div>
                          {formData.targetAudience.includes(segment.id) && (
                            <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                      ))}
                    </div>

                    {formData.targetAudience.length > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          {formData.targetAudience.length} segment(s) selected • {audienceSegments.filter(s => formData.targetAudience.includes(s.id)).reduce((sum, s) => sum + s.count, 0).toLocaleString()} total contacts
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer inside left panel */}
              <div className="border-t p-6 bg-gray-50 dark:bg-gray-900">
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => {
                    setShowCreateDialog(false)
                    resetForm()
                  }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateCampaign}
                    disabled={!formData.name || !formData.message || !formData.recipients}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Campaign
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Side - WhatsApp Preview */}
            <div className="w-[420px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 border-l border-gray-200 dark:border-gray-800 flex flex-col">
              <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-1">Preview</h3>
                <p className="text-xs text-gray-500 dark:text-gray-500 text-center">See how your message will look</p>
              </div>

              {/* WhatsApp Phone Mockup */}
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="relative mx-auto" style={{ width: '320px' }}>
                  <div className="relative bg-black rounded-[2.5rem] p-3 shadow-2xl">
                    <div className="bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden">
                      {/* WhatsApp Header */}
                      <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
                        <ChevronLeft className="h-5 w-5" />
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-300">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">Customer</div>
                          <div className="text-xs text-green-200">online</div>
                        </div>
                        <MoreVertical className="h-5 w-5" />
                      </div>

                      {/* Chat Area */}
                      <div className="h-[480px] bg-[#E5DDD5] dark:bg-gray-800 p-4 overflow-y-auto">
                        <div className="text-center mb-4">
                          <div className="inline-block bg-white dark:bg-gray-700 rounded-lg px-3 py-1 text-xs text-gray-600 dark:text-gray-400 shadow-sm">
                            Today
                          </div>
                        </div>

                        {/* Message Bubble */}
                        <div className="flex justify-start mb-4">
                          <div className="max-w-[85%]">
                            <div className="bg-white dark:bg-gray-700 rounded-lg rounded-tl-none shadow-md overflow-hidden">
                              {/* Media Preview */}
                              {formData.mediaPreview ? (
                                <div className="w-full">
                                  {formData.mediaFile?.type.startsWith('image/') ? (
                                    <img
                                      src={formData.mediaPreview}
                                      alt="Media"
                                      className="w-full h-40 object-cover"
                                    />
                                  ) : (
                                    <video
                                      src={formData.mediaPreview}
                                      className="w-full h-40 object-cover"
                                    />
                                  )}
                                </div>
                              ) : (
                                /* Default Product Image - Real Necklace Photo */
                                <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800">
                                  <img
                                    src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80"
                                    alt="Premium Gold Necklace"
                                    className="w-full h-full object-cover"
                                  />
                                  {/* Product Label */}
                                  <div className="absolute bottom-2 left-0 right-0 text-center">
                                    <div className="inline-block bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
                                      <span className="text-xs font-semibold text-white">
                                        Premium Gold Necklace
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Message Content */}
                              <div className="p-3">
                                {formData.name && (
                                  <div className="font-semibold mb-2 text-gray-900 dark:text-gray-100 text-sm">
                                    {formData.name}
                                  </div>
                                )}
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line mb-2">
                                  {formData.message || "Your message will appear here...\n\nStart typing to see a live preview!"}
                                </p>
                                {formData.buttons && formData.buttons.trim() && (
                                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                                    {formData.buttons.split(',').map((button, idx) => (
                                      <div key={idx} className="text-center py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                                        {button.trim()}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center justify-end mt-2">
                                  <span className="text-xs text-gray-500 dark:text-gray-500">
                                    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Input Area */}
                      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex items-center gap-2">
                        <div className="flex-1 bg-white dark:bg-gray-700 rounded-full px-4 py-2">
                          <span className="text-xs text-gray-400">Type a message</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#075E54] flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {formData.targetAudience.length > 0 && (
                <div className="p-4 text-center border-t border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Broadcasting to {formData.targetAudience.length} audience segment(s)
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog - Interakt Style */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-7xl max-h-[95vh] p-0">
          <div className="flex flex-col h-[95vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create New Campaign</h2>
              </div>
              <Button
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                onClick={() => {
                  setShowTemplateDialog(false)
                  setShowCreateDialog(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create from scratch
              </Button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left Side - Templates List */}
              <div className="w-1/2 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
                <Tabs defaultValue="samples" className="w-full">
                  <TabsList className="w-full justify-start rounded-none border-b border-gray-200 dark:border-gray-800 bg-transparent p-0">
                    <TabsTrigger value="samples" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-8 py-4">
                      Sample Ideas
                    </TabsTrigger>
                    <TabsTrigger value="active" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-8 py-4">
                      Active Templates
                    </TabsTrigger>
                  </TabsList>

                  <div className="p-6">
                    <div className="flex gap-3 mb-6">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input placeholder="Search by Theme" className="pl-9" />
                      </div>
                      <Button variant="outline">Refresh List</Button>
                    </div>

                    <TabsContent value="samples" className="mt-0 space-y-3">
                      {messageTemplates.map((template) => (
                        <Card
                          key={template.id}
                          className="border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer hover:shadow-md"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              message: template.message,
                              type: template.category as CampaignType,
                              hasMedia: template.hasMedia,
                            }))
                          }}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                  {template.name}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-500">(English)</p>
                              </div>
                              <Badge className={
                                template.category === 'promotional' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                                  template.category === 'transactional' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                                    'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                              }>
                                {template.category === 'promotional' ? 'Marketing' :
                                  template.category === 'transactional' ? 'Utility' : 'Marketing'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="active" className="mt-0">
                      <div className="text-center py-12 text-gray-500 dark:text-gray-500">
                        No active templates found
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              {/* Right Side - Preview */}
              <div className="w-1/2 bg-gray-50 dark:bg-gray-900 flex flex-col">
                <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-3">Preview</h3>
                  <Tabs defaultValue="android" className="w-full max-w-md mx-auto">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="android" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Android
                      </TabsTrigger>
                      <TabsTrigger value="ios" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        iOS
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="flex-1 flex items-center justify-center p-8">
                  <Tabs defaultValue="android" className="w-full max-w-md">
                    <TabsContent value="android" className="mt-0">
                      {/* WhatsApp Phone Mockup */}
                      <div className="relative mx-auto" style={{ width: '340px' }}>
                        {/* Phone Frame */}
                        <div className="relative bg-black rounded-[3rem] p-3 shadow-2xl">
                          {/* Screen */}
                          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden">
                            {/* WhatsApp Header */}
                            <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
                              <button className="text-white">
                                <ChevronLeft className="h-5 w-5" />
                              </button>
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
                                <Users className="h-6 w-6 text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-sm">Interakt.shop Sandbox</div>
                              </div>
                              <MoreVertical className="h-5 w-5" />
                            </div>

                            {/* Chat Area */}
                            <div className="h-[500px] bg-[#E5DDD5] dark:bg-gray-800 p-4 overflow-y-auto">
                              <div className="text-center mb-4">
                                <div className="inline-block bg-white dark:bg-gray-700 rounded-lg px-3 py-1 text-xs text-gray-600 dark:text-gray-400 shadow-sm">
                                  Today
                                </div>
                              </div>

                              {/* Message Bubble */}
                              <div className="flex justify-start mb-4">
                                <div className="max-w-[85%]">
                                  <div className="bg-white dark:bg-gray-700 rounded-lg rounded-tl-none shadow-md overflow-hidden">
                                    {/* Product Image - Real Necklace Photo */}
                                    <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800">
                                      <img
                                        src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80"
                                        alt="Premium Gold Necklace"
                                        className="w-full h-full object-cover"
                                      />
                                      {/* Product Label */}
                                      <div className="absolute bottom-2 left-0 right-0 text-center">
                                        <div className="inline-block bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
                                          <span className="text-xs font-semibold text-white">
                                            Premium Gold Necklace
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Message Content */}
                                    <div className="p-3">
                                      <div className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                                        Exclusive Offer Just for You!
                                      </div>
                                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line mb-2">
                                        {formData.message || "⭐ Hello! We have an exclusive offer just for you! Avail our special services at unmatched prices. Don't miss out on enhancing your business with Biznavigate!"}
                                      </p>
                                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                                        👉 Hurry! This offer lasts till the end of the month!
                                      </p>
                                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                                        For more details, tap below! 🙂
                                      </p>
                                      <div className="flex items-center justify-end">
                                        <span className="text-xs text-gray-500 dark:text-gray-500">05:57 pm</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="ios">
                      <div className="text-center py-12 text-gray-500">
                        iOS preview (same design)
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Use This Sample Button - Fixed at bottom */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    size="lg"
                    className="w-full bg-[#075E54] hover:bg-[#064e45] text-white"
                    onClick={() => {
                      setShowTemplateDialog(false)
                      setShowCreateDialog(true)
                    }}
                  >
                    Use this Sample
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaign Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Analytics</DialogTitle>
            <DialogDescription>
              {selectedCampaign?.campaign_name}
            </DialogDescription>
          </DialogHeader>

          {selectedCampaign && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-500 mb-1">Delivery Rate</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {selectedCampaign.sent_count > 0
                        ? ((selectedCampaign.delivered_count / selectedCampaign.sent_count) * 100).toFixed(1)
                        : '0'}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-500 mb-1">Read Rate</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedCampaign.delivered_count > 0
                        ? ((selectedCampaign.read_count / selectedCampaign.delivered_count) * 100).toFixed(1)
                        : '0'}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-500 mb-1">Click Rate</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {selectedCampaign.delivered_count > 0
                        ? ((selectedCampaign.clicked_count / selectedCampaign.delivered_count) * 100).toFixed(1)
                        : '0'}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Message Preview</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedCampaign.message_template}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Campaign Generator Dialog */}
      <Dialog open={showAIGeneratorDialog} onOpenChange={setShowAIGeneratorDialog}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              AI Campaign Generator
            </DialogTitle>
            <DialogDescription>
              Paste your business website URL and AI will analyze it to detect new products, upcoming sales, and generate targeted campaign suggestions with pricing, specs, and offers
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-6 overflow-hidden h-[calc(90vh-150px)]">
            {/* Left Side - AI Generator */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 pt-4">
                <div className="space-y-6">
                  {/* URL Input */}
                  <div className="space-y-3">
                    <Label htmlFor="websiteUrl" className="text-base font-semibold">Business Website URL</Label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="websiteUrl"
                          placeholder="https://yourbusiness.com"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          className="pl-9"
                          disabled={isAnalyzing}
                        />
                      </div>
                      <Button
                        onClick={handleAnalyzeWebsite}
                        disabled={!websiteUrl || isAnalyzing}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      AI will scan for: New product launches (specs, prices, images) • Upcoming sales/offers • Discounts • Best-matched audience segments
                    </p>
                  </div>

                  {/* AI Suggestions */}
                  {isAnalyzing && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-12 w-12 animate-spin text-purple-600 dark:text-purple-400 mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">Analyzing your website...</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        AI is generating personalized campaigns for you
                      </p>
                    </div>
                  )}

                  {!isAnalyzing && aiSuggestions.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          AI Generated Campaigns ({aiSuggestions.length})
                        </h3>
                        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          <Sparkles className="mr-1 h-3 w-3" />
                          AI Powered
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {aiSuggestions.map((suggestion) => (
                          <Card
                            key={suggestion.id}
                            className={`border-2 transition-all cursor-pointer ${selectedSuggestion?.id === suggestion.id
                                ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/20'
                                : 'border-gray-200 dark:border-gray-800 hover:border-purple-400 dark:hover:border-purple-600'
                              }`}
                            onClick={() => setSelectedSuggestion(suggestion)}
                          >
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  {/* Title and Type */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                      {suggestion.title}
                                    </h4>
                                    <Badge variant="outline" className="capitalize text-xs">
                                      {suggestion.type}
                                    </Badge>
                                    {suggestion.hasMedia && (
                                      <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300 text-xs">
                                        <ImageIcon className="mr-1 h-3 w-3" />
                                        Media
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Target Audience */}
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {suggestion.targetAudience.map((audienceId) => {
                                      const segment = audienceSegments.find(s => s.id === audienceId)
                                      return segment ? (
                                        <Badge key={audienceId} className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs">
                                          <Users className="mr-1 h-3 w-3" />
                                          {segment.label} ({segment.count.toLocaleString()})
                                        </Badge>
                                      ) : null
                                    })}
                                  </div>

                                  {/* Product Info (if available) */}
                                  {suggestion.productInfo && (
                                    <div className="mb-3 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-blue-600 text-white text-xs">
                                          🚀 New Product Detected
                                        </Badge>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                          {suggestion.productInfo.name}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                          <span className="font-bold text-green-600 dark:text-green-400">
                                            {suggestion.productInfo.price}
                                          </span>
                                          {suggestion.productInfo.discount && (
                                            <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 text-xs">
                                              {suggestion.productInfo.discount}
                                            </Badge>
                                          )}
                                        </div>
                                        {suggestion.productInfo.specs && suggestion.productInfo.specs.length > 0 && (
                                          <div className="flex flex-wrap gap-1.5">
                                            {suggestion.productInfo.specs.map((spec, idx) => (
                                              <Badge key={idx} variant="outline" className="text-xs">
                                                {spec}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Offer Info (if available) */}
                                  {suggestion.offerInfo && (
                                    <div className="mb-3 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-blue-600 text-white text-xs">
                                          🔥 Upcoming Sale Detected
                                        </Badge>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                          {suggestion.offerInfo.title}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                          <span className="font-bold text-blue-600 dark:text-blue-400">
                                            {suggestion.offerInfo.discountPercent}
                                          </span>
                                          <span className="text-gray-600 dark:text-gray-400">
                                            Valid till: {suggestion.offerInfo.validUntil}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Message Preview */}
                                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-3 border border-gray-200 dark:border-gray-800">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 whitespace-pre-line">
                                      {suggestion.message}
                                    </p>
                                    {suggestion.buttons.length > 0 && (
                                      <div className="flex gap-2 mt-2">
                                        {suggestion.buttons.map((button, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {button}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* AI Reasoning */}
                                  <div className="flex items-start gap-2 text-xs text-purple-600 dark:text-purple-400">
                                    <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <span className="italic">{suggestion.reasoning}</span>
                                  </div>
                                </div>

                                {/* Use Button */}
                                <Button
                                  size="sm"
                                  onClick={() => handleUseAISuggestion(suggestion)}
                                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex-shrink-0"
                                >
                                  Use Campaign
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isAnalyzing && aiSuggestions.length === 0 && websiteUrl && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="rounded-full bg-purple-100 dark:bg-purple-950 p-6 mb-4">
                        <Sparkles className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Ready to Generate Campaigns
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md">
                        Click "Generate" to let AI analyze your website and create personalized campaign suggestions
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer inside left panel */}
              <div className="border-t p-6 bg-gray-50 dark:bg-gray-900">
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => {
                    setShowAIGeneratorDialog(false)
                    setWebsiteUrl('')
                    setAiSuggestions([])
                  }}>
                    Close
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Side - WhatsApp Preview */}
            <div className="w-[420px] bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-l border-gray-200 dark:border-gray-800 flex flex-col">
              <div className="p-6 pb-4 border-b border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">AI Preview</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                  {selectedSuggestion ? 'Selected campaign preview' : aiSuggestions.length > 0 ? 'Click a campaign to preview' : 'Generate campaigns to preview'}
                </p>
              </div>

              {/* WhatsApp Phone Mockup */}
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="relative mx-auto" style={{ width: '320px' }}>
                  <div className="relative bg-black rounded-[2.5rem] p-3 shadow-2xl">
                    <div className="bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden">
                      {/* WhatsApp Header */}
                      <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
                        <ChevronLeft className="h-5 w-5" />
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-300">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm">Customer</div>
                          <div className="text-xs text-green-200">online</div>
                        </div>
                        <MoreVertical className="h-5 w-5" />
                      </div>

                      {/* Chat Area */}
                      <div className="h-[480px] bg-[#E5DDD5] dark:bg-gray-800 p-4 overflow-y-auto">
                        <div className="text-center mb-4">
                          <div className="inline-block bg-white dark:bg-gray-700 rounded-lg px-3 py-1 text-xs text-gray-600 dark:text-gray-400 shadow-sm">
                            Today
                          </div>
                        </div>

                        {/* Message Bubble */}
                        {selectedSuggestion ? (
                          /* Show selected AI suggestion */
                          <div className="flex justify-start mb-4">
                            <div className="max-w-[85%]">
                              <div className="bg-white dark:bg-gray-700 rounded-lg rounded-tl-none shadow-md overflow-hidden">
                                {/* Product Image for selected suggestion */}
                                {selectedSuggestion.hasMedia && (
                                  <div className="relative w-full h-40 bg-gray-100 dark:bg-gray-800">
                                    <img
                                      src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80"
                                      alt="Premium Gold Necklace"
                                      className="w-full h-full object-cover"
                                    />
                                    {/* Product Label */}
                                    <div className="absolute bottom-2 left-0 right-0 text-center">
                                      <div className="inline-block bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full">
                                        <span className="text-xs font-semibold text-white">
                                          Premium Gold Necklace
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="p-3">
                                  <div className="font-semibold mb-2 text-gray-900 dark:text-gray-100 text-sm">
                                    {selectedSuggestion.title}
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line mb-2">
                                    {selectedSuggestion.message}
                                  </p>
                                  {selectedSuggestion.buttons.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                                      {selectedSuggestion.buttons.map((button, idx) => (
                                        <div key={idx} className="text-center py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                                          {button}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex items-center justify-end mt-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-500">
                                      {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : aiSuggestions.length > 0 ? (
                          /* Show first 2 AI suggestions when none selected */
                          <div className="space-y-4">
                            {aiSuggestions.slice(0, 2).map((suggestion, idx) => (
                              <div key={idx} className="flex justify-start">
                                <div className="max-w-[85%]">
                                  <div className="bg-white dark:bg-gray-700 rounded-lg rounded-tl-none shadow-md overflow-hidden">
                                    {/* Product Image for AI suggestions */}
                                    {suggestion.hasMedia && (
                                      <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-800">
                                        <img
                                          src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80"
                                          alt="Premium Gold Necklace"
                                          className="w-full h-full object-cover"
                                        />
                                        {/* Product Label */}
                                        <div className="absolute bottom-1 left-0 right-0 text-center">
                                          <div className="inline-block bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                            <span className="text-xs font-semibold text-white">
                                              Premium Gold Necklace
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    <div className="p-3">
                                      <div className="font-semibold mb-2 text-gray-900 dark:text-gray-100 text-xs">
                                        {suggestion.title}
                                      </div>
                                      <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line mb-2 line-clamp-4">
                                        {suggestion.message}
                                      </p>
                                      {suggestion.buttons.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 space-y-1">
                                          {suggestion.buttons.slice(0, 2).map((button, btnIdx) => (
                                            <div key={btnIdx} className="text-center py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                                              {button}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      <div className="flex items-center justify-end mt-2">
                                        <span className="text-xs text-gray-500 dark:text-gray-500">
                                          {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex justify-start mb-4">
                            <div className="max-w-[85%]">
                              <div className="bg-white dark:bg-gray-700 rounded-lg rounded-tl-none shadow-md p-3">
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                  {isAnalyzing
                                    ? "🤖 AI is analyzing your website...\n\nGenerating personalized campaigns based on your products and offers!"
                                    : "✨ Enter your website URL and click Generate\n\nAI will create targeted campaigns for you!"
                                  }
                                </p>
                                <div className="flex items-center justify-end mt-2">
                                  <span className="text-xs text-gray-500 dark:text-gray-500">
                                    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Input Area */}
                      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex items-center gap-2">
                        <div className="flex-1 bg-white dark:bg-gray-700 rounded-full px-4 py-2">
                          <span className="text-xs text-gray-400">AI Generated Message</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#075E54] flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {aiSuggestions.length > 0 && (
                <div className="p-4 text-center border-t border-purple-200 dark:border-purple-800">
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    <Sparkles className="mr-1 h-3 w-3" />
                    {aiSuggestions.length} AI Campaigns Generated
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
