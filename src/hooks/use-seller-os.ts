import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { apiClient } from '@/lib/api-client'

export interface SellerOsOverview {
  business_type: string
  seller_mode?: 'online_seller' | 'retail_seller' | 'wholesale_seller' | 'product_seller' | string
  features?: Record<string, boolean | string>
  title: string
  summary: {
    owner_queue: number
    today_orders: number
    open_enquiries: number
    active_products: number
    low_stock: number
    stock_holds: number
    pending_payments?: number
    cod_collections?: number
    returns_waiting: number
    deliveries_waiting: number
    credit_due: number
  }
  primary_actions: Array<{ key: string; label: string; count: number }>
  owner_queue: Array<{
    id: string
    type: string
    title: string
    text: string
    risk: 'low' | 'medium' | 'high' | string
    source: string
  }>
  ai_employees: Array<{
    key: string
    name: string
    simple_job: string
    today: string
    next: string
  }>
  workspaces: {
    approvals: any[]
    stock_reservations: any[]
    returns: any[]
    deliveries: any[]
    credit: {
      approved_customers: number
      pending_customers: number
      total_credit_due: number
    }
  }
  stock: {
    low_stock: any[]
    active_cart_holds: number
  }
  online_intelligence?: {
    period_days: number
    most_demanded_items: Array<{
      product_id: string
      name: string
      category?: string
      price: number
      stock_quantity: number
      reserved_stock: number
      available_stock: number
      asked_count: number
      sold_count: number
      hold_count: number
      out_of_stock_requests: number
      demand_score: number
      recommendation: string
    }>
    out_of_stock_demand: any[]
    fast_moving_low_stock: any[]
    ai_recommendations: Array<{
      key: string
      priority: 'low' | 'normal' | 'high' | string
      title: string
      text: string
      action: string
    }>
  }
  demand_heatmap: Array<{ category: string; inquiry_count: number }>
  dead_stock: any[]
  ai_audit_log: any[]
  feature_map: string[]
}

export interface ManualSalePayload {
  customer_phone: string
  customer_name?: string
  product_id?: string
  item_id?: string
  quantity: number
  payment_method: 'cash' | 'upi' | 'card' | 'cod' | 'credit' | 'other'
  notes?: string
  delivery_required?: boolean
  delivery_address?: string
}

export interface CreditCustomer {
  credit_account_id: string
  customer_id?: string
  phone: string
  customer_name?: string
  status: 'approved' | 'pending' | 'paused' | 'blocked' | string
  credit_limit: number
  current_balance: number
  available_credit: number
  due_days: number
  notes?: string
  can_use_credit: boolean
  credit_label: string
  credit_message: string
  recent_transactions?: Array<{
    credit_transaction_id: string
    transaction_type: string
    amount: number
    due_date?: string
    paid_at?: string
    notes?: string
    created_at?: string
  }>
}

export interface SellerPaymentDeskOrder {
  order_id: string
  order_number?: string
  customer_name?: string
  customer_phone?: string
  total_amount: number
  payment_status: string
  payment_method?: string
  payment_reference?: string
  payment_expires_at?: string
  payment_expires_in_minutes?: number | null
  paid_at?: string
  status?: string
  source?: string
  shipping_address?: string
  created_at?: string
  items: Array<{
    order_item_id: string
    product_id: string
    product_name: string
    quantity: number
    unit_price: number
    total_price: number
  }>
}

export interface SellerPaymentHold {
  reservation_id: string
  product_id: string
  product_name: string
  category?: string
  quantity: number
  customer_phone?: string
  payment_order_id?: string
  estimated_amount: number
  status: string
  expires_at?: string
  expires_in_minutes?: number | null
}

export interface SellerPaymentDesk {
  summary: {
    pending_payments: number
    cod_collections: number
    active_holds: number
    paid_today: number
  }
  pending_orders: SellerPaymentDeskOrder[]
  cod_orders: SellerPaymentDeskOrder[]
  paid_orders?: SellerPaymentDeskOrder[]
  active_holds: SellerPaymentHold[]
}

export type SellerLeadStage =
  | 'all'
  | 'new'
  | 'ai_chatting'
  | 'stock_held'
  | 'payment_waiting'
  | 'needs_owner'
  | 'won'
  | 'lost'

