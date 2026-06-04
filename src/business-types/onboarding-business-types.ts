import type { BusinessType } from './business-type.types'

export interface OnboardingBusinessTypeOption {
  value: BusinessType
  label: string
  icon: string
  description: string
  explanation: string
  features: string[]
  industries: string[]
}

export const onboardingBusinessTypes: OnboardingBusinessTypeOption[] = [
  {
    value: 'crm_automation',
    label: 'CRM & Automation',
    icon: 'Bot',
    description: 'Leads, campaigns, workflows, FAQs and AI replies',
    explanation:
      'CRM & Automation is for businesses that do not need industry-specific booking, product, or property tools yet. BizNavigate gives you a shared workspace for managing leads, sending WhatsApp campaigns, automating follow-ups, answering FAQs, and routing customer conversations with AI.',
    features: ['Lead CRM', 'WhatsApp campaigns', 'Workflow automation', 'FAQ replies', 'AI handoff'],
    industries: ['Agencies', 'Sales teams', 'Support teams', 'Local businesses', 'Service teams'],
  },
  {
    value: 'hospitality',
    label: 'Hospitality',
    icon: 'Hotel',
    description: 'Hotels, resorts, villas, camps and stays',
    explanation:
      'Hospitality is for businesses that manage guest enquiries, rooms, availability, bookings, check-ins, and service requests. BizNavigate helps you turn WhatsApp conversations into guest leads, bookings, follow-ups, and automated responses while keeping your team in control.',
    features: ['Room and booking flows', 'Guest CRM', 'WhatsApp AI replies', 'Availability-aware enquiries'],
    industries: ['Hotels', 'Resorts', 'Villas', 'Homestays', 'Camping stays'],
  },
  {
    value: 'products',
    label: 'Product Sellers',
    icon: 'Store',
    description: 'Shops, ecommerce sellers, boutiques and distributors',
    explanation:
      'Product Sellers is for businesses that sell physical products on WhatsApp, online, or locally. BizNavigate can import an existing WhatsApp catalogue, keep inventory organized, capture product enquiries, and help owners review orders, payments, stock and follow-ups from one workspace.',
    features: ['WhatsApp catalogue import', 'Product inventory', 'Order enquiries', 'Stock follow-ups'],
    industries: ['Local shops', 'Ecommerce stores', 'D2C brands', 'Boutiques', 'Distributors'],
  },
  {
    value: 'healthcare',
    label: 'Healthcare',
    icon: 'HeartPulse',
    description: 'Clinics, appointments and patient enquiries',
    explanation:
      'Healthcare is for clinics and appointment-led practices. BizNavigate helps teams respond to patient enquiries, route appointments, manage follow-ups, and keep communication organized without losing the human handoff.',
    features: ['Appointment enquiries', 'Patient CRM', 'Follow-up reminders', 'Human handoff'],
    industries: ['Clinics', 'Dental practices', 'Wellness centers', 'Diagnostics', 'Therapy practices'],
  },
  {
    value: 'real_estate',
    label: 'Real Estate',
    icon: 'Building2',
    description: 'Properties, site visits and buyer leads',
    explanation:
      'Real estate is for teams that handle property enquiries, buyer qualification, site visits, and long-running lead follow-ups. BizNavigate keeps every conversation connected to a lead pipeline.',
    features: ['Property enquiries', 'Lead qualification', 'Visit follow-ups', 'Pipeline tracking'],
    industries: ['Agencies', 'Developers', 'Property consultants', 'Rental teams', 'Broker networks'],
  },
  {
    value: 'used_cars',
    label: 'Used Cars',
    icon: 'Car',
    description: 'Second hand car sales, enquiries and showroom visits',
    explanation:
      'Used Cars is for second hand car sellers who manage vehicle enquiries, availability checks, price sharing, test-drive or showroom visit slots, and buyer follow-ups from WhatsApp.',
    features: ['Vehicle catalogue', 'Buyer CRM', 'Visit slot follow-ups', 'Availability-aware replies'],
    industries: ['Used car dealers', 'Pre-owned car showrooms', 'Vehicle brokers', 'Certified resale teams'],
  },
  {
    value: 'professional_services',
    label: 'Services',
    icon: 'BriefcaseBusiness',
    description: 'Consultants, agencies and service teams',
    explanation:
      'Services is for businesses that sell time, expertise, consultations, or projects. BizNavigate helps capture enquiries, assign leads, automate follow-ups, and keep client conversations visible.',
    features: ['Client enquiries', 'Task follow-ups', 'Service CRM', 'Automation routing'],
    industries: ['Consultants', 'Agencies', 'Repair services', 'Legal offices', 'Local service providers'],
  },
  {
    value: 'education',
    label: 'Education',
    icon: 'GraduationCap',
    description: 'Courses, institutes and admissions',
    explanation:
      'Education is for institutes and course providers that manage admissions, student enquiries, batches, and follow-ups. BizNavigate helps convert conversations into structured student pipelines.',
    features: ['Admission enquiries', 'Student CRM', 'Course follow-ups', 'Campaigns'],
    industries: ['Training institutes', 'Schools', 'Coaching centers', 'Online courses', 'Skill academies'],
  },
  {
    value: 'events',
    label: 'Events',
    icon: 'Calendar',
    description: 'Events, venues, workshops and experiences',
    explanation:
      'Events is for businesses that manage bookings for venues, experiences, workshops, or campaigns. BizNavigate helps track attendees, event enquiries, payments, and automated reminders.',
    features: ['Event booking flows', 'Attendee CRM', 'Campaigns', 'Payment follow-ups'],
    industries: ['Venues', 'Workshops', 'Adventure events', 'Banquets', 'Concert teams'],
  },
]
