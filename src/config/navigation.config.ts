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
    { href: '/seller-os', label: 'Store Desk', icon: 'ShoppingBag', businessTypes: ['products', 'retail'] },
    { href: '/seller-os/leads', label: 'Customer Enquiries', icon: 'UserPlus', businessTypes: ['products', 'retail'] },
    { href: '/seller-os/payments', label: 'Payment Desk', icon: 'CreditCard', businessTypes: ['products', 'retail'] },
    { href: '/seller-os/credit', label: 'Credit', icon: 'CreditCard', businessTypes: ['products', 'retail'], sellerFeatures: ['credit_sales'] },
    { href: '/seller-setup', label: 'Store Setup', icon: 'ListChecks', businessTypes: ['products', 'retail'] },
    { href: '/orders', label: 'Orders', icon: 'ShoppingCart', businessTypes: ['products', 'retail'] },
    { href: '/ai-employees', label: 'AI Employees', icon: 'Bot', businessTypes: ['products', 'retail'] },
    { href: '/crm/contacts', label: 'Contacts', icon: 'Users' },
    { href: '/crm/inbox', label: 'WhatsApp Inbox', icon: 'Inbox' },
    { href: '/crm/handoff', label: 'Owner Replies', icon: 'Phone' },
    { href: '/crm/campaigns', label: 'Campaigns', icon: 'TrendingUp', businessTypes: ['events', 'products', 'retail', 'crm_automation'] },
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
      displayName: { products: 'Orders & Sales', retail: 'Orders & Sales' },
      icon: 'ShoppingCart',
      businessTypes: ['products', 'retail'],
      children: [
        { name: 'Customer Enquiries', href: '/seller-os/leads', icon: 'UserPlus' },
        { name: 'Store Desk', href: '/seller-os', icon: 'ShoppingBag' },
        { name: 'Payment Desk', href: '/seller-os/payments', icon: 'CreditCard' },
        { name: 'Credit', href: '/seller-os/credit', icon: 'CreditCard', sellerFeatures: ['credit_sales'] },
        { name: 'Store Setup', href: '/seller-setup', icon: 'ListChecks' },
        { name: 'Customers', href: '/customers', icon: 'Users' },
        { name: 'Orders', href: '/orders', icon: 'ShoppingCart' },
        { name: 'Payments', href: '/payments', icon: 'CreditCard' },
        { name: 'Reviews', href: '/reviews', icon: 'Star' },
      ],
    },

    // ─ Inventory (visible to all, items vary) ────────────────────────────────
    {
      name: 'Inventory',
      displayName: { hospitality: 'Rooms & Properties', events: 'My Events', products: 'My Products', retail: 'My Products' },
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
        { name: 'Products', href: '/inventory/products', icon: 'Package', businessTypes: ['products', 'retail'] },
        {
          name: 'Categories',
          displayName: { hospitality: 'Room Categories', events: 'Event Categories', products: 'Product Categories', retail: 'Product Categories' },
          href: '/inventory/categories',
          icon: 'Layers',
          businessTypes: ['hospitality', 'events', 'products', 'retail'],
        },
        { name: 'WhatsApp Catalog', href: '/inventory/catalog', icon: 'MessageSquare', businessTypes: ['products', 'retail'] },
        { name: 'Stock Movements', href: '/inventory/stock-movements', icon: 'ArrowLeftRight', businessTypes: ['products', 'retail'] },
      ],
    },

    // ─ CRM (all types, label changes per type) ───────────────────────────────
    {
      name: 'CRM',
      displayName: { hospitality: 'Enquiries', events: 'Enquiries', products: 'Customers', retail: 'Customers' },
      icon: 'Users',
      children: [
        {
          name: 'Leads',
          displayName: { hospitality: 'Guest Enquiries', events: 'Event Enquiries', products: 'Customer Enquiries', retail: 'Customer Enquiries' },
          href: '/crm/leads',
          icon: 'UserPlus',
          businessTypes: ['hospitality', 'events', 'healthcare', 'real_estate', 'professional_services', 'crm_automation', 'education'],
        },
        {
          name: 'Customer Enquiries',
          href: '/seller-os/leads',
          icon: 'UserPlus',
          businessTypes: ['products', 'retail'],
        },
        {
          name: 'Social Inbox',
          displayName: { hospitality: 'WhatsApp Inbox', events: 'WhatsApp Inbox', products: 'WhatsApp Inbox', retail: 'WhatsApp Inbox' },
          href: '/crm/inbox',
          icon: 'Inbox',
        },
        {
          name: 'Agent Queue',
          displayName: { hospitality: 'Needs Owner Reply', events: 'Needs Owner Reply', products: 'Needs Owner Reply', retail: 'Needs Owner Reply' },
          href: '/crm/handoff',
          icon: 'Phone',
        },
        { name: 'Follow-Ups', displayName: { hospitality: 'Follow-ups', events: 'Follow-ups', products: 'Follow-ups', retail: 'Follow-ups' }, href: '/crm/follow-ups', icon: 'Clock' },
        { name: 'Contacts', displayName: { hospitality: 'Guests', events: 'Contacts', products: 'Customers', retail: 'Customers' }, href: '/crm/contacts', icon: 'Contact' },
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
      displayName: { hospitality: 'Reports', events: 'Reports', products: 'Reports', retail: 'Reports' },
      icon: 'BarChart3',
      children: [
        { name: 'Overview', displayName: { hospitality: 'Business Summary', events: 'Business Summary', products: 'Business Summary', retail: 'Business Summary' }, href: '/analytics', icon: 'BarChart3' },
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
      displayName: { hospitality: 'AI Assistant', events: 'AI Assistant', products: 'AI Employees', retail: 'AI Employees' },
      icon: 'Brain',
      children: [
        { name: 'AI Employees', href: '/ai-employees', icon: 'Bot', businessTypes: ['products', 'retail'] },
        { name: 'Campaign Optimizer', displayName: { products: 'Marketing Employee', retail: 'Marketing Employee' }, href: '/campaigns/optimizer', icon: 'Zap', businessTypes: ['events', 'products', 'retail', 'crm_automation'] },
        { name: 'AI Chatbot', displayName: { hospitality: 'Chatbot Settings', events: 'Chatbot Settings', products: 'Chatbot Settings', retail: 'Chatbot Settings' }, href: '/chatbot', icon: 'Bot' },
        { name: 'Live Monitor', displayName: { hospitality: 'AI Activity', events: 'AI Activity', products: 'Employee Activity', retail: 'Employee Activity' }, href: '/campaigns/live', icon: 'Activity' },
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
        { name: 'Booking Methods', href: '/settings/booking-methods', icon: 'ListChecks', businessTypes: ['hospitality', 'events'] },
        { name: 'Booking Link', href: '/settings/booking-link', icon: 'Link', businessTypes: ['hospitality', 'events'] },
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
