'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Phone,
  MessageCircle,
  Camera,
  Globe,
  Users,
  Clock,
  CheckCircle,
  LayoutGrid,
  Table,
  Filter,
  ChevronDown,
  Reply,
} from 'lucide-react'

const leads = [
  {
    id: '1',
    name: 'Priya Sharma',
    phone: '+91 98765 43210',
    source: 'instagram',
    product: 'Red Kurti',
    status: 'new',
    category: 'hot',
    time: '2m ago',
    date: 'Today',
    value: '₹2,499',
  },
  {
    id: '2',
    name: 'Rahul Kumar',
    phone: '+91 98765 43211',
    source: 'whatsapp',
    product: 'Blue Saree',
    status: 'replied',
    category: 'warm',
    time: '15m ago',
    date: 'Today',
    value: '₹4,599',
  },
  {
    id: '3',
    name: 'Anjali Verma',
    phone: '+91 98765 43212',
    source: 'whatsapp',
    product: 'Wedding Lehenga',
    status: 'replied',
    category: 'hot',
    time: '23m ago',
    date: 'Today',
    value: '₹15,999',
  },
  {
    id: '4',
    name: 'Sneha Patel',
    phone: '+91 98765 43213',
    source: 'instagram',
    product: 'Jewelry Set',
    status: 'converted',
    category: 'hot',
    time: '1h ago',
    date: 'Today',
    value: '₹3,299',
  },
  // {
  //   id: '5',
  //   name: 'Vikram Singh',
  //   phone: '+91 98765 43214',
  //   source: 'website',
  //   product: 'Wedding Collection',
  //   status: 'new',
  //   category: 'cold',
  //   time: '2h ago',
  //   date: 'Today',
  //   value: '—',
  // },
  // {
  //   id: '6',
  //   name: 'Meera Iyer',
  //   phone: '+91 98765 43215',
  //   source: 'instagram',
  //   product: 'Silk Saree',
  //   status: 'replied',
  //   category: 'warm',
  //   time: '1d ago',
  //   date: 'Yesterday',
  //   value: '₹6,999',
  // },
  // {
  //   id: '7',
  //   name: 'Arjun Reddy',
  //   phone: '+91 98765 43216',
  //   source: 'whatsapp',
  //   product: 'Sherwani',
  //   status: 'new',
  //   category: 'hot',
  //   time: '1d ago',
  //   date: 'Yesterday',
  //   value: '₹8,999',
  // },
  // {
  //   id: '8',
  //   name: 'Kavya Nair',
  //   phone: '+91 98765 43217',
  //   source: 'website',
  //   product: 'Bridal Collection',
  //   status: 'replied',
  //   category: 'hot',
  //   time: '2d ago',
  //   date: 'Last 7 Days',
  //   value: '₹25,999',
  // },
]

