import type { BusinessType } from './navigation.types'
import type { DashboardLayoutConfig } from './navigation.types'

export const dashboardConfig: Record<BusinessType, DashboardLayoutConfig> = {
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
}
