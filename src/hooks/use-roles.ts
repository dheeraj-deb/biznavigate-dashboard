import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

// ============================================
// TYPES & INTERFACES
// ============================================

export interface RolePermissions {
  [key: string]: boolean | undefined
  view?: boolean
  edit?: boolean
  create?: boolean
  delete?: boolean
}

export interface Role {
  role_id: string
  role_name: string
  permissions: RolePermissions
  created_at?: string
  updated_at?: string
}

export interface CreateRoleDto {
  role_name: string
  permissions?: RolePermissions
}

export interface UpdateRoleDto {
  role_name?: string
  permissions?: RolePermissions
}

export interface AssignIntentDto {
  role: string
  intent_id: string
}

export interface NotifyUsersDto {
  intent_name: string
  business_id: string
  message: string
}

// ============================================
// QUERY HOOKS - Data Fetching
// ============================================

/**
 * Get all roles
 */
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await apiClient.get('/roles')
      return response.data as Role[]
    },
    retry: 1,
    retryDelay: 1000,
    staleTime: 60000, // Consider data stale after 1 minute
  })
}

/**
 * Get role by name
 */
export function useRole(roleName: string) {
  return useQuery({
    queryKey: ['roles', roleName],
    queryFn: async () => {
      const response = await apiClient.get(`/roles/${roleName}`)
      return response.data as Role
    },
    enabled: !!roleName,
    retry: 1,
    retryDelay: 1000,
  })
}

// ============================================
// MUTATION HOOKS - Role Operations
// ============================================

/**
 * Create a new role
 */
export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateRoleDto) => {
      const response = await apiClient.post('/roles/create', data)
      return response.data as Role
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success(`Role "${data.role_name}" created successfully`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create role'
      toast.error(message)
    },
  })
}

/**
 * Update an existing role
 */
export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ roleId, data }: { roleId: string; data: UpdateRoleDto }) => {
      const response = await apiClient.put(`/roles/update/${roleId}`, data)
      return response.data as Role
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success(`Role "${data.role_name}" updated successfully`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update role'
      toast.error(message)
    },
  })
}

/**
 * Assign intent to role
 */
export function useAssignIntent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AssignIntentDto) => {
      const response = await apiClient.post('/roles/assign-intent', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Intent assigned to role successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to assign intent'
      toast.error(message)
    },
  })
}

/**
 * Notify users when chat fails
 */