export interface SellerLeadCard {
  lead_id: string
  customer_name: string
  phone?: string
  source: string
  status?: string
  stage: Exclude<SellerLeadStage, 'all'>
  stage_label: string
  priority: 'normal' | 'medium' | 'high' | string
  lead_quality?: string
  lead_score?: number
  conversation_id?: string
  interested_products: Array<{
    product_id?: string
    name: string
    category?: string
    quantity?: number
  }>
  value: number
  order_count: number
  stock_hold_count: number
  owner_approval_count: number
  active_hold?: {
    reservation_id: string
    product_id: string
    product_name: string
    quantity: number
    expires_at?: string
  } | null
  pending_payment?: {
    order_id: string
    order_number?: string
    amount: number
    payment_method?: string
    expires_at?: string
  } | null
  latest_order?: {
    order_id: string
    order_number?: string
    amount: number
    payment_status?: string
    status?: string
    created_at?: string
  } | null
  last_ai_action?: {
    employee?: string
    action?: string
    decision?: string
    text?: string
    created_at?: string
  } | null
  next_action: string
  updated_at?: string
  created_at?: string
}

export interface SellerLeadsResponse {
  summary: {
    total: number
    open: number
    needs_owner: number
    stock_held: number
    payment_waiting: number
    won: number
  }
  stages: Array<{ key: SellerLeadStage; label: string; count: number }>
  leads: SellerLeadCard[]
  returned_count: number
  generated_at?: string
}

export interface SellerSetupProductPayload {
  product_id?: string
  name: string
  description?: string
  category?: string
  price: number
  cost_price?: number
  stock_quantity: number
  sku?: string
}

export interface SellerSetupPayload {
  store_type: 'online_seller' | 'retail_seller' | 'wholesale_seller' | 'product_seller'
  enable_credit: boolean
  stock_hold_minutes: number
  low_stock_threshold: number
  payment_modes: string[]
  delivery_modes: string[]
  delivery_areas: string[]
  default_credit_limit: number
  default_credit_due_days: number
  high_value_approval_amount: number
  require_owner_approval_for_credit: boolean
  products: SellerSetupProductPayload[]
}

export interface SellerStockProduct {
  product_id: string
  id: string
  name: string
  description?: string
  category?: string
  sku?: string
  price: number
  cost_price?: number
  margin_percent?: number
  currency?: string
  track_inventory?: boolean
  stock_quantity: number
  reserved_stock: number
  available_stock: number
  low_stock_threshold: number
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'not_tracked' | string
  in_stock: boolean
  is_active?: boolean
  primary_image_url?: string
  updated_at?: string
  created_at?: string
}

export interface SellerProductsStockResponse {
  summary: {
    total_products: number
    active_products: number
    low_stock: number
    out_of_stock: number
    active_holds: number
    total_stock_units: number
  }
  products: SellerStockProduct[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
  categories: string[]
  recent_adjustments: SellerStockAdjustment[]
}

export interface SellerStockAdjustment {
  adjustment_id: string
  product_id: string
  product_name?: string
  product_sku?: string
  adjustment_type: 'add' | 'reduce' | 'set' | string
  quantity_change: number
  quantity_before: number
  quantity_after: number
  reserved_before: number
  available_after: number
  reason: string
  source: string
  reference?: string
  note?: string
  created_at: string
}

export interface SellerProductImportRow {
  product_id?: string
  name: string
  description?: string
  category?: string
  price: number
  cost_price?: number
  stock_quantity?: number
  sku?: string
  image_url?: string
  is_active?: boolean
}

export interface SellerStockAdjustmentPayload {
  product_id: string
  adjustment_type: 'add' | 'reduce' | 'set'
  quantity: number
  reason: string
  reference?: string
  note?: string
}

function unwrap<T>(response: any): T {
  const raw = response?.data?.data ?? response?.data ?? response
  return (raw?.data ?? raw) as T
}

export function useSellerOsOverview() {
  return useQuery({
    queryKey: ['seller-os-overview'],
    queryFn: async () => {
      const overview = unwrap<SellerOsOverview>(await apiClient.get('/seller-os/overview'))
      return {
        ...overview,
        workspaces: {
          ...overview.workspaces,
          stock_reservations: (overview.workspaces?.stock_reservations ?? []).map((item: any) => ({
            ...item,
            reservation_id: item.reservation_id ?? item.seller_reservation_id,
          })),
        },
        dead_stock: (overview.dead_stock ?? []).map((item: any) => ({
          ...item,
          item_id: item.item_id ?? item.product_id,
          base_price: item.base_price ?? item.price,
        })),
        ai_audit_log: (overview.ai_audit_log ?? []).map((item: any) => ({
          ...item,
          ai_audit_id: item.ai_audit_id ?? item.audit_id,
          ai_employee: item.ai_employee ?? item.ai_employee_key,
        })),
      }
    },
    staleTime: 30000,
    retry: 1,
  })
}

export function useSellerSetup(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['seller-os-setup'],
    queryFn: async () => unwrap<any>(await apiClient.get('/seller-os/setup')),
    enabled: options?.enabled ?? true,
    staleTime: 30000,
    retry: 1,
  })
}

