import type { BusinessType } from './navigation.types'
import type { DashboardLayoutConfig } from './navigation.types'

export const dashboardConfig: Partial<Record<BusinessType, DashboardLayoutConfig>> & {
  hospitality: DashboardLayoutConfig
  events: DashboardLayoutConfig
  products: DashboardLayoutConfig
  crm_automation: DashboardLayoutConfig
} = {
  // ── Hospitality ────────────────────────────────────────────────────────────
  hospitality: {
    stats: [
      { key: 'revenue', label: 'Revenue', icon: 'IndianRupee', color: 'emerald', valueKey: 'totalRevenue', changeKey: 'revenueChange', prefix: '₹' },
      { key: 'bookings', label: 'Bookings', icon: 'CalendarCheck', color: 'blue', valueKey: 'totalOrders', changeKey: 'ordersChange' },
      { key: 'guests', label: 'Guests', icon: 'Users', color: 'purple', valueKey: 'totalCustomers', changeKey: 'customersChange' },
      { key: 'rating', label: 'Avg Rating', icon: 'Star', color: 'amber', valueKey: 'avgRating', suffix: '/5' },
    ],
    widgets: [
      { key: 'recent-bookings', component: 'RecentBookings', colSpan: 8, title: 'Recent Bookings' },
      { key: 'check-in-status', component: 'CheckInStatus', colSpan: 4, title: "Today's Activity" },
      { key: 'revenue-chart', component: 'RevenueChart', colSpan: 6, title: 'Revenue Trend' },
      { key: 'occupancy-chart', component: 'OccupancyChart', colSpan: 6, title: 'Occupancy Rate' },
      { key: 'activity-feed', component: 'ActivityFeed', colSpan: 12, title: 'Recent Activity' },
    ],
  },

  // ── Events ─────────────────────────────────────────────────────────────────
  events: {
    stats: [
      { key: 'revenue', label: 'Revenue', icon: 'IndianRupee', color: 'emerald', valueKey: 'totalRevenue', changeKey: 'revenueChange', prefix: '₹' },
      { key: 'events', label: 'Upcoming Events', icon: 'Calendar', color: 'blue', valueKey: 'totalOrders', changeKey: 'ordersChange' },
      { key: 'clients', label: 'Clients', icon: 'Users', color: 'purple', valueKey: 'totalCustomers', changeKey: 'customersChange' },
      { key: 'conversations', label: 'Conversations', icon: 'MessageSquare', color: 'pink', valueKey: 'totalConversations', changeKey: 'conversationChange' },
    ],
    widgets: [
      { key: 'recent-bookings', component: 'RecentBookings', colSpan: 8, title: 'Recent Bookings' },
      { key: 'activity-feed', component: 'ActivityFeed', colSpan: 4, title: 'Recent Activity' },
      { key: 'revenue-chart', component: 'RevenueChart', colSpan: 6, title: 'Revenue Trend' },
      { key: 'top-products', component: 'TopProducts', colSpan: 6, title: 'Top Services' },
    ],
  },

  // ── Products ───────────────────────────────────────────────────────────────
  products: {
    stats: [
      { key: 'revenue', label: 'Revenue', icon: 'IndianRupee', color: 'emerald', valueKey: 'totalRevenue', changeKey: 'revenueChange', prefix: '₹' },
      { key: 'orders', label: 'Orders', icon: 'ShoppingCart', color: 'blue', valueKey: 'totalOrders', changeKey: 'ordersChange' },
      { key: 'customers', label: 'Customers', icon: 'Users', color: 'purple', valueKey: 'totalCustomers', changeKey: 'customersChange' },
      { key: 'conversations', label: 'Conversations', icon: 'MessageSquare', color: 'pink', valueKey: 'totalConversations', changeKey: 'conversationChange' },
    ],
    widgets: [
      { key: 'recent-orders', component: 'RecentOrders', colSpan: 8, title: 'Recent Orders' },
      { key: 'activity-feed', component: 'ActivityFeed', colSpan: 4, title: 'Recent Activity' },
      { key: 'revenue-chart', component: 'RevenueChart', colSpan: 6, title: 'Sales Trend' },
      { key: 'top-products', component: 'TopProducts', colSpan: 6, title: 'Top Products' },
    ],
  },

  // ── CRM & Automation ──────────────────────────────────────────────────────
  crm_automation: {
    stats: [
      { key: 'contacts', label: 'Contacts', icon: 'Users', color: 'blue', valueKey: 'totalCustomers', changeKey: 'customersChange' },
      { key: 'conversions', label: 'Converted Leads', icon: 'CheckCircle2', color: 'emerald', valueKey: 'totalOrders', changeKey: 'ordersChange' },
      { key: 'conversion-rate', label: 'Conversion Rate', icon: 'TrendingUp', color: 'purple', valueKey: 'conversionRate', changeKey: 'conversionChange', suffix: '%' },
      { key: 'pipeline-value', label: 'Pipeline Value', icon: 'IndianRupee', color: 'amber', valueKey: 'totalRevenue', changeKey: 'revenueChange', prefix: '₹' },
    ],
    widgets: [
      { key: 'activity-feed', component: 'ActivityFeed', colSpan: 6, title: 'Recent Activity' },
      { key: 'revenue-chart', component: 'RevenueChart', colSpan: 6, title: 'Conversion Trend' },
    ],
  },

  // ── Shared non-commerce/non-hospitality dashboards ─────────────────────────
  retail: {
    stats: [
      { key: 'revenue', label: 'Revenue', icon: 'IndianRupee', color: 'emerald', valueKey: 'totalRevenue', changeKey: 'revenueChange', prefix: '₹' },
      { key: 'orders', label: 'Orders', icon: 'ShoppingCart', color: 'blue', valueKey: 'totalOrders', changeKey: 'ordersChange' },
      { key: 'customers', label: 'Customers', icon: 'Users', color: 'purple', valueKey: 'totalCustomers', changeKey: 'customersChange' },
      { key: 'conversion-rate', label: 'Conversion Rate', icon: 'TrendingUp', color: 'pink', valueKey: 'conversionRate', changeKey: 'conversionChange', suffix: '%' },
    ],
    widgets: [
      { key: 'recent-orders', component: 'RecentOrders', colSpan: 8, title: 'Recent Orders' },
      { key: 'activity-feed', component: 'ActivityFeed', colSpan: 4, title: 'Recent Activity' },
      { key: 'revenue-chart', component: 'RevenueChart', colSpan: 6, title: 'Sales Trend' },
      { key: 'top-products', component: 'TopProducts', colSpan: 6, title: 'Top Products' },
    ],
  },

  healthcare: {
    stats: [
      { key: 'patients', label: 'Patients', icon: 'Users', color: 'blue', valueKey: 'totalCustomers', changeKey: 'customersChange' },
      { key: 'appointments', label: 'Appointments', icon: 'CalendarCheck', color: 'emerald', valueKey: 'totalOrders', changeKey: 'ordersChange' },
      { key: 'conversion-rate', label: 'Conversion Rate', icon: 'TrendingUp', color: 'purple', valueKey: 'conversionRate', changeKey: 'conversionChange', suffix: '%' },
      { key: 'revenue', label: 'Revenue', icon: 'IndianRupee', color: 'amber', valueKey: 'totalRevenue', changeKey: 'revenueChange', prefix: '₹' },
    ],
    widgets: [
      { key: 'activity-feed', component: 'ActivityFeed', colSpan: 6, title: 'Recent Activity' },
      { key: 'revenue-chart', component: 'RevenueChart', colSpan: 6, title: 'Appointment Trend' },
    ],
  },

  real_estate: {
    stats: [
      { key: 'buyers', label: 'Buyer Leads', icon: 'Users', color: 'blue', valueKey: 'totalCustomers', changeKey: 'customersChange' },
      { key: 'deals', label: 'Deals', icon: 'CheckCircle2', color: 'emerald', valueKey: 'totalOrders', changeKey: 'ordersChange' },
      { key: 'conversion-rate', label: 'Conversion Rate', icon: 'TrendingUp', color: 'purple', valueKey: 'conversionRate', changeKey: 'conversionChange', suffix: '%' },
      { key: 'pipeline-value', label: 'Pipeline Value', icon: 'IndianRupee', color: 'amber', valueKey: 'totalRevenue', changeKey: 'revenueChange', prefix: '₹' },
    ],
    widgets: [
      { key: 'activity-feed', component: 'ActivityFeed', colSpan: 6, title: 'Recent Activity' },
      { key: 'revenue-chart', component: 'RevenueChart', colSpan: 6, title: 'Deal Trend' },
    ],
  },

  professional_services: {
    stats: [
      { key: 'clients', label: 'Clients', icon: 'Users', color: 'blue', valueKey: 'totalCustomers', changeKey: 'customersChange' },
      { key: 'engagements', label: 'Engagements', icon: 'CheckCircle2', color: 'emerald', valueKey: 'totalOrders', changeKey: 'ordersChange' },
      { key: 'conversion-rate', label: 'Conversion Rate', icon: 'TrendingUp', color: 'purple', valueKey: 'conversionRate', changeKey: 'conversionChange', suffix: '%' },
      { key: 'revenue', label: 'Revenue', icon: 'IndianRupee', color: 'amber', valueKey: 'totalRevenue', changeKey: 'revenueChange', prefix: '₹' },
    ],
    widgets: [
      { key: 'activity-feed', component: 'ActivityFeed', colSpan: 6, title: 'Recent Activity' },
      { key: 'revenue-chart', component: 'RevenueChart', colSpan: 6, title: 'Engagement Trend' },
    ],
  },

  education: {
    stats: [
      { key: 'students', label: 'Students', icon: 'Users', color: 'blue', valueKey: 'totalCustomers', changeKey: 'customersChange' },
      { key: 'enrollments', label: 'Enrollments', icon: 'CheckCircle2', color: 'emerald', valueKey: 'totalOrders', changeKey: 'ordersChange' },
      { key: 'conversion-rate', label: 'Conversion Rate', icon: 'TrendingUp', color: 'purple', valueKey: 'conversionRate', changeKey: 'conversionChange', suffix: '%' },
      { key: 'revenue', label: 'Revenue', icon: 'IndianRupee', color: 'amber', valueKey: 'totalRevenue', changeKey: 'revenueChange', prefix: '₹' },
    ],
    widgets: [
      { key: 'activity-feed', component: 'ActivityFeed', colSpan: 6, title: 'Recent Activity' },
      { key: 'revenue-chart', component: 'RevenueChart', colSpan: 6, title: 'Enrollment Trend' },
    ],
  },
}
