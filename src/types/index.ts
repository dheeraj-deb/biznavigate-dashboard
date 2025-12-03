// User and Authentication Types
export enum UserRole {
  ADMIN = 'ADMIN',
  SALES = 'SALES',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  createdAt: string
  updatedAt: string
  user_id?: string
  business_id?: string
  role_id?: string
  profile_completed?: boolean
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: {
    user_id: string
    email: string
    name: string
    business_id: string
    role_id: string
    profile_completed: boolean
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  tenant_name: string
  email: string
  password: string
  name?: string
  phone_number: string
}

// Product and Inventory Types
export interface Category {
  id: string
  name: string
  description?: string
  parentId?: string
  children?: Category[]
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: string
  name: string
  email: string
  phone: string
  address: string
  contactPerson?: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  name: string
  sku: string
  description?: string
  categoryId: string
  category?: Category
  supplierId: string
  supplier?: Supplier
  price: number
  cost: number
  stockQuantity: number
  minStockLevel: number
  maxStockLevel: number
  unit: string
  imageUrl?: string
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'
  createdAt: string
  updatedAt: string
}

export interface StockMovement {
  id: string
  productId: string
  product?: Product
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  reference?: string
  notes?: string
  performedBy: string
  createdAt: string
}

// CRM Types
export interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  position?: string
  address?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST',
}

export interface Lead {
  id: string
  contactId: string
  contact?: Contact
  title: string
  description?: string
  status: LeadStatus
  value: number
  probability: number
  source?: string
  assignedTo?: string
  expectedCloseDate?: string
  createdAt: string
  updatedAt: string
}

export interface Campaign {
  id: string
  name: string
  type: 'EMAIL' | 'SMS' | 'PHONE' | 'SOCIAL'
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  startDate?: string
  endDate?: string
  targetAudience?: string
  budget?: number
  createdAt: string
  updatedAt: string
}

export interface Interaction {
  id: string
  contactId: string
  contact?: Contact
  leadId?: string
  type: 'EMAIL' | 'CALL' | 'MEETING' | 'NOTE'
  subject: string
  description?: string
  outcome?: string
  performedBy: string
  createdAt: string
}

export interface FollowUp {
  id: string
  contactId: string
  contact?: Contact
  leadId?: string
  title: string
  description?: string
  dueDate: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  assignedTo: string
  createdAt: string
  updatedAt: string
}

// Order Types
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

export interface OrderItem {
  id: string
  productId: string
  product?: Product
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customer?: Contact
  items: OrderItem[]
  subtotal: number
  tax: number
  discount: number
  shippingCost: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod?: string
  shippingAddress: string
  trackingNumber?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// Analytics Types
export interface SalesReport {
  period: string
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  topProducts: Array<{
    productId: string
    productName: string
    quantity: number
    revenue: number
  }>
}

export interface LeadConversionReport {
  period: string
  totalLeads: number
  convertedLeads: number
  conversionRate: number
  averageConversionTime: number
  byStatus: Record<LeadStatus, number>
}

export interface InventoryReport {
  totalProducts: number
  totalValue: number
  lowStockProducts: Product[]
  outOfStockProducts: Product[]
  topMovingProducts: Array<{
    productId: string
    productName: string
    movements: number
  }>
}

// Chatbot Configuration
export interface ChatbotConfig {
  id: string
  apiKey: string
  endpoint: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  messageTemplates: Record<string, string>
  isEnabled: boolean
  createdAt: string
  updatedAt: string
}

// Notification Types
export interface Notification {
  id: string
  userId: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  title: string
  message: string
  read: boolean
  createdAt: string
}

// Dashboard Types
export interface DashboardStats {
  totalLeads: number
  newLeadsThisWeek: number
  newLeadsThisMonth: number
  leadsChange: number
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  ordersChange: number
  totalRevenue: number
  revenueChange: number
  lowStockCount: number
  inventoryValue: number
  inventoryChange: number
}

export interface ActivityItem {
  id: string
  type: 'lead' | 'order' | 'inventory'
  title: string
  description: string
  timestamp: string
  metadata?: {
    source?: 'Instagram' | 'WhatsApp' | 'Website' | 'Manual'
    status?: string
    amount?: number
    customer?: string
  }
}

export interface SalesChartData {
  date: string
  sales: number
  orders: number
}

export interface FunnelStage {
  stage: string
  count: number
  percentage: number
  color: string
}

export interface QuickAction {
  id: string
  label: string
  description: string
  icon: string
  href: string
  color: string
}

export interface DashboardAlert {
  id: string
  type: 'low_stock' | 'unpaid_order' | 'new_message' | 'high_value_lead'
  severity: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  actionLabel?: string
  actionHref?: string
  createdAt: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
  details?: Record<string, unknown>
}