export function useSellerProductsStock(params?: {
  page?: number
  limit?: number
  search?: string
  category?: string
  status?: 'all' | 'active' | 'inactive' | 'low_stock' | 'out_of_stock'
}) {
  return useQuery({
    queryKey: ['seller-products-stock', params],
    queryFn: async () => unwrap<SellerProductsStockResponse>(await apiClient.get('/seller-os/products-stock', { params })),
    staleTime: 15000,
    retry: 1,
  })
}

export function useImportSellerProductsStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { products: SellerProductImportRow[]; source?: 'csv' | 'excel' | 'manual' }) => {
      return unwrap<any>(await apiClient.post('/seller-os/products-stock/import', payload))
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['seller-products-stock'] })
      queryClient.invalidateQueries({ queryKey: ['seller-os-overview'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      const created = result?.created_count ?? 0
      const updated = result?.updated_count ?? 0
      const failed = result?.failed_count ?? 0
      toast.success(`Import done: ${created} new, ${updated} updated${failed ? `, ${failed} failed` : ''}`)
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || 'Could not import products'),
  })
}

export function useAdjustSellerProductStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: SellerStockAdjustmentPayload) => {
      return unwrap<SellerStockAdjustment>(await apiClient.post('/seller-os/products-stock/adjustments', payload))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products-stock'] })
      queryClient.invalidateQueries({ queryKey: ['seller-os-overview'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Stock updated')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || 'Could not update stock'),
  })
}

export function useSellerStockAdjustments(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['seller-stock-adjustments', params],
    queryFn: async () => unwrap<any>(await apiClient.get('/seller-os/products-stock/adjustments', { params })),
    staleTime: 15000,
    retry: 1,
  })
}

export function useCompleteSellerSetup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: SellerSetupPayload) => {
      return unwrap<any>(await apiClient.post('/seller-os/setup/complete', payload))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-os-setup'] })
      queryClient.invalidateQueries({ queryKey: ['seller-os-overview'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Store setup saved')
    },
    onError: (err: any) => toast.error(err?.message || 'Could not save setup'),
  })
}

export function useCreateManualSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ManualSalePayload) => {
      const productId = payload.product_id ?? payload.item_id
      return unwrap<any>(await apiClient.post('/seller-os/manual-sales', {
        customer_phone: payload.customer_phone,
        customer_name: payload.customer_name,
        payment_method: payload.payment_method,
        notes: payload.notes,
        delivery_required: payload.delivery_required,
        delivery_address: payload.delivery_address,
        items: [{ product_id: productId, quantity: payload.quantity }],
      }))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-os-overview'] })
      queryClient.invalidateQueries({ queryKey: ['seller-os-leads'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order-stats'] })
      toast.success('Sale saved')
    },
    onError: (err: any) => toast.error(err?.message || 'Could not save sale'),
  })
}

export function useCreateStockReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      customer_phone?: string
      customer_name?: string
      product_id?: string
      item_id?: string
      quantity: number
      hold_minutes?: number
      reason?: string
    }) => unwrap<any>(await apiClient.post('/seller-os/stock-reservations', {
      ...payload,
      product_id: payload.product_id ?? payload.item_id,
      item_id: undefined,
    })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-os-overview'] })
      queryClient.invalidateQueries({ queryKey: ['seller-os-leads'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Stock held')
    },
    onError: (err: any) => toast.error(err?.message || 'Could not hold stock'),
  })
}

export function useReleaseStockReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (reservationId: string) => {
      return unwrap<any>(await apiClient.patch(`/seller-os/stock-reservations/${reservationId}/release`))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-os-overview'] })
      queryClient.invalidateQueries({ queryKey: ['seller-os-leads'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Stock hold released')
    },
    onError: (err: any) => toast.error(err?.message || 'Could not release stock'),
  })
}

export function useCreateCreditCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      phone: string
      customer_name?: string
      credit_limit: number
      opening_balance?: number
      due_days?: number
      status?: 'approved' | 'pending' | 'paused' | 'blocked'
      notes?: string
    }) => unwrap<any>(await apiClient.post('/seller-os/credit-customers', payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-os-overview'] })
      queryClient.invalidateQueries({ queryKey: ['seller-os-credit-customers'] })
      toast.success('Credit customer saved')
    },
    onError: (err: any) => toast.error(err?.message || 'Could not save credit customer'),
  })
}

export function useCreditCustomers() {
  return useQuery({
    queryKey: ['seller-os-credit-customers'],
    queryFn: async () => unwrap<CreditCustomer[]>(await apiClient.get('/seller-os/credit-customers')),
    staleTime: 30000,
    retry: 1,
  })
}

