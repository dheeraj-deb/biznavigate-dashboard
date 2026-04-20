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
    { href: '/orders', label: 'Orders', icon: 'ShoppingCart', businessTypes: ['products'] },
    { href: '/crm/contacts', label: 'Contacts', icon: 'Users' },
    { href: '/crm/inbox', label: 'Live Chat', icon: 'Inbox' },
    { href: '/crm/handoff', label: 'Agent Queue', icon: 'Phone' },
    { href: '/crm/campaigns', label: 'Campaigns', icon: 'TrendingUp', businessTypes: ['events', 'products'] },
  ],

  // ── Sidebar Groups ─────────────────────────────────────────────────────────
  groups: [
    // ─ Front Desk / Event Management (hospitality & events only) ─────────────
    {
      name: 'Front Desk',
      displayName: { hospitality: 'Front Desk', events: 'Event Management' },
      icon: 'ConciergeBell',
      businessTypes: ['hospitality', 'events'],
      children: [
        {
          name: 'Bookings',
          displayName: { events: 'Event Bookings' },
          href: '/inventory/bookings',
          icon: 'CalendarCheck',
        },
        { name: 'Calendar', href: '/calendar', icon: 'Calendar', comingSoon: true },
        { name: 'Escalated Queries', href: '/escalated-queries', icon: 'AlertTriangle', comingSoon: true },
        { name: 'Payments', href: '/payments', icon: 'CreditCard' },
        { name: 'Reviews', href: '/reviews', icon: 'Star' },
      ],
    },

    // ─ Sales & Orders (products only) ────────────────────────────────────────
    {
      name: 'Sales & Orders',
      displayName: { products: 'Orders & Sales' },
      icon: 'ShoppingCart',
      businessTypes: ['products'],
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
      displayName: { hospitality: 'Properties', events: 'My Events', products: 'My Products' },
      icon: 'Package',
      children: [
        {
          name: 'Services & Rooms',
          displayName: { hospitality: 'My Rooms & Villas' },
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
        { name: 'Products', href: '/inventory/products', icon: 'Package', businessTypes: ['products'] },
        {
          name: 'Add Item',
          displayName: { hospitality: 'Add Property', events: 'Add Event', products: 'Add Product' },
          href: '/inventory/add',
          icon: 'Plus',
          businessTypes: ['hospitality', 'events', 'products'],
        },
        {
          name: 'Categories',
          displayName: { hospitality: 'Room Categories', events: 'Event Categories', products: 'Product Categories' },
          href: '/inventory/categories',
          icon: 'Layers',
          businessTypes: ['hospitality', 'events', 'products'],
        },
        { name: 'WhatsApp Catalog', href: '/inventory/catalog', icon: 'MessageSquare', businessTypes: ['products'] },
        { name: 'Stock Movements', href: '/inventory/stock-movements', icon: 'ArrowLeftRight', businessTypes: ['products'] },
      ],
    },

    // ─ CRM (all types, label changes per type) ───────────────────────────────
    {
      name: 'CRM',
      displayName: { hospitality: 'Guest Relations', events: 'Audience', products: 'Customers' },
      icon: 'Users',
      children: [
        {
          name: 'Leads',
          displayName: { hospitality: 'Guest Leads', events: 'Event Leads' },
          href: '/crm/leads',
          icon: 'UserPlus',
        },
        {
          name: 'Social Inbox',
          displayName: { hospitality: 'Guest Chat', events: 'Attendee Chat', products: 'Customer Chat' },
          href: '/crm/inbox',
          icon: 'Inbox',
        },
        {
          name: 'Agent Queue',
          displayName: { hospitality: 'Agent Queue', events: 'Agent Queue', products: 'Agent Queue' },
          href: '/crm/handoff',
          icon: 'Phone',
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
      icon: 'BarChart3',
      children: [
        { name: 'Overview', href: '/analytics', icon: 'BarChart3' },
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
      displayName: { hospitality: 'AI Assistant' },
      icon: 'Brain',
      children: [
        { name: 'Campaign Optimizer', href: '/campaigns/optimizer', icon: 'Zap', businessTypes: ['events', 'products'] },
        { name: 'Live Monitor', href: '/campaigns/live', icon: 'Activity' },
        { name: 'AI Chatbot', href: '/chatbot', icon: 'Bot' },
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
        { name: 'WhatsApp', href: '/settings/whatsapp', icon: 'MessageSquare' },
        { name: 'WA Templates', href: '/settings/whatsapp-templates', icon: 'FileText' },
        { name: 'WA Flows', href: '/settings/whatsapp-flows', icon: 'Layers' },
        { name: 'Instagram', href: '/settings/instagram', icon: 'Instagram' },
        { name: 'Integrations', href: '/settings/integrations', icon: 'Plug' },
        { name: 'Roles & Permissions', href: '/settings/roles', icon: 'Shield' },
        { name: 'Billing & Plan', href: '/settings/billing', icon: 'CreditCard' },
      ],
    },
  ],
}
