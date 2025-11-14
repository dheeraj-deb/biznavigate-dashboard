'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart,
  Plus,
  Trash2,
  Search,
  ArrowLeft,
  Save,
  User,
  Package,
  DollarSign,
  Truck,
  CreditCard
} from 'lucide-react'
import { useCreateOrder } from '@/hooks/use-orders'
import { useCustomers } from '@/hooks/use-customers'
import { useProducts } from '@/hooks/use-products'
import toast from 'react-hot-toast'

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

interface OrderFormData {
  customerId: string
  items: OrderItem[]
  shippingAddress: string
  paymentMethod: string
  notes: string
  discount: number
  shippingCost: number
  tax: number
}

export default function CreateOrderPage() {
  const router = useRouter()
  const createOrder = useCreateOrder()

  // Fetch customers and products
  const { data: customersData, isLoading: loadingCustomers } = useCustomers()
  const { data: productsData, isLoading: loadingProducts } = useProducts(1, 100)

  const [formData, setFormData] = useState<OrderFormData>({
    customerId: '',
    items: [],
    shippingAddress: '',
    paymentMethod: 'cash',
    notes: '',
    discount: 0,
    shippingCost: 0,
    tax: 0
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

  // Calculate totals
  const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = (subtotal * formData.tax) / 100
  const total = subtotal + taxAmount + formData.shippingCost - formData.discount

  // Filter products based on search
  const filteredProducts = productsData?.data?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Handle customer selection
  const handleCustomerChange = (customerId: string) => {
    const customer = customersData?.customers?.find(c => c.customer_id === customerId)
    setSelectedCustomer(customer)
    setFormData(prev => ({
      ...prev,
      customerId,
      shippingAddress: customer?.email || ''
    }))
  }

  // Add product to order
  const addProduct = (product: any) => {
    const existingItem = formData.items.find(item => item.productId === product.id)

    if (existingItem) {
      // Increase quantity
      updateItemQuantity(product.id, existingItem.quantity + 1)
    } else {
      // Add new item
      const newItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        total: product.price
      }

      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }))
    }

    setSearchTerm('')
    setShowProductSearch(false)
  }

  // Update item quantity
  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.productId === productId) {
          const total = (item.unitPrice * quantity) - item.discount
          return { ...item, quantity, total }
        }
        return item
      })
    }))
  }

  // Update item discount
  const updateItemDiscount = (productId: string, discount: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.productId === productId) {
          const total = (item.unitPrice * item.quantity) - discount
          return { ...item, discount, total }
        }
        return item
      })
    }))
  }

  // Remove item
  const removeItem = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId)
    }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.customerId) {
      toast.error('Please select a customer')
      return
    }

    if (formData.items.length === 0) {
      toast.error('Please add at least one product')
      return
    }

    if (!formData.shippingAddress.trim()) {
      toast.error('Please enter a shipping address')
      return
    }

    // Prepare order data
    const orderData = {
      customerId: formData.customerId,
      items: formData.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount
      })),
      subtotal,
      tax: taxAmount,
      discount: formData.discount,
      shippingCost: formData.shippingCost,
      total,
      shippingAddress: formData.shippingAddress,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes
    }

    try {
      await createOrder.mutateAsync(orderData)
      router.push('/orders')
    } catch (error) {
      console.error('Error creating order:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" />
                  Create New Order
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Add products and customer details to create an order
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={createOrder.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {createOrder.isPending ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Customer *
                  </label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose a customer...</option>
                    {customersData?.customers?.map(customer => (
                      <option key={customer.customer_id} value={customer.customer_id}>
                        {customer.name || 'Unnamed'} ({customer.phone})
                      </option>
                    ))}
                  </select>
                  {loadingCustomers && (
                    <p className="text-sm text-gray-500 mt-1">Loading customers...</p>
                  )}
                </div>

                {selectedCustomer && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <span className="ml-2 font-medium">{selectedCustomer.phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2 font-medium">{selectedCustomer.email || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Orders:</span>
                        <span className="ml-2 font-medium">{selectedCustomer.total_orders}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Spent:</span>
                        <span className="ml-2 font-medium">₹{selectedCustomer.total_spent?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Address *
                  </label>
                  <textarea
                    value={formData.shippingAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, shippingAddress: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter shipping address..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Products Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </h2>

              {/* Product Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setShowProductSearch(e.target.value.length > 0)
                    }}
                    onFocus={() => searchTerm && setShowProductSearch(true)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search products by name or SKU..."
                  />

                  {showProductSearch && filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.map(product => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addProduct(product)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                              <p className="text-sm text-gray-600">Stock: {product.stockQuantity} {product.unit}</p>
                            </div>
                            <p className="font-semibold text-gray-900">₹{product.price.toLocaleString()}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {loadingProducts && (
                  <p className="text-sm text-gray-500 mt-1">Loading products...</p>
                )}
              </div>

              {/* Order Items Table */}
              {formData.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Product</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Unit Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Discount</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Total</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {formData.items.map((item) => (
                        <tr key={item.productId}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{item.productName}</p>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900">
                            ₹{item.unitPrice.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              value={item.discount}
                              onChange={(e) => updateItemDiscount(item.productId, parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 text-right border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            ₹{item.total.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No products added yet</p>
                  <p className="text-sm mt-1">Search and add products to get started</p>
                </div>
              )}
            </div>

            {/* Payment & Shipping */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment & Delivery
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cod">Cash on Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.shippingCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, shippingCost: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any special instructions or notes..."
                />
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                </div>

                <div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-600">Tax (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.tax}
                      onChange={(e) => setFormData(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                      className="w-20 px-2 py-1 text-right border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 ml-4">Tax Amount</span>
                    <span className="font-medium">₹{taxAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">₹{formData.shippingCost.toLocaleString()}</span>
                </div>

                <div>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-gray-600">Discount (₹)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discount}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      className="w-24 px-2 py-1 text-right border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-blue-600">₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Items in cart:</span>
                  <span className="font-medium">{formData.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total quantity:</span>
                  <span className="font-medium">
                    {formData.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={createOrder.isPending || formData.items.length === 0}
                className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {createOrder.isPending ? 'Creating Order...' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