export function useCheckCreditCustomer(phone: string) {
  return useQuery({
    queryKey: ['seller-os-credit-check', phone],
    queryFn: async () => unwrap<any>(await apiClient.get('/seller-os/credit-customers/check', { params: { phone } })),
    enabled: phone.replace(/\D/g, '').length >= 7,
    staleTime: 15000,
    retry: 1,
  })
}

export function useCollectCreditPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      credit_account_id: string
      amount: number
      payment_method?: 'cash' | 'upi' | 'card' | 'bank' | 'other'
      notes?: string
    }) => unwrap<any>(await apiClient.post(`/seller-os/credit-customers/${payload.credit_account_id}/payments`, {
      amount: payload.amount,
      payment_method: payload.payment_method,
      notes: payload.notes,
    })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-os-overview'] })
      queryClient.invalidateQueries({ queryKey: ['seller-os-credit-customers'] })
      toast.success('Credit payment collected')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || 'Could not collect credit payment'),
  })
}

export function useAiGuardrailCheck() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      return unwrap<any>(await apiClient.post('/seller-os/ai/check', payload))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-os-overview'] })
    },
    onError: (err: any) => toast.error(err?.message || 'AI check failed'),
  })
}

export function useSellerPaymentDesk() {
  return useQuery({
    queryKey: ['seller-os-payment-desk'],
    queryFn: async () => unwrap<SellerPaymentDesk>(await apiClient.get('/seller-os/payment-desk')),
    staleTime: 15000,
    retry: 1,
  })
}

export function useSellerLeads(params?: {
  stage?: SellerLeadStage
  search?: string
  limit?: number
}) {
  return useQuery({
    queryKey: ['seller-os-leads', params],
    queryFn: async () => unwrap<SellerLeadsResponse>(await apiClient.get('/seller-os/leads', { params })),
    staleTime: 15000,
    retry: 1,
  })
}

export function useUpdateSellerLeadStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      lead_id: string
      status: 'new' | 'contacted' | 'qualified' | 'won' | 'lost'
      note?: string
      reason?: string
      next_followup_at?: string
    }) => unwrap<any>(await apiClient.patch(`/seller-os/leads/${payload.lead_id}/status`, {
      status: payload.status,
      note: payload.note,
      reason: payload.reason,
      next_followup_at: payload.next_followup_at,
    })),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ['seller-os-leads'] })
      queryClient.invalidateQueries({ queryKey: ['seller-os-overview'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', payload.lead_id] })
      toast.success('Enquiry updated')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || 'Could not update enquiry'),
  })
}

export function useCreatePaymentRequestFromHold() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      reservation_id: string
      payment_method?: 'upi' | 'cod' | 'cash' | 'card' | 'other'
      delivery_address?: string
      delivery_area?: string
      delivery_required?: boolean
      notes?: string
    }) => unwrap<any>(await apiClient.post(`/seller-os/payment-desk/holds/${payload.reservation_id}/payment-request`, {
      payment_method: payload.payment_method,
      delivery_address: payload.delivery_address,
      delivery_area: payload.delivery_area,
      delivery_required: payload.delivery_required,
      notes: payload.notes,
    })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-os-payment-desk'] })
      queryClient.invalidateQueries({ queryKey: ['seller-os-overview'] })
      queryClient.invalidateQueries({ queryKey: ['seller-os-leads'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order-stats'] })
      toast.success('Payment request created')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || 'Could not create payment request'),
  })
}

export function useMarkSellerOrderPaid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      order_id: string
      payment_method?: 'upi' | 'cod' | 'cash' | 'card' | 'other'
      payment_reference?: string
      notes?: string
    }) => unwrap<SellerPaymentDeskOrder>(await apiClient.patch(`/seller-os/payment-desk/orders/${payload.order_id}/paid`, {
      payment_method: payload.payment_method,
      payment_reference: payload.payment_reference,
      notes: payload.notes,
    })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-os-payment-desk'] })
      queryClient.invalidateQueries({ queryKey: ['seller-os-overview'] })
      queryClient.invalidateQueries({ queryKey: ['seller-os-leads'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order-stats'] })
      toast.success('Payment marked paid')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || 'Could not mark payment paid'),
  })
}

export function useCancelSellerPaymentOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { order_id: string; reason?: string }) => (
      unwrap<SellerPaymentDeskOrder>(await apiClient.patch(`/seller-os/payment-desk/orders/${payload.order_id}/cancel`, {
        reason: payload.reason,
      }))
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-os-payment-desk'] })
      queryClient.invalidateQueries({ queryKey: ['seller-os-overview'] })
      queryClient.invalidateQueries({ queryKey: ['seller-os-leads'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order-stats'] })
      toast.success('Order cancelled')
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || 'Could not cancel order'),
  })
}