export default function LeadsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState<typeof leads[0] | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [leadsData, setLeadsData] = useState(leads)

  const handleStatusChange = (leadId: string, newStatus: string) => {
    setLeadsData((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      )
    )
  }

  const handleReplyClick = (lead: typeof leads[0]) => {
    // Close the dialog
    setSelectedLead(null)

    // Redirect to social inbox with contact name and platform
    router.push(`/crm/inbox?contact=${encodeURIComponent(lead.name)}&platform=${lead.source}`)
  }

  const filtered = leadsData.filter((lead) => {
    const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search) ||
      lead.product.toLowerCase().includes(search.toLowerCase())

    const matchesPlatform = platformFilter === 'all' || lead.source === platformFilter
    const matchesDate = dateFilter === 'all' || lead.date === dateFilter
    const matchesCategory = categoryFilter === 'all' || lead.category === categoryFilter

    return matchesSearch && matchesPlatform && matchesDate && matchesCategory
  })

  const stats = {
    total: leadsData.length,
    new: leadsData.filter((l) => l.status === 'new').length,
    replied: leadsData.filter((l) => l.status === 'replied').length,
    converted: leadsData.filter((l) => l.status === 'converted').length,
    hot: leadsData.filter((l) => l.category === 'hot').length,
    warm: leadsData.filter((l) => l.category === 'warm').length,
    cold: leadsData.filter((l) => l.category === 'cold').length,
  }

  const getStatusStyle = (status: string) => {
    if (status === 'new') return 'bg-blue-100 text-blue-700 border border-blue-600 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-500'
    if (status === 'replied') return 'bg-yellow-100 text-yellow-700 border border-yellow-600 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-500'
    if (status === 'converted') return 'bg-green-100 text-green-700 border border-green-600 dark:bg-green-950 dark:text-green-300 dark:border-green-500'
    return 'bg-gray-100 text-gray-700 border border-gray-600 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-500'
  }

  const getCategoryStyle = (category: string) => {
    if (category === 'hot') return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
    if (category === 'warm') return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
    if (category === 'cold') return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
    return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
  }

  const getRowCategoryColor = (category: string) => {
    if (category === 'hot') return 'bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100/70 dark:hover:bg-red-950/30'
    if (category === 'warm') return 'bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-100/70 dark:hover:bg-orange-950/30'
    if (category === 'cold') return 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/70 dark:hover:bg-blue-950/30'
    return 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
  }

  const getStatusColor = (status: string) => {
    if (status === 'new') return '#3b82f6'
    if (status === 'replied') return '#eab308'
    if (status === 'converted') return '#22c55e'
    return '#6b7280'
  }

  const getSourceIcon = (source: string) => {
    if (source === 'instagram') return <Camera className="h-4 w-4" />
    if (source === 'whatsapp') return <MessageCircle className="h-4 w-4" />
    return <Globe className="h-4 w-4" />
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leads</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Your customer inquiries</p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <Button
              size="sm"
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              onClick={() => setViewMode('cards')}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Cards
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              onClick={() => setViewMode('table')}
              className="gap-2"
            >
              <Table className="h-4 w-4" />
              Table
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <Users className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.new}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">New</div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                <MessageCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.replied}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Active</div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.converted}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Sales</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by name, phone, or product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-11 text-base"
              />
            </div>

            {/* Platform Filter */}
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full md:w-[180px] h-11">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="website">Website</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[180px] h-11">
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="Today">Today</SelectItem>
                <SelectItem value="Yesterday">Yesterday</SelectItem>
                <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px] h-11">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="hot">🔥 Hot</SelectItem>
                <SelectItem value="warm">🌤️ Warm</SelectItem>
                <SelectItem value="cold">❄️ Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Cards View */}
        {viewMode === 'cards' && (
          <div className="space-y-3">
            {filtered.map((lead) => (
              <Card
                key={lead.id}
                className="p-4 hover:shadow-lg transition-all cursor-pointer border-l-4"
                style={{ borderLeftColor: getStatusColor(lead.status) }}
                onClick={() => setSelectedLead(lead)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                        {lead.name}
                      </h3>
                      <Badge className={getStatusStyle(lead.status)}>
                        {lead.status}
                      </Badge>
                      <Badge variant="outline" className={getCategoryStyle(lead.category)}>
                        {lead.category === 'hot' && '🔥'}
                        {lead.category === 'warm' && '🌤️'}
                        {lead.category === 'cold' && '❄️'}
                        {' '}{lead.category}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Phone className="h-4 w-4" />
                        <span className="font-medium">{lead.phone}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        {getSourceIcon(lead.source)}
                        <span>via {lead.source}</span>
                        <span className="text-gray-400">•</span>
                        <span>{lead.time}</span>
                      </div>

                      <div className="text-gray-900 dark:text-white font-medium mt-2">
                        Interested in: {lead.product}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      {lead.value}
                    </div>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`https://wa.me/${lead.phone.replace(/\s+/g, '')}`, '_blank')
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {filtered.length === 0 && (
              <Card className="p-12 text-center">
                <div className="text-gray-400 dark:text-gray-500">
                  <Search className="h-16 w-16 mx-auto mb-3 opacity-50" />
                  <p className="text-lg">No leads found</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <Card>
            {/* Legend */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-6 text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Priority Legend:</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900" />
                  <span className="text-gray-600 dark:text-gray-400">🔥 Hot</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900" />
                  <span className="text-gray-600 dark:text-gray-400">🌤️ Warm</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900" />
                  <span className="text-gray-600 dark:text-gray-400">❄️ Cold</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Time
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filtered.map((lead) => (
                    <tr
                      key={lead.id}
                      className={`cursor-pointer transition-colors ${getRowCategoryColor(lead.category)}`}
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {lead.name}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="h-4 w-4" />
                          {lead.phone}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {lead.product}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {getSourceIcon(lead.source)}
                          {lead.source}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`${getStatusStyle(lead.status)} hover:opacity-80 gap-1 w-[110px] justify-between`}
                            >
                              {lead.status}
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusChange(lead.id, 'new')
                              }}
                              className="gap-2"
                            >
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
                              New
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusChange(lead.id, 'replied')
                              }}
                              className="gap-2"
                            >
                              <div className="w-3 h-3 rounded-full bg-yellow-500" />
                              Replied
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusChange(lead.id, 'converted')
                              }}
                              className="gap-2"
                            >
                              <div className="w-3 h-3 rounded-full bg-green-500" />
                              Converted
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusChange(lead.id, 'lost')
                              }}
                              className="gap-2"
                            >
                              <div className="w-3 h-3 rounded-full bg-gray-500" />
                              Lost
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-green-600 dark:text-green-400">
                          {lead.value}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          {lead.time}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`https://wa.me/${lead.phone.replace(/\s+/g, '')}`, '_blank')
                          }}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="p-12 text-center">
                  <div className="text-gray-400 dark:text-gray-500">
                    <Search className="h-16 w-16 mx-auto mb-3 opacity-50" />
                    <p className="text-lg">No leads found</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-md">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedLead.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status */}
                <Badge className={getStatusStyle(selectedLead.status)} style={{ fontSize: '14px', padding: '6px 12px' }}>
                  {selectedLead.status}
                </Badge>

                {/* Contact */}
                <div className="space-y-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className="text-base font-medium">{selectedLead.phone}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {getSourceIcon(selectedLead.source)}
                    <span className="text-base capitalize">{selectedLead.source}</span>
                  </div>
                </div>

                {/* Interest */}
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Interested In</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedLead.product}
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {selectedLead.value}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 w-full"
                    onClick={() => handleReplyClick(selectedLead)}
                  >
                    <Reply className="h-5 w-5 mr-2" />
                    Reply in Inbox
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
