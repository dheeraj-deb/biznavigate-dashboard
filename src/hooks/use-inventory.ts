import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

// ============================================
// TYPES & INTERFACES
// ============================================

export type StockAdjustmentReason =
  | 'physical_count'
  | 'damage'
  | 'theft'
  | 'found'
  | 'correction'
  | 'expired'
  | 'other'

export interface InventoryLevel {
  inventory_level_id: string
  business_id: string
  tenant_id: string
  warehouse_id: string
  variant_id: string
  quantity_available: number
  quantity_reserved: number
  quantity_on_hand: number
  reorder_point?: number
  reorder_quantity?: number
  max_stock_level?: number
  unit_cost?: number
  total_value: number
  last_counted_at?: string
  created_at: string
  updated_at: string
}

export interface StockMovement {
  movement_id: string
  business_id: string
  tenant_id: string
  warehouse_id: string
  variant_id: string
  movement_type: string
  quantity_change: number
  quantity_before: number
  quantity_after: number
  unit_cost?: number
  reference_type?: string
  reference_id?: string
  notes?: string
  created_by?: string
  created_at: string
}

export interface LowStockAlert {
  alert_id: string
  business_id: string
  warehouse_id: string
  variant_id: string
  variant_name: string
  product_name: string
  current_stock: number
  reorder_point: number
  reorder_quantity: number
  severity: 'low' | 'critical' | 'out_of_stock'
  created_at: string
}

export interface InventorySummary {
  totalProducts: number
  totalStockValue: number
  lowStockCount: number
  outOfStockCount: number
  totalAvailableUnits: number
  totalReservedUnits: number
  healthScore: number
}

// Request DTOs
export interface AddStockDto {
  businessId: string
  tenantId: string
  warehouseId: string
  variantId: string
  quantity: number
  unitCost?: number
  referenceType?: string
  referenceId?: string
  notes?: string
  createdBy?: string
}

export interface DeductStockDto {
  businessId: string
  tenantId: string
  warehouseId: string
  variantId: string
  quantity: number
  referenceType?: string
  referenceId?: string
  notes?: string
  createdBy?: string
}

export interface AdjustStockDto {
  businessId: string
  tenantId: string
  warehouseId: string
  variantId: string
  quantityChange: number
  reason: StockAdjustmentReason
  notes?: string
  unitCost?: number
  createdBy?: string
}

export interface ReserveStockDto {
  businessId: string
  tenantId: string
  warehouseId: string
  variantId: string
  quantity: number
  orderId: string
  createdBy?: string
}

export interface ReleaseStockDto {
  businessId: string
  tenantId: string
  warehouseId: string
  variantId: string
  quantity: number
  orderId: string
  createdBy?: string
}

export interface TransferStockDto {
  businessId: string
  tenantId: string
  fromWarehouseId: string
  toWarehouseId: string
  variantId: string
  quantity: number
  notes?: string
  createdBy?: string
}

export interface UpdateReorderSettingsDto {
  businessId: string
  warehouseId: string
  variantId: string
  reorderPoint: number
  reorderQuantity: number
  maxStockLevel?: number
}

export interface GetInventoryLevelDto {
  businessId: string
  tenantId?: string
  warehouseId?: string
  variantId?: string
  lowStockOnly?: boolean
  outOfStockOnly?: boolean
}

export interface StockMovementQueryDto {
  businessId: string
  warehouseId?: string
  variantId?: string
  movementType?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

// ============================================
// QUERY HOOKS - Data Fetching
// ============================================

/**
 * Get inventory levels with filters
 * Shows current stock quantities, reserved, and available
 */
export function useInventoryLevels(filters: GetInventoryLevelDto) {
  return useQuery({
    queryKey: ['inventory', 'levels', filters],
    queryFn: async () => {
      const response = await apiClient.get('/inventory/levels', {
        params: filters,
      })
      return {
        data: response.data?.data || [],
        count: response.data?.count || 0,
      } as { data: InventoryLevel[]; count: number }
    },
    enabled: !!filters.businessId,
    retry: 1,
    retryDelay: 1000,
    staleTime: 30000, // Consider data stale after 30 seconds
  })
}

/**
 * Get stock movements (audit trail)
 * Shows history of all stock changes
 */
export function useStockMovements(filters: StockMovementQueryDto) {
  return useQuery({
    queryKey: ['inventory', 'movements', filters],
    queryFn: async () => {
      const response = await apiClient.get('/inventory/movements', {
        params: {
          ...filters,
          limit: filters.limit || 100,
          offset: filters.offset || 0,
        },
      })
      return {
        data: response.data?.data || [],
        count: response.data?.count || 0,
        pagination: response.data?.pagination,
      } as {
        data: StockMovement[]
        count: number
        pagination: { limit: number; offset: number }
      }
    },
    enabled: !!filters.businessId,
    retry: 1,
    retryDelay: 1000,
  })
}

/**
 * Get low stock alerts
 * Shows products that need reordering
 */
export function useLowStockAlerts(businessId: string, warehouseId?: string) {
  return useQuery({
    queryKey: ['inventory', 'alerts', 'low-stock', businessId, warehouseId],
    queryFn: async () => {
      const response = await apiClient.get('/inventory/alerts/low-stock', {
        params: {
          businessId,
          warehouseId,
        },
      })
      return {
        data: response.data?.data || [],
        count: response.data?.count || 0,
      } as { data: LowStockAlert[]; count: number }
    },
    enabled: !!businessId,
    retry: 1,
    retryDelay: 1000,
    refetchInterval: 60000, // Refresh every minute for alerts
    refetchIntervalInBackground: false,
  })
}

/**
 * Get inventory summary statistics
 * Shows overall inventory health
 */
export function useInventorySummary(businessId: string, warehouseId?: string) {
  return useQuery({
    queryKey: ['inventory', 'summary', businessId, warehouseId],
    queryFn: async () => {
      const response = await apiClient.get('/inventory/summary', {
        params: {
          businessId,
          warehouseId,
        },
      })
      return response.data?.data as InventorySummary
    },
    enabled: !!businessId,
    retry: 1,
    retryDelay: 1000,
    staleTime: 60000, // Consider data stale after 1 minute
  })
}

// ============================================
// MUTATION HOOKS - Stock Operations
// ============================================

/**
 * Add stock (purchase, production, etc.)
 */
export function useAddStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AddStockDto) => {
      const response = await apiClient.post('/inventory/stock/add', data)
      return response.data?.data
    },
    onSuccess: (data, variables) => {
      // Invalidate all inventory queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success(`Successfully added ${variables.quantity} units`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to add stock'
      toast.error(message)
    },
  })
}

