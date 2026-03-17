'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'
import {
  Plus, Pencil, Trash2, Hotel, Star, Users, IndianRupee,
  Loader2, ChevronDown, ChevronUp, Clock, MapPin, ShieldCheck,
  BedDouble, Wifi, Car, Utensils, Waves, Dumbbell, Wind, Coffee,
} from 'lucide-react'
import { Service } from '../services/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

const AMENITY_ICONS: Record<string, React.ElementType> = {
  wifi: Wifi, parking: Car, restaurant: Utensils, pool: Waves,
  gym: Dumbbell, ac: Wind, breakfast: Coffee,
}

const AMENITY_LABELS: Record<string, string> = {
  wifi: 'Wi-Fi', parking: 'Parking', restaurant: 'Restaurant', pool: 'Pool',
  gym: 'Gym', ac: 'AC', breakfast: 'Breakfast', spa: 'Spa',
  rooftop: 'Rooftop', campfire: 'Campfire', trekking: 'Trekking',
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className="h-3.5 w-3.5"
          fill={value >= s ? '#F59E0B' : 'none'}
          stroke={value >= s ? '#F59E0B' : '#D1D5DB'}
        />
      ))}
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
      <div className="h-44 bg-slate-200" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-3 w-48 rounded bg-slate-100" />
        <div className="flex gap-3 pt-1">
          <div className="h-6 w-20 rounded-full bg-slate-200" />
          <div className="h-6 w-20 rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  )
}

// ── Room Card ─────────────────────────────────────────────────────────────────

