'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Eye,
  Lock,
  Users,
  CheckCircle2,
} from 'lucide-react'
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  getRoleBadgeColor,
  getRoleTypeLabel,
  getPermissionLabel,
  getPermissionDescription,
  getPermissionIcon,
  getPermissionsSummary,
  validateRoleName,
  getSuggestedRoles,
  getDefaultPermissions,
  countEnabledPermissions,
  type Role,
  type RolePermissions,
  type CreateRoleDto,
} from '@/hooks/use-roles'

export default function RolesPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Form state
  const [roleName, setRoleName] = useState('')
  const [permissions, setPermissions] = useState<RolePermissions>(getDefaultPermissions())
  const [nameError, setNameError] = useState('')

  // Fetch data
  const { data: roles = [], isLoading, error, refetch } = useRoles()

  // Mutations
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()

  // Handle create role
  const handleCreate = () => {
    // Validate
    const validation = validateRoleName(roleName)
    if (!validation.valid) {
      setNameError(validation.error || '')
      return
    }

    // Check duplicate
    if (roles.some((r) => r.role_name.toLowerCase() === roleName.toLowerCase())) {
      setNameError('A role with this name already exists')
      return
    }

    const data: CreateRoleDto = {
      role_name: roleName,
      permissions,
    }

    createRole.mutate(data, {
      onSuccess: () => {
        setCreateDialogOpen(false)
        resetForm()
      },
    })
  }

  // Handle edit role
  const handleEdit = (role: Role) => {
    setSelectedRole(role)
    setRoleName(role.role_name)
    setPermissions(role.permissions)
    setEditDialogOpen(true)
  }

  // Handle update role
  const handleUpdate = () => {
    if (!selectedRole) return

    // Validate
    const validation = validateRoleName(roleName)
    if (!validation.valid) {
      setNameError(validation.error || '')
      return
    }

    updateRole.mutate(
      {
        roleId: selectedRole.role_id,
        data: {
          role_name: roleName !== selectedRole.role_name ? roleName : undefined,
          permissions,
        },
      },
      {
        onSuccess: () => {
          setEditDialogOpen(false)
          resetForm()
        },
      }
    )
  }

  // Handle apply template
  const handleApplyTemplate = (template: { name: string; permissions: RolePermissions }) => {
    setRoleName(template.name)
    setPermissions(template.permissions)
  }

  // Reset form
  const resetForm = () => {
    setRoleName('')
    setPermissions(getDefaultPermissions())
    setNameError('')
    setSelectedRole(null)
  }

  // Toggle permission
  const togglePermission = (key: keyof RolePermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // Filter roles
  const filteredRoles = roles.filter((role) =>
    role.role_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[600px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading roles...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const permissionKeys: Array<keyof RolePermissions> = ['view', 'create', 'edit', 'delete']

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
            <p className="text-muted-foreground">Manage user roles and access control</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load roles. Please ensure the backend is running on port 3006.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roles.length}</div>
              <p className="text-xs text-muted-foreground">Active roles in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Full Access Roles</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {roles.filter((r) => r.permissions && countEnabledPermissions(r.permissions) === 4).length}
              </div>
              <p className="text-xs text-muted-foreground">Admin-level roles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Read-Only Roles</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  roles.filter(
                    (r) => r.permissions && r.permissions.view && !r.permissions.create && !r.permissions.edit && !r.permissions.delete
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">View-only access</p>
            </CardContent>
          </Card>
        </div>

        {/* Roles List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Roles</CardTitle>
                <CardDescription>Manage roles and their permissions</CardDescription>
              </div>
              <div className="w-64">
                <Input
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredRoles.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {searchTerm ? 'No roles found matching your search' : 'No roles created yet'}
                </div>
              ) : (
                filteredRoles.map((role) => (
                  <div
                    key={role.role_id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{role.role_name}</h3>
                        <Badge variant="outline" className={getRoleBadgeColor(role)}>
                          {getRoleTypeLabel(role)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {getPermissionsSummary(role.permissions)}
                      </p>
                      <div className="mt-2 flex gap-2">
                        {permissionKeys.map((key) => (
                          <div
                            key={key}
                            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
                              role.permissions?.[key]
                                ? 'bg-green-50 text-green-700'
                                : 'bg-gray-50 text-gray-400'
                            }`}
                          >
                            {role.permissions?.[key] ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <div className="h-3 w-3 rounded-full border border-current" />
                            )}
                            {getPermissionLabel(key)}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(role)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create Role Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Define a new role with specific permissions for your team members.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Role Name */}
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  placeholder="e.g., Sales Manager"
                  value={roleName}
                  onChange={(e) => {
                    setRoleName(e.target.value)
                    setNameError('')
                  }}
                />
                {nameError && <p className="text-sm text-red-600">{nameError}</p>}
              </div>

              {/* Templates */}
              <div className="space-y-2">
                <Label>Quick Templates</Label>
                <div className="grid grid-cols-2 gap-2">
                  {getSuggestedRoles().map((template) => (
                    <Button
                      key={template.name}
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyTemplate(template)}
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <Label>Permissions</Label>
                {permissionKeys.map((key) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex-1">
                      <div className="font-medium">{getPermissionLabel(key)}</div>
                      <div className="text-sm text-muted-foreground">
                        {getPermissionDescription(key)}
                      </div>
                    </div>
                    <Switch
                      checked={permissions[key] || false}
                      onCheckedChange={() => togglePermission(key)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createRole.isPending}>
                {createRole.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Role'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>Update role name and permissions.</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Role Name */}
              <div className="space-y-2">
                <Label htmlFor="editRoleName">Role Name</Label>
                <Input
                  id="editRoleName"
                  placeholder="e.g., Sales Manager"
                  value={roleName}
                  onChange={(e) => {
                    setRoleName(e.target.value)
                    setNameError('')
                  }}
                />
                {nameError && <p className="text-sm text-red-600">{nameError}</p>}
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <Label>Permissions</Label>
                {permissionKeys.map((key) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex-1">
                      <div className="font-medium">{getPermissionLabel(key)}</div>
                      <div className="text-sm text-muted-foreground">
                        {getPermissionDescription(key)}
                      </div>
                    </div>
                    <Switch
                      checked={permissions[key] || false}
                      onCheckedChange={() => togglePermission(key)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateRole.isPending}>
                {updateRole.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Role'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