/**
 * Deduct stock (sale, write-off, etc.)
 */
export function useDeductStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: DeductStockDto) => {
      const response = await apiClient.post('/inventory/stock/deduct', data)
      return response.data?.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success(`Successfully deducted ${variables.quantity} units`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to deduct stock'
      toast.error(message)
    },
  })
}

/**
 * Adjust stock (physical count, corrections)
 */
export function useAdjustStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AdjustStockDto) => {
      const response = await apiClient.post('/inventory/stock/adjust', data)
      return response.data?.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      const change = variables.quantityChange > 0 ? '+' : ''
      toast.success(`Successfully adjusted stock by ${change}${variables.quantityChange} units`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to adjust stock'
      toast.error(message)
    },
  })
}

/**
 * Reserve stock for orders
 */
export function useReserveStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ReserveStockDto) => {
      const response = await apiClient.post('/inventory/stock/reserve', data)
      return response.data?.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success(`Successfully reserved ${variables.quantity} units`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to reserve stock'
      toast.error(message)
    },
  })
}

/**
 * Release reserved stock (order cancelled)
 */
export function useReleaseStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ReleaseStockDto) => {
      const response = await apiClient.post('/inventory/stock/release', data)
      return response.data?.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success(`Successfully released ${variables.quantity} units`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to release stock'
      toast.error(message)
    },
  })
}

/**
 * Confirm sale (convert reserved to sold)
 */
export function useConfirmSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ReleaseStockDto) => {
      const response = await apiClient.post('/inventory/stock/confirm-sale', data)
      return response.data?.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success(`Successfully confirmed sale of ${variables.quantity} units`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to confirm sale'
      toast.error(message)
    },
  })
}

/**
 * Transfer stock between warehouses
 */
export function useTransferStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TransferStockDto) => {
      const response = await apiClient.post('/inventory/stock/transfer', data)
      return response.data?.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success(`Successfully transferred ${variables.quantity} units between warehouses`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to transfer stock'
      toast.error(message)
    },
  })
}

/**
 * Update reorder settings
 */
export function useUpdateReorderSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateReorderSettingsDto) => {
      const response = await apiClient.put('/inventory/reorder-settings', data)
      return response.data?.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Reorder settings updated successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update reorder settings'
      toast.error(message)
    },
  })
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get stock status badge color
 */
export function getStockStatusColor(level: InventoryLevel): string {
  const { quantity_available, reorder_point } = level

  if (quantity_available === 0) {
    return 'bg-red-100 text-red-800 border-red-200'
  }

  if (reorder_point && quantity_available <= reorder_point) {
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  return 'bg-green-100 text-green-800 border-green-200'
}

/**
 * Get stock status label
 */
export function getStockStatusLabel(level: InventoryLevel): string {
  const { quantity_available, reorder_point } = level

  if (quantity_available === 0) {
    return 'Out of Stock'
  }

  if (reorder_point && quantity_available <= reorder_point) {
    return 'Low Stock'
  }

  return 'In Stock'
}

/**
 * Get movement type icon and color
 */
export function getMovementTypeInfo(movementType: string): {
  icon: string
  color: string
  label: string
} {
  const types: Record<
    string,
    { icon: string; color: string; label: string }
  > = {
    add: { icon: 'Plus', color: 'text-green-600', label: 'Added' },
    deduct: { icon: 'Minus', color: 'text-red-600', label: 'Deducted' },
    adjust: { icon: 'Edit', color: 'text-blue-600', label: 'Adjusted' },
    reserve: { icon: 'Lock', color: 'text-blue-600', label: 'Reserved' },
    release: { icon: 'Unlock', color: 'text-purple-600', label: 'Released' },
    transfer_in: { icon: 'ArrowDownLeft', color: 'text-blue-600', label: 'Transfer In' },
    transfer_out: { icon: 'ArrowUpRight', color: 'text-blue-600', label: 'Transfer Out' },
    sale: { icon: 'ShoppingCart', color: 'text-green-600', label: 'Sale' },
  }

  return types[movementType] || { icon: 'Activity', color: 'text-gray-600', label: 'Unknown' }
}

/**
 * Get adjustment reason label
 */
export function getAdjustmentReasonLabel(reason: StockAdjustmentReason): string {
  const labels: Record<StockAdjustmentReason, string> = {
    physical_count: 'Physical Count',
    damage: 'Damaged',
    theft: 'Theft',
    found: 'Found',
    correction: 'Correction',
    expired: 'Expired',
    other: 'Other',
  }

  return labels[reason] || reason
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Calculate health score color
 */
export function getHealthScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-blue-600'
  return 'text-red-600'
}
