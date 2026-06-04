import { dashboardConfig } from '@/config/dashboard.config'
import { navigationConfig } from '@/config/navigation.config'
import type { BusinessType, BusinessTypeConfig } from './business-type.types'

const sharedTerminology = {
  lead: 'Lead',
  leads: 'Leads',
  message: 'Message',
  messages: 'Messages',
  campaign: 'Campaign',
  campaigns: 'Campaigns',
}

const retailDashboard = dashboardConfig.retail ?? dashboardConfig.products
const genericDashboard = dashboardConfig.professional_services ?? dashboardConfig.crm_automation ?? dashboardConfig.products

export const businessTypeRegistry: Record<BusinessType, BusinessTypeConfig> = {
  hospitality: {
    type: 'hospitality',
    label: 'Hospitality',
    modules: ['crm', 'whatsapp', 'automations', 'bookings', 'catalog', 'payments', 'analytics', 'campaigns'],
    terminology: {
      ...sharedTerminology,
      customer: 'Guest',
      customers: 'Guests',
      order: 'Booking',
      orders: 'Bookings',
      item: 'Room',
      items: 'Rooms',
    },
    navigation: navigationConfig.groups,
    dashboard: dashboardConfig.hospitality,
  },
  events: {
    type: 'events',
    label: 'Events',
    modules: ['crm', 'whatsapp', 'automations', 'bookings', 'catalog', 'payments', 'analytics', 'campaigns'],
    terminology: {
      ...sharedTerminology,
      customer: 'Client',
      customers: 'Clients',
      order: 'Event Booking',
      orders: 'Event Bookings',
      item: 'Event',
      items: 'Events',
    },
    navigation: navigationConfig.groups,
    dashboard: dashboardConfig.events,
  },
  products: {
    type: 'products',
    label: 'Products',
    modules: ['crm', 'whatsapp', 'automations', 'orders', 'catalog', 'inventory', 'payments', 'analytics', 'campaigns'],
    terminology: {
      ...sharedTerminology,
      customer: 'Customer',
      customers: 'Customers',
      order: 'Order',
      orders: 'Orders',
      item: 'Product',
      items: 'Products',
    },
    navigation: navigationConfig.groups,
    dashboard: dashboardConfig.products,
  },
  crm_automation: {
    type: 'crm_automation',
    label: 'CRM & Automation',
    modules: ['crm', 'whatsapp', 'automations', 'analytics', 'campaigns'],
    terminology: {
      ...sharedTerminology,
      customer: 'Contact',
      customers: 'Contacts',
      order: 'Deal',
      orders: 'Deals',
      item: 'Offer',
      items: 'Offers',
    },
    navigation: navigationConfig.groups,
    dashboard: dashboardConfig.crm_automation,
  },
  retail: {
    type: 'retail',
    label: 'Retail',
    modules: ['crm', 'whatsapp', 'automations', 'orders', 'catalog', 'inventory', 'payments', 'analytics', 'campaigns'],
    terminology: {
      ...sharedTerminology,
      customer: 'Customer',
      customers: 'Customers',
      order: 'Order',
      orders: 'Orders',
      item: 'Product',
      items: 'Products',
    },
    navigation: navigationConfig.groups,
    dashboard: retailDashboard,
  },
  healthcare: {
    type: 'healthcare',
    label: 'Healthcare',
    modules: ['crm', 'whatsapp', 'automations', 'appointments', 'payments', 'analytics'],
    terminology: {
      ...sharedTerminology,
      customer: 'Patient',
      customers: 'Patients',
      order: 'Appointment',
      orders: 'Appointments',
      item: 'Service',
      items: 'Services',
    },
    navigation: navigationConfig.groups,
    dashboard: genericDashboard,
  },
  real_estate: {
    type: 'real_estate',
    label: 'Real Estate',
    modules: ['crm', 'whatsapp', 'automations', 'properties', 'payments', 'analytics', 'campaigns'],
    terminology: {
      ...sharedTerminology,
      customer: 'Buyer',
      customers: 'Buyers',
      order: 'Deal',
      orders: 'Deals',
      item: 'Property',
      items: 'Properties',
    },
    navigation: navigationConfig.groups,
    dashboard: genericDashboard,
  },
  used_cars: {
    type: 'used_cars',
    label: 'Used Cars',
    modules: ['crm', 'whatsapp', 'automations', 'catalog', 'inventory', 'payments', 'analytics', 'campaigns'],
    terminology: {
      ...sharedTerminology,
      customer: 'Buyer',
      customers: 'Buyers',
      order: 'Deal',
      orders: 'Deals',
      item: 'Vehicle',
      items: 'Vehicles',
    },
    navigation: navigationConfig.groups,
    dashboard: dashboardConfig.used_cars ?? dashboardConfig.real_estate ?? genericDashboard,
  },
  professional_services: {
    type: 'professional_services',
    label: 'Professional Services',
    modules: ['crm', 'whatsapp', 'automations', 'appointments', 'payments', 'analytics'],
    terminology: {
      ...sharedTerminology,
      customer: 'Client',
      customers: 'Clients',
      order: 'Engagement',
      orders: 'Engagements',
      item: 'Service',
      items: 'Services',
    },
    navigation: navigationConfig.groups,
    dashboard: genericDashboard,
  },
  education: {
    type: 'education',
    label: 'Education',
    modules: ['crm', 'whatsapp', 'automations', 'catalog', 'payments', 'analytics', 'campaigns'],
    terminology: {
      ...sharedTerminology,
      customer: 'Student',
      customers: 'Students',
      order: 'Enrollment',
      orders: 'Enrollments',
      item: 'Course',
      items: 'Courses',
    },
    navigation: navigationConfig.groups,
    dashboard: genericDashboard,
  },
}

export function getBusinessTypeConfig(type: BusinessType): BusinessTypeConfig {
  return businessTypeRegistry[type] ?? businessTypeRegistry.hospitality
}
