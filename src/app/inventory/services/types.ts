export interface AttributeField {
  key: string
  label: string
  type: 'boolean' | 'number' | 'text' | 'select' | 'multi-select'
  options?: string[]
  required?: boolean
}

export interface ServiceSchema {
  label: string
  fields: AttributeField[]
}

export interface InventoryConfig {
  business_type: string
  service_types: string[]
  attribute_schema: Record<string, ServiceSchema>
}

export interface Service {
  service_id: string
  id?: string
  name: string
  type: string
  description?: string
  base_price: number
  capacity: number
  attributes: Record<string, unknown>
  image_urls?: string[]
  is_active: boolean
}

export interface AvailabilitySlot {
  date: string
  available_slots: number
  total_slots: number
  effective_price: number
  is_blocked: boolean
}

export interface ServiceFormData {
  name: string
  description: string
  base_price: string
  capacity: string
  image_urls: string[]
  attributes: Record<string, unknown>
}
