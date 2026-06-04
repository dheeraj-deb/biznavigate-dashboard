import { NavigationConfig } from './navigation.types'

/**
 * Config-driven navigation. Each NavGroup / NavItem can optionally specify
 * `businessTypes` — if omitted the item is visible to ALL types.
 * `displayName` — overrides the label per business type (href/routes never change).
 */
export const navigationConfig: NavigationConfig = {
  // ── Quick Links (top of sidebar) ───────────────────────────────────────────
  quickLinks: [
    { href: '/inventory/bookings', label: 'Bookings', icon: 'CalendarCheck', businessTypes: ['hospitality', 'events'] },
    { href: '/orders', label: 'Orders', icon: 'ShoppingCart', businessTypes: ['products', 'used_cars'] },
    { href: '/crm/contacts', label: 'Contacts', icon: 'Users' },
    { href: '/crm/inbox', label: 'Live Chat', icon: 'Inbox' },
    { href: '/crm/campaigns', label: 'Campaigns', icon: 'TrendingUp', businessTypes: ['events', 'products', 'used_cars', 'crm_automation'] },
  ],

  // ── Sidebar Groups ─────────────────────────────────────────────────────────
  groups: [
    // ─ Front Desk / Event Management (hospitality & events only) ─────────────
    {
      name: 'Front Desk',
      displayName: { hospitality: 'Bookings', events: 'Event Bookings' },
      icon: 'ConciergeBell',
      businessTypes: ['hospitality', 'events'],
      children: [
        {
          name: 'Bookings',
          displayName: { events: 'Event Bookings' },
          href: '/inventory/bookings',
          icon: 'CalendarCheck',
        },
        { name: 'Calendar', href: '/calendar', icon: 'Calendar' },
        { name: 'Escalated Queries', href: '/escalated-queries', icon: 'AlertTriangle', comingSoon: true },
        { name: 'Payments', href: '/payments', icon: 'CreditCard' },
        { name: 'Reviews', href: '/reviews', icon: 'Star' },
      ],
    },

    // ─ Sales & Orders (products only) ────────────────────────────────────────
    {
      name: 'Sales & Orders',
      displayName: { products: 'Orders & Sales', used_cars: 'Vehicle Sales' },
      icon: 'ShoppingCart',
      businessTypes: ['products', 'used_cars'],
      children: [
        { name: 'Customers', href: '/customers', icon: 'Users' },
        { name: 'Orders', href: '/orders', icon: 'ShoppingCart' },
        { name: 'Payments', href: '/payments', icon: 'CreditCard' },
        { name: 'Reviews', href: '/reviews', icon: 'Star' },
      ],
    },

    // ─ Inventory (visible to all, items vary) ────────────────────────────────
    {
      name: 'Inventory',
      displayName: { hospitality: 'Rooms & Properties', events: 'My Events', products: 'My Products', used_cars: 'My Vehicles' },
      icon: 'Package',
      children: [
        {
          name: 'Services & Rooms',
          displayName: { hospitality: 'Rooms, Villas & Dorms' },
          href: '/inventory/services',
          icon: 'BedDouble',
          businessTypes: ['hospitality'],
        },
        {
          name: 'Venues & Services',
          displayName: { events: 'My Events & Venues' },
          href: '/inventory/services',
          icon: 'Ticket',
          businessTypes: ['events'],
        },
        { name: 'Products', displayName: { used_cars: 'Vehicles' }, href: '/inventory/products', icon: 'Package', businessTypes: ['products', 'used_cars'] },
        {
          name: 'Categories',
          displayName: { hospitality: 'Room Categories', events: 'Event Categories', products: 'Product Categories', used_cars: 'Vehicle Categories' },
          href: '/inventory/categories',
          icon: 'Layers',
          businessTypes: ['hospitality', 'events', 'products', 'used_cars'],
        },
        { name: 'WhatsApp Catalog', href: '/inventory/catalog', icon: 'MessageSquare', businessTypes: ['products', 'used_cars'] },
        { name: 'Stock Movements', href: '/inventory/stock-movements', icon: 'ArrowLeftRight', businessTypes: ['products', 'used_cars'] },
      ],
    },

    // ─ CRM (all types, label changes per type) ───────────────────────────────
    {
      name: 'CRM',
      displayName: { hospitality: 'Enquiries', events: 'Enquiries', products: 'Customers', used_cars: 'Buyers' },
      icon: 'Users',
      children: [
        {
          name: 'Leads',
          displayName: { hospitality: 'Guest Enquiries', events: 'Event Enquiries', products: 'Customer Enquiries', used_cars: 'Buyer Enquiries' },
          href: '/crm/leads',
          icon: 'UserPlus',
        },
        {
          name: 'Social Inbox',
          displayName: { hospitality: 'WhatsApp Inbox', events: 'WhatsApp Inbox', products: 'WhatsApp Inbox', used_cars: 'WhatsApp Inbox' },
          href: '/crm/inbox',
          icon: 'Inbox',
        },
        { name: 'Follow-Ups', href: '/crm/follow-ups', icon: 'Clock' },
        { name: 'Contacts', href: '/crm/contacts', icon: 'Contact' },
        { name: 'Campaigns', href: '/crm/campaigns', icon: 'Mail' },
      ],
    },

    // ─ Automations (all types) ───────────────────────────────────────────────
    {
      name: 'Automations',
      icon: 'Zap',
      href: '/automations',
    },

    // ─ Analytics (all types, some items vary) ────────────────────────────────
    {
      name: 'Analytics',
      displayName: { hospitality: 'Reports', events: 'Reports', products: 'Reports' },
      icon: 'BarChart3',
      children: [
        { name: 'Overview', displayName: { hospitality: 'Business Summary', events: 'Business Summary', products: 'Business Summary' }, href: '/analytics', icon: 'BarChart3' },
        { name: 'AI Forecasting', href: '/analytics/forecasting', icon: 'Brain' },
        {
          name: 'Sales Reports',
          displayName: { hospitality: 'Revenue Reports' },
          href: '/analytics/sales',
          icon: 'TrendingUp',
        },
        { name: 'AI Dynamic Pricing', href: '/analytics/dynamic-pricing', icon: 'BadgeDollarSign', businessTypes: ['hospitality'], comingSoon: true },
        { name: 'Instagram', href: '/analytics/instagram', icon: 'Instagram' },
      ],
    },

    // ─ AI Tools (hospitality sees it as AI Assistant) ────────────────────────
    {
      name: 'AI Tools',
      displayName: { hospitality: 'AI Assistant', events: 'AI Assistant', products: 'AI Assistant' },
      icon: 'Brain',
      children: [
        { name: 'Campaign Optimizer', href: '/campaigns/optimizer', icon: 'Zap', businessTypes: ['events', 'products', 'used_cars', 'crm_automation'] },
        { name: 'AI Chatbot', displayName: { hospitality: 'Chatbot Settings', events: 'Chatbot Settings', products: 'Chatbot Settings' }, href: '/chatbot', icon: 'Bot' },
        { name: 'Live Monitor', displayName: { hospitality: 'AI Activity', events: 'AI Activity', products: 'AI Activity' }, href: '/campaigns/live', icon: 'Activity' },
        { name: 'Bot Business Data', href: '/chatbot/data', icon: 'Database', comingSoon: true },
      ],
    },

    // ─ Settings (all types) ──────────────────────────────────────────────────
    {
      name: 'Settings',
      icon: 'Settings',
      children: [
        { name: 'General', href: '/settings', icon: 'Settings' },
        { name: 'Business Profile', href: '/settings/business', icon: 'Building' },
        { name: 'Starter Templates', href: '/settings/starter-templates', icon: 'PackageCheck' },
        { name: 'WhatsApp', href: '/settings/whatsapp', icon: 'MessageSquare' },
        { name: 'Booking Methods', href: '/settings/booking-methods', icon: 'ListChecks' },
        { name: 'Booking Link', href: '/settings/booking-link', icon: 'Link' },
        { name: 'WA Templates', href: '/settings/whatsapp-templates', icon: 'FileText' },
        { name: 'WA Flows', href: '/settings/whatsapp-flows', icon: 'Layers' },
        { name: 'Instagram', href: '/settings/instagram', icon: 'Instagram' },
        { name: 'Integrations', href: '/settings/integrations', icon: 'Plug' },
        { name: 'Roles & Permissions', href: '/settings/roles', icon: 'Shield' },
        { name: 'Billing & Plan', href: '/billing', icon: 'CreditCard' },
      ],
    },
  ],
}
