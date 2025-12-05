'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Tag,
  User,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { useLead, useLeadTimeline, useDeleteLead, useConvertLead } from '@/hooks/use-leads'
import { formatCurrency, formatDate } from '@/lib/utils'

interface LeadDetailDialogProps {
  leadId: string
  isOpen: boolean
  onClose: () => void
}

export function LeadDetailDialog({ leadId, isOpen, onClose }: LeadDetailDialogProps) {
  const { data: lead, isLoading: isLoadingLead } = useLead(leadId)
  const { data: timeline, isLoading: isLoadingTimeline } = useLeadTimeline(leadId)
  const deleteLead = useDeleteLead()
  const convertLead = useConvertLead()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showConvertDialog, setShowConvertDialog] = useState(false)

  const handleDelete = async () => {
    await deleteLead.mutateAsync(leadId)
    setShowDeleteDialog(false)
    onClose()
  }

  const handleConvert = async () => {
    await convertLead.mutateAsync({
      id: leadId,
      conversion_value: lead?.estimated_value,
      notes: 'Lead converted to customer',
    })
    setShowConvertDialog(false)
    onClose()
  }

  if (isLoadingLead) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
              <p className="mt-4 text-muted-foreground">Loading lead details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!lead) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <p className="mt-4 text-muted-foreground">Lead not found</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-gray-100 text-gray-700'
      case 'contacted':
        return 'bg-blue-100 text-blue-700'
      case 'qualified':
        return 'bg-purple-100 text-purple-700'
      case 'proposal':
        return 'bg-yellow-100 text-yellow-700'
      case 'negotiation':
        return 'bg-blue-100 text-blue-700'
      case 'won':
        return 'bg-green-100 text-green-700'
      case 'lost':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'hot':
        return 'bg-red-100 text-red-700'
      case 'warm':
        return 'bg-blue-100 text-blue-700'
      case 'cold':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>
                  {lead.first_name} {lead.last_name}
                </span>
                <Badge className={getStatusColor(lead.status)}>
                  {lead.status}
                </Badge>
                {lead.lead_quality && (
                  <Badge className={getQualityColor(lead.lead_quality)}>
                    {lead.lead_quality}
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Lead Information - 2 columns */}
            <div className="md:col-span-2 space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lead.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${lead.email}`} className="text-sm hover:underline">
                        {lead.email}
                      </a>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${lead.phone}`} className="text-sm hover:underline">
                        {lead.phone}
                      </a>
                    </div>
                  )}
                  {(lead.city || lead.state || lead.country) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {[lead.city, lead.state, lead.country].filter(Boolean).join(', ')}
                        {lead.pincode && ` - ${lead.pincode}`}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lead Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lead Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Source</p>
                      <p className="text-sm font-medium capitalize">
                        {lead.source?.replace('_', ' ')}
                      </p>
                    </div>
                    {lead.estimated_value && (
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Value</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          {formatCurrency(lead.estimated_value)}
                        </p>
                      </div>
                    )}
                    {lead.lead_score && (
                      <div>
                        <p className="text-sm text-muted-foreground">Lead Score</p>
                        <p className="text-sm font-medium">{lead.lead_score}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Created Date</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(lead.created_at)}
                      </p>
                    </div>
                  </div>

                  {lead.tags && lead.tags.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {lead.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {lead.assigned_to && (
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned To</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {lead.assigned_to}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingTimeline ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : timeline && timeline.length > 0 ? (
                    <div className="space-y-4">
                      {timeline.map((activity: any, index: number) => (
                        <div key={activity.activity_id || index} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="h-2 w-2 rounded-full bg-blue-600" />
                            {index !== timeline.length - 1 && (
                              <div className="h-full w-px bg-gray-200" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm font-medium">{activity.activity_type}</p>
                            {activity.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {activity.notes}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(activity.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No activities yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Actions Sidebar - 1 column */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {lead.status !== 'won' && (
                    <Button
                      className="w-full"
                      variant="default"
                      onClick={() => setShowConvertDialog(true)}
                      disabled={convertLead.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Convert to Customer
                    </Button>
                  )}

                  <Button className="w-full" variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Lead
                  </Button>

                  <Separator className="my-2" />

                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={deleteLead.isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Lead
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              {lead.last_contacted_at && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Last Contact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(lead.last_contacted_at)}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLead.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert Confirmation Dialog */}
      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert Lead to Customer</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the lead as won and create a customer record. The lead
              status will be updated to "won".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvert}
              className="bg-green-600 hover:bg-green-700"
            >
              {convertLead.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                'Convert'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