export function useNotifyUsers() {
  return useMutation({
    mutationFn: async (data: NotifyUsersDto) => {
      const response = await apiClient.post('/roles/notify', data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Users notified successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to notify users'
      toast.error(message)
    },
  })
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get default permissions for new role
 */
export function getDefaultPermissions(): RolePermissions {
  return {
    view: true,
    create: true,
    edit: true,
    delete: false,
  }
}

/**
 * Check if role has specific permission
 */
export function hasPermission(role: Role | undefined, permission: keyof RolePermissions): boolean {
  if (!role || !role.permissions) return false
  return role.permissions[permission] === true
}

/**
 * Get permission label
 */
export function getPermissionLabel(permission: string): string {
  const labels: Record<string, string> = {
    view: 'View',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
  }
  return labels[permission] || permission
}

/**
 * Get permission description
 */
export function getPermissionDescription(permission: string): string {
  const descriptions: Record<string, string> = {
    view: 'View and read access to resources',
    create: 'Create new resources',
    edit: 'Edit and update existing resources',
    delete: 'Delete resources permanently',
  }
  return descriptions[permission] || ''
}

/**
 * Get permission icon
 */
export function getPermissionIcon(permission: string): string {
  const icons: Record<string, string> = {
    view: 'Eye',
    create: 'Plus',
    edit: 'Edit',
    delete: 'Trash2',
  }
  return icons[permission] || 'Circle'
}

/**
 * Get permission color
 */
export function getPermissionColor(enabled: boolean): string {
  return enabled
    ? 'text-green-600 bg-green-50 border-green-200'
    : 'text-gray-400 bg-gray-50 border-gray-200'
}

/**
 * Count enabled permissions
 */
export function countEnabledPermissions(permissions: RolePermissions | undefined): number {
  if (!permissions) return 0
  return Object.values(permissions).filter((value) => value === true).length
}

/**
 * Get role badge color based on permissions
 */
export function getRoleBadgeColor(role: Role | undefined): string {
  if (!role || !role.permissions) return 'bg-gray-100 text-gray-800 border-gray-200'
  const enabledCount = countEnabledPermissions(role.permissions)

  if (enabledCount === 4) {
    return 'bg-red-100 text-red-800 border-red-200' // All permissions (admin-like)
  }
  if (enabledCount === 3) {
    return 'bg-blue-100 text-blue-800 border-blue-200' // Most permissions
  }
  if (enabledCount === 2) {
    return 'bg-blue-100 text-blue-800 border-blue-200' // Moderate permissions
  }
  return 'bg-gray-100 text-gray-800 border-gray-200' // Limited permissions
}

/**
 * Check if role is admin-like (all permissions)
 */
export function isAdminRole(role: Role | undefined): boolean {
  if (!role || !role.permissions) return false
  const { view, create, edit, delete: del } = role.permissions
  return view === true && create === true && edit === true && del === true
}

/**
 * Check if role is read-only
 */
export function isReadOnlyRole(role: Role | undefined): boolean {
  if (!role || !role.permissions) return false
  const { view, create, edit, delete: del } = role.permissions
  return view === true && !create && !edit && !del
}

/**
 * Get role type label
 */
export function getRoleTypeLabel(role: Role | undefined): string {
  if (!role) return 'Unknown'
  if (isAdminRole(role)) return 'Full Access'
  if (isReadOnlyRole(role)) return 'Read Only'

  const enabledCount = countEnabledPermissions(role.permissions)
  if (enabledCount === 3) return 'Editor'
  if (enabledCount === 2) return 'Contributor'
  return 'Limited Access'
}

/**
 * Validate role name
 */
export function validateRoleName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Role name is required' }
  }

  if (name.length < 3) {
    return { valid: false, error: 'Role name must be at least 3 characters' }
  }

  if (name.length > 50) {
    return { valid: false, error: 'Role name must be less than 50 characters' }
  }

  if (!/^[a-zA-Z0-9\s_-]+$/.test(name)) {
    return { valid: false, error: 'Role name can only contain letters, numbers, spaces, hyphens, and underscores' }
  }

  return { valid: true }
}

/**
 * Format role name for display
 */
export function formatRoleName(name: string): string {
  return name
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Get permissions summary text
 */
export function getPermissionsSummary(permissions: RolePermissions | undefined): string {
  if (!permissions) return 'No permissions'

  const enabled: string[] = []

  if (permissions.view) enabled.push('View')
  if (permissions.create) enabled.push('Create')
  if (permissions.edit) enabled.push('Edit')
  if (permissions.delete) enabled.push('Delete')

  if (enabled.length === 0) return 'No permissions'
  if (enabled.length === 4) return 'Full access'

  return enabled.join(', ')
}

/**
 * Compare two roles' permissions
 */
export function comparePermissions(roleA: Role | undefined, roleB: Role | undefined): number {
  const countA = countEnabledPermissions(roleA?.permissions)
  const countB = countEnabledPermissions(roleB?.permissions)
  return countB - countA // Descending order (most permissions first)
}

/**
 * Clone role permissions
 */
export function clonePermissions(permissions: RolePermissions): RolePermissions {
  return { ...permissions }
}

/**
 * Merge permissions (combine two permission sets)
 */
export function mergePermissions(
  base: RolePermissions,
  override: RolePermissions
): RolePermissions {
  return { ...base, ...override }
}

/**
 * Get suggested roles (common role templates)
 */
export function getSuggestedRoles(): Array<{ name: string; permissions: RolePermissions }> {
  return [
    {
      name: 'Administrator',
      permissions: { view: true, create: true, edit: true, delete: true },
    },
    {
      name: 'Editor',
      permissions: { view: true, create: true, edit: true, delete: false },
    },
    {
      name: 'Contributor',
      permissions: { view: true, create: true, edit: false, delete: false },
    },
    {
      name: 'Viewer',
      permissions: { view: true, create: false, edit: false, delete: false },
    },
  ]
}
