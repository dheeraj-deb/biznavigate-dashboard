'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Search, Filter, Mail, Phone, Building2, Edit, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useCustomers } from '@/hooks/use-customers'

const mockContacts = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@acme.com',
    phone: '+1 (555) 123-4567',
    company: 'Acme Corporation',
    position: 'CEO',
    tags: ['VIP', 'Enterprise'],
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@techsolutions.com',
    phone: '+1 (555) 234-5678',
    company: 'Tech Solutions Inc.',
    position: 'CTO',
    tags: ['Tech', 'Decision Maker'],
    createdAt: '2024-02-20',
  },
  {
    id: '3',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.j@startupx.io',
    phone: '+1 (555) 345-6789',
    company: 'StartupX',
    position: 'Founder',
    tags: ['Startup', 'Hot Lead'],
    createdAt: '2024-03-10',
  },
  {
    id: '4',
    firstName: 'Alice',
    lastName: 'Brown',
    email: 'alice.brown@datacorp.com',
    phone: '+1 (555) 456-7890',
    company: 'DataCorp',
    position: 'VP of Sales',
    tags: ['Enterprise', 'Analytics'],
    createdAt: '2024-03-05',
  },
]

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch customers from API
  const { data: customersResponse, isLoading, error } = useCustomers({ search: searchQuery })

  // Fallback to mock data if API fails
  const customersData = error ? mockContacts : (customersResponse?.data || mockContacts)

  const filteredContacts = customersData.filter(
    (contact: any) =>
      contact.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[600px] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 text-muted-foreground">Loading contacts...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground">Manage your customer and prospect contacts</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to connect to backend API. Showing sample data for demo purposes.
              Please ensure backend is running on port 3006.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search contacts by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredContacts.map((contact: any) => {
                const firstName = contact.firstName || contact.first_name || ''
                const lastName = contact.lastName || contact.last_name || ''
                const fullName = `${firstName} ${lastName}`.trim() || 'N/A'
                const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()

                return (
                  <Card key={contact.id || contact.customer_id} className="hover:shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground">
                            {initials || 'NA'}
                          </div>
                          <div>
                            <h3 className="font-semibold">{fullName}</h3>
                            <p className="text-sm text-muted-foreground">{contact.position || 'Customer'}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {contact.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={`mailto:${contact.email}`}
                              className="hover:underline truncate"
                            >
                              {contact.email}
                            </a>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${contact.phone}`} className="hover:underline">
                              {contact.phone}
                            </a>
                          </div>
                        )}
                        {contact.company && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{contact.company}</span>
                          </div>
                        )}
                      </div>

                      {contact.tags && contact.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {contact.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 text-xs text-muted-foreground">
                        Added {formatDate(contact.createdAt || contact.created_at)}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {filteredContacts.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No contacts found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