function RoomCard({
  room,
  onEdit,
  onDeactivate,
}: {
  room: Service
  onEdit: (r: Service) => void
  onDeactivate: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  const attrs = room.attributes ?? {}
  const starRating = Number(attrs.star_rating) || 0
  const checkIn = attrs.check_in as string | undefined
  const checkOut = attrs.check_out as string | undefined
  const location = attrs.location as string | undefined
  const cancellation = attrs.cancellation_policy as string | undefined
  const amenities = (attrs.amenities as string[]) ?? []
  const rooms = attrs.rooms as Array<{ type: string; capacity: string; price: string; qty: string }> | undefined

  const handleDeactivate = async () => {
    if (!confirm(`Deactivate "${room.name}"?`)) return
    setDeactivating(true)
    try { await onDeactivate(room.id) } finally { setDeactivating(false) }
  }

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">

      {/* Cover image */}
      <div className="relative h-44 bg-slate-100 overflow-hidden">
        {room.image_urls?.[0] ? (
          <img
            src={room.image_urls[0]}
            alt={room.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
            <BedDouble className="h-12 w-12 text-slate-300" />
          </div>
        )}
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm ${
            room.is_active
              ? 'bg-green-500/90 text-white'
              : 'bg-slate-700/80 text-white'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${room.is_active ? 'bg-white' : 'bg-slate-400'}`} />
            {room.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        {/* Price badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-0.5 rounded-full bg-white/95 backdrop-blur-sm px-3 py-1 text-[13px] font-bold text-[#4B4B4B] shadow-sm">
            <IndianRupee className="h-3.5 w-3.5 text-[#0066FF]" />
            {fmt(room.base_price).replace('₹', '')}
            <span className="text-[10px] font-normal text-[#6E6E6E] ml-0.5">/night</span>
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-5 space-y-3">

        {/* Name + star rating */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-[15px] text-[#4B4B4B] leading-snug">{room.name}</h3>
            {starRating > 0 && <StarRating value={starRating} />}
          </div>
          {room.description && (
            <p className="text-[12px] text-[#6E6E6E] mt-0.5 line-clamp-1">{room.description}</p>
          )}
        </div>

        {/* Key stats row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px]">
          <span className="flex items-center gap-1 text-[#4B4B4B] font-semibold">
            <Users className="h-3.5 w-3.5 text-[#0066FF]" />
            {room.capacity} guests
          </span>
          {checkIn && (
            <span className="flex items-center gap-1 text-[#6E6E6E]">
              <Clock className="h-3.5 w-3.5" />
              In: {checkIn}
            </span>
          )}
          {checkOut && (
            <span className="flex items-center gap-1 text-[#6E6E6E]">
              <Clock className="h-3.5 w-3.5" />
              Out: {checkOut}
            </span>
          )}
          {location && (
            <span className="flex items-center gap-1 text-[#6E6E6E] truncate max-w-[120px]">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              {location}
            </span>
          )}
        </div>

        {/* Amenities pills */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {amenities.slice(0, 5).map(a => {
              const Icon = AMENITY_ICONS[a]
              return (
                <span key={a} className="inline-flex items-center gap-1 rounded-full border border-[#E5E5E5] bg-slate-50 px-2 py-0.5 text-[11px] text-[#6E6E6E] font-medium">
                  {Icon && <Icon className="h-3 w-3" />}
                  {AMENITY_LABELS[a] ?? a}
                </span>
              )
            })}
            {amenities.length > 5 && (
              <span className="rounded-full border border-[#E5E5E5] bg-slate-50 px-2 py-0.5 text-[11px] text-[#6E6E6E] font-medium">
                +{amenities.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Cancellation policy */}
        {cancellation && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#6E6E6E] bg-slate-50 rounded-lg px-3 py-2">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
            {cancellation}
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onEdit(room)}
            className="flex items-center gap-1.5 rounded-full border border-[#E5E5E5] px-3 py-1.5 text-[12px] font-bold text-[#4B4B4B] hover:border-[#0066FF] hover:text-[#0066FF] transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={handleDeactivate}
            disabled={deactivating}
            className="flex items-center gap-1.5 rounded-full border border-[#E5E5E5] px-3 py-1.5 text-[12px] font-bold text-[#4B4B4B] hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            {deactivating
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Trash2 className="h-3.5 w-3.5" />
            }
            Deactivate
          </button>

          {/* Expand room types */}
          {rooms && rooms.length > 0 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="ml-auto flex items-center gap-1 text-[12px] font-semibold text-[#0066FF] hover:text-blue-700 transition-colors"
            >
              {expanded
                ? <><ChevronUp className="h-3.5 w-3.5" /> Hide Rooms</>
                : <><ChevronDown className="h-3.5 w-3.5" /> {rooms.length} Room{rooms.length !== 1 ? 's' : ''}</>
              }
            </button>
          )}
        </div>

        {/* Expandable room types table */}
        {expanded && rooms && rooms.length > 0 && (
          <div className="mt-1 rounded-xl border border-[#E5E5E5] overflow-hidden">
            <div className="bg-[#F9F9F9] px-4 py-2 text-[11px] font-bold text-[#6E6E6E] grid grid-cols-4 gap-2">
              <span>Type</span>
              <span className="text-center">Guests</span>
              <span className="text-center">Price/Night</span>
              <span className="text-center">Available</span>
            </div>
            {rooms.map((r, i) => (
              <div key={i} className="border-t border-[#E5E5E5] px-4 py-2.5 text-[12px] grid grid-cols-4 gap-2 items-center">
                <span className="font-semibold text-[#4B4B4B]">{r.type}</span>
                <span className="text-center text-[#6E6E6E]">{r.capacity}</span>
                <span className="text-center font-bold text-[#4B4B4B]">{r.price ? fmt(Number(r.price)) : '—'}</span>
                <span className="text-center text-[#6E6E6E]">{r.qty}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const ACCENT = '#0066FF'

export default function RoomsPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const loadRooms = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/api/v1/inventory/services', { params: { type: 'hospitality' } })
      // Handle both: { data: [...] } wrapper and raw array
      const body = res.data as unknown
      const list: Service[] = Array.isArray(body)
        ? body
        : Array.isArray((body as { data?: unknown }).data)
        ? (body as { data: Service[] }).data
        : []
      setRooms(list)
    } catch {
      toast.error('Failed to load rooms')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRooms() }, [loadRooms])

  const handleDeactivate = async (id: string) => {
    await apiClient.delete(`/api/v1/inventory/services/${id}`)
    setRooms(p => p.filter(r => r.id !== id))
    toast.success('Room deactivated')
  }

  const handleEdit = (room: Service) => {
    // Navigate to add page with pre-filled data (or open edit modal if needed)
    router.push(`/inventory/services`)
  }

  const filtered = filter === 'all' ? rooms : rooms.filter(r => filter === 'active' ? r.is_active : !r.is_active)
  const activeCount = rooms.filter(r => r.is_active).length
  const inactiveCount = rooms.length - activeCount

  return (
    <DashboardLayout>
      {/* Background texture */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.012)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none opacity-70" />

      <div className="relative max-w-5xl mx-auto pb-12 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                style={{ background: `${ACCENT}15`, color: ACCENT }}
              >
                <Hotel className="h-3 w-3" />
                Hospitality
              </span>
            </div>
            <h1 className="text-[26px] font-bold tracking-tight text-[#4B4B4B]">Rooms & Villas</h1>
            <p className="text-[13px] text-[#6E6E6E] mt-0.5">
              All your room listings — {activeCount} active{inactiveCount > 0 ? `, ${inactiveCount} inactive` : ''}
            </p>
          </div>

          <button
            onClick={() => router.push('/inventory/add')}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`,
              boxShadow: `0 6px 20px ${ACCENT}40`,
            }}
          >
            <Plus className="h-4 w-4" />
            Add Room
          </button>
        </div>

        {/* ── Stats strip ── */}
        {!loading && rooms.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Listings', value: rooms.length, color: '#0066FF' },
              { label: 'Active', value: activeCount, color: '#16A34A' },
              { label: 'Inactive', value: inactiveCount, color: '#6E6E6E' },
            ].map(stat => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-xl px-5 py-4 shadow-sm"
              >
                <p className="text-[12px] text-[#6E6E6E] font-medium">{stat.label}</p>
                <p className="text-[24px] font-bold mt-0.5" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Filter tabs ── */}
        {!loading && rooms.length > 0 && (
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-2 text-[13px] font-bold transition-all duration-200 capitalize ${
                  filter === f
                    ? 'text-white shadow-sm'
                    : 'border border-[#E5E5E5] text-[#6E6E6E] bg-white hover:border-[#0066FF] hover:text-[#0066FF]'
                }`}
                style={filter === f ? { background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)` } : {}}
              >
                {f === 'all' ? `All (${rooms.length})` : f === 'active' ? `Active (${activeCount})` : `Inactive (${inactiveCount})`}
              </button>
            ))}
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 && rooms.length === 0 ? (
          // Empty state
          <div className="rounded-2xl border-2 border-dashed border-[#E5E5E5] p-16 text-center space-y-4">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: `${ACCENT}10` }}
            >
              <BedDouble className="h-8 w-8" style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="font-bold text-[16px] text-[#4B4B4B]">No rooms added yet</p>
              <p className="text-[13px] text-[#6E6E6E] mt-1">
                Add your first room, villa, or accommodation type to get started.
              </p>
            </div>
            <button
              onClick={() => router.push('/inventory/add')}
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-bold text-white transition-all hover:scale-[1.02]"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)` }}
            >
              <Plus className="h-4 w-4" />
              Add Your First Room
            </button>
          </div>
        ) : filtered.length === 0 ? (
          // No results for this filter
          <div className="rounded-2xl border border-[#E5E5E5] bg-white p-10 text-center">
            <p className="text-[14px] text-[#6E6E6E]">No {filter} rooms found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                onEdit={handleEdit}
                onDeactivate={handleDeactivate}
              />
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
