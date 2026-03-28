'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Switch } from '@/components/ui/switch'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'
import { useBusinessType } from '@/hooks/use-business-type'
import toast from 'react-hot-toast'
import Image from 'next/image'
import {
  ArrowLeft,
  Hotel,
  Calendar,
  Package,
  GraduationCap,
  Upload,
  X,
  Plus,
  Trash2,
  Star,
  Loader2,
  CheckCircle2,
  Wifi,
  Car,
  Utensils,
  Waves,
  Dumbbell,
  Wind,
  Coffee,
  Tag,
  IndianRupee,
  Camera,
  Tent,
  Mountain,
  TreePine,
  Flame,
  Backpack,
  Telescope,
  Ticket,
  Music,
  Mic2,
  Monitor,
  Award,
  BookOpen,
  Info,
} from 'lucide-react'

// ─── Amenity / Feature Chips ────────────────────────────────────────────────

const RESORT_AMENITIES = [
  { id: 'wifi', label: 'Free Wi-Fi', icon: Wifi },
  { id: 'parking', label: 'Free Parking', icon: Car },
  { id: 'restaurant', label: 'Restaurant', icon: Utensils },
  { id: 'pool', label: 'Swimming Pool', icon: Waves },
  { id: 'gym', label: 'Fitness Center', icon: Dumbbell },
  { id: 'ac', label: 'Air Conditioning', icon: Wind },
  { id: 'breakfast', label: 'Breakfast Included', icon: Coffee },
  { id: 'spa', label: 'Spa & Wellness', icon: Star },
  { id: 'rooftop', label: 'Rooftop Access', icon: Mountain },
  { id: 'campfire', label: 'Campfire Area', icon: Flame },
  { id: 'trekking', label: 'Trekking Trails', icon: Backpack },
  { id: 'birdwatching', label: 'Bird Watching', icon: Telescope },
]

const CAMP_AMENITIES = [
  { id: 'tent', label: 'Tents Provided', icon: Tent },
  { id: 'campfire', label: 'Campfire', icon: Flame },
  { id: 'trekking', label: 'Trekking', icon: Backpack },
  { id: 'birdwatching', label: 'Bird Watching', icon: Telescope },
  { id: 'meals', label: 'Meals Included', icon: Utensils },
  { id: 'wifi', label: 'Wi-Fi Available', icon: Wifi },
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'forest', label: 'Forest View', icon: TreePine },
  { id: 'mountain', label: 'Mountain View', icon: Mountain },
]

const EVENT_AMENITIES = [
  { id: 'catering', label: 'Catering', icon: Utensils },
  { id: 'av', label: 'AV Equipment', icon: Monitor },
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'stage', label: 'Stage / Podium', icon: Mic2 },
  { id: 'music', label: 'Live Music', icon: Music },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'accomodation', label: 'Accommodation', icon: Hotel },
]

const ROOM_TYPES = ['Standard Room', 'Deluxe Room', 'Suite', 'Premium Suite', 'Dormitory', 'Tent', 'Cottage', 'Villa', 'Treehouse', 'Glamping Pod']
const TICKET_TYPES = ['General Admission', 'VIP', 'Early Bird', 'Group (5+)', 'Student', 'Corporate Pass']
const COURSE_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels']
const DELIVERY_MODES = ['Online (Live)', 'Online (Self-Paced)', 'Offline (In-Person)', 'Hybrid']
const PRODUCT_CONDITIONS = ['new', 'like_new', 'good', 'refurbished']
const PRODUCT_CONDITION_LABELS: Record<string, string> = {
  new: 'New', like_new: 'Like New', good: 'Good', refurbished: 'Refurbished',
}
const PRODUCT_CATEGORIES = [
  'Clothing', 'Footwear & Sneakers', 'Jewellery', 'Accessories',
  'Food & Sweets', 'Car Care', 'Beauty & Personal Care',
  'Electronics', 'Home & Living', 'Other',
]

// ─── Helpers ────────────────────────────────────────────────────────────────

const FALLBACK_BUSINESS_ID = 'dd8ae5a1-cab4-4041-849d-e108d74490d3'
const FALLBACK_TENANT_ID = '99aff970-f498-478d-939a-a9a2fb459902'

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[13px] font-bold text-[#4B4B4B]">
      {children}
      {required && <span className="ml-1 text-[#0066FF]">*</span>}
    </label>
  )
}

function FieldInput({
  id, placeholder, value, onChange, type = 'text', prefix, error, className = '', disabled = false,
}: {
  id?: string; placeholder?: string; value: string; onChange: (v: string) => void
  type?: string; prefix?: string; error?: string; className?: string; disabled?: boolean
}) {
  return (
    <div>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#6E6E6E] select-none pointer-events-none">{prefix}</span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'h-10 w-full bg-transparent text-[13px] text-[#4B4B4B] placeholder:text-[#989898] rounded-[4px] border px-3 focus:outline-none focus:ring-1 transition-colors shadow-none disabled:opacity-50',
            prefix && 'pl-7',
            error ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-[#989898] focus:ring-[#0066FF] focus:border-[#0066FF]',
            className,
          )}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}

function FieldTextarea({ id, placeholder, value, onChange, rows = 3, error }: {
  id?: string; placeholder?: string; value: string; onChange: (v: string) => void
  rows?: number; error?: string
}) {
  return (
    <div>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full bg-transparent text-[13px] text-[#4B4B4B] placeholder:text-[#989898] rounded-[4px] border px-3 py-2.5 focus:outline-none focus:ring-1 transition-colors shadow-none resize-none',
          error ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-[#989898] focus:ring-[#0066FF] focus:border-[#0066FF]',
        )}
      />
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}

function FieldSelect({ id, value, onChange, options, placeholder, error }: {
  id?: string; value: string; onChange: (v: string) => void
  options: string[]; placeholder?: string; error?: string
}) {
  return (
    <div>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
          'h-10 w-full bg-transparent text-[13px] text-[#4B4B4B] rounded-[4px] border px-3 focus:outline-none focus:ring-1 transition-colors shadow-none appearance-none bg-custom-chevron bg-[length:10px_10px] bg-no-repeat bg-[position:right_12px_center]',
          error ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-[#989898] focus:ring-[#0066FF] focus:border-[#0066FF]',
        )}
      >
        {placeholder && <option value="" disabled hidden>{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}

function SectionCard({ title, subtitle, icon: Icon, accent = '#0066FF', children }: {
  title: string; subtitle?: string; icon?: React.ElementType; accent?: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-[0_8px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-slate-100">
        {Icon && (
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: `${accent}15` }}>
            <Icon className="h-4 w-4" style={{ color: accent }} />
          </div>
        )}
        <div>
          <h3 className="text-[15px] font-bold text-[#4B4B4B]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[12px] text-[#6E6E6E]">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function AmenityChip({ label, icon: Icon, selected, onClick }: {
  label: string; icon: React.ElementType; selected: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all duration-200 select-none',
        selected
          ? 'bg-[#0066FF] border-[#0066FF] text-white shadow-[0_4px_12px_rgba(0,102,255,0.25)]'
          : 'border-[#E5E5E5] text-[#6E6E6E] hover:border-[#0066FF] hover:text-[#0066FF] bg-white',
      )}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      {label}
    </button>
  )
}

// ─── Image Upload Widget ─────────────────────────────────────────────────────

function ImageUploadGrid({
  previews, onAdd, onRemove, onSetPrimary, primaryIndex,
}: {
  previews: string[]
  onAdd: (files: File[]) => void; onRemove: (i: number) => void
  onSetPrimary: (i: number) => void; primaryIndex: number
}) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-3">
      <input
        ref={ref} type="file" accept="image/*" multiple className="hidden"
        onChange={e => onAdd(Array.from(e.target.files || []))}
      />
      <div
        onClick={() => ref.current?.click()}
        className="group relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#E5E5E5] bg-slate-50/60 py-10 cursor-pointer hover:border-[#0066FF] hover:bg-blue-50/30 transition-all duration-200"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm group-hover:shadow-[0_4px_16px_rgba(0,102,255,0.15)] transition-shadow">
          <Upload className="h-5 w-5 text-[#0066FF]" />
        </div>
        <div className="text-center">
          <p className="text-[13px] font-semibold text-[#4B4B4B]">Click to upload photos</p>
          <p className="text-[11px] text-[#989898] mt-0.5">PNG, JPG, WEBP up to 10 MB each</p>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {previews.map((src, i) => (
            <div
              key={i}
              className={cn(
                'group relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all',
                i === primaryIndex ? 'border-[#0066FF] shadow-[0_4px_12px_rgba(0,102,255,0.25)]' : 'border-transparent',
              )}
              onClick={() => onSetPrimary(i)}
            >
              <Image src={src} alt="" fill className="object-cover" />
              {i === primaryIndex && (
                <div className="absolute top-1.5 left-1.5 bg-[#0066FF] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Cover</div>
              )}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onRemove(i) }}
                className="absolute top-1.5 right-1.5 h-6 w-6 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Room / Package Row ──────────────────────────────────────────────────────

interface RoomEntry { type: string; capacity: string; price: string; qty: string }
interface TicketEntry { type: string; price: string; qty: string; description: string }

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AddInventoryPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  // Detect business type from shared hook
  const { businessType: bizType, isLoading } = useBusinessType()
  // For events clients: they could be event organizers OR camping/adventure organizers
  const [eventsSubType, setEventsSubType] = useState<'event' | 'camping'>('event')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)

  // Images
  const [_images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [primaryIndex, setPrimaryIndex] = useState(0)

  // Common fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [price, setPrice] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [amenities, setAmenities] = useState<string[]>([])

  // Hospitality
  const [accommodationType, setAccommodationType] = useState('room')
  const [maxGuests, setMaxGuests] = useState('2')

  const UNIT_ACCOM_TYPES = ['villa', 'cabin', 'glamping']
  const isUnitAccom = UNIT_ACCOM_TYPES.includes(accommodationType)

  // Capacity label/placeholder/default per accommodation type
  const ACCOM_CAPACITY: Record<string, { label: string; placeholder: string; defaultQty: string }> = {
    villa:      { label: 'Number of Villas',       placeholder: '1',  defaultQty: '1' },
    cabin:      { label: 'Number of Cabins',        placeholder: '1',  defaultQty: '1' },
    glamping:   { label: 'Number of Units',         placeholder: '1',  defaultQty: '1' },
    room:       { label: 'Number of Rooms',         placeholder: 'e.g. 10', defaultQty: '' },
    dormitory:  { label: 'Number of Beds',          placeholder: 'e.g. 20', defaultQty: '' },
    tent_site:  { label: 'Number of Tent Spots',    placeholder: 'e.g. 15', defaultQty: '' },
  }
  const accomCap = ACCOM_CAPACITY[accommodationType] ?? { label: 'Units Available', placeholder: 'Units', defaultQty: '' }
  // Reset qty default when accommodation type changes
  useEffect(() => {
    const def = ACCOM_CAPACITY[accommodationType]?.defaultQty ?? ''
    setRooms(prev => prev.map((r, i) => i === 0 ? { ...r, qty: def } : r))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accommodationType])

  const [starRating, setStarRating] = useState('3')
  const [checkInTime, setCheckInTime] = useState('14:00')
  const [checkOutTime, setCheckOutTime] = useState('11:00')
  const [rooms, setRooms] = useState<RoomEntry[]>([{ type: 'Standard Room', capacity: '2', price: '', qty: '1' }])
  const [cancellationPolicy, setCancellationPolicy] = useState('')
  const [taxPercentage, setTaxPercentage] = useState('')
  const [extraGuestCharge, setExtraGuestCharge] = useState('')
  const [maxAdults, setMaxAdults] = useState('')
  const [mealPlan, setMealPlan] = useState('room_only')
  const [smokingAllowed, setSmokingAllowed] = useState(false)
  const [petsAllowed, setPetsAllowed] = useState(false)
  const [childrenAllowed, setChildrenAllowed] = useState(true)
  const [maxChildren, setMaxChildren] = useState('')
  const [highlights, setHighlights] = useState('')

  // Events
  const [eventDate, setEventDate] = useState('')
  const [eventEndDate, setEventEndDate] = useState('')
  const [eventVenue, setEventVenue] = useState('')
  const [totalCapacity, setTotalCapacity] = useState('')
  const [tickets, setTickets] = useState<TicketEntry[]>([{ type: 'General Admission', price: '', qty: '', description: '' }])
  const [refundPolicy, setRefundPolicy] = useState('')
  const [ageRestriction, setAgeRestriction] = useState('')

  // Retail/Product
  const [sku, setSku] = useState('')
  const [stockQty, setStockQty] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('new')
  const [weight, setWeight] = useState('')
  const [dimensions, setDimensions] = useState('')
  const [trackInventory, setTrackInventory] = useState(true)

  // Education
  const [duration, setDuration] = useState('')
  const [level, setLevel] = useState('Beginner')
  const [deliveryMode, setDeliveryMode] = useState('Online (Live)')
  const [capacity, setCapacity] = useState('')
  const [prerequisites, setPrerequisites] = useState('')
  const [syllabus, setSyllabus] = useState('')
  const [instructor, setInstructor] = useState('')
  const [certificate, setCertificate] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Image handlers
  const handleAddImages = (files: File[]) => {
    setImages(p => [...p, ...files])
    files.forEach(f => {
      const r = new FileReader()
      r.onloadend = () => setPreviews(p => [...p, r.result as string])
      r.readAsDataURL(f)
    })
  }
  const handleRemoveImage = (i: number) => {
    setImages(p => p.filter((_, idx) => idx !== i))
    setPreviews(p => p.filter((_, idx) => idx !== i))
    if (primaryIndex === i) setPrimaryIndex(0)
    else if (primaryIndex > i) setPrimaryIndex(p => p - 1)
  }

  // Room handlers
  const addRoom = () => setRooms(p => [...p, { type: 'Standard Room', capacity: '2', price: '', qty: '1' }])
  const removeRoom = (i: number) => setRooms(p => p.filter((_, idx) => idx !== i))
  const updateRoom = (i: number, field: keyof RoomEntry, val: string) => {
    setRooms(p => p.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }

  // Ticket handlers
  const addTicket = () => setTickets(p => [...p, { type: 'General Admission', price: '', qty: '', description: '' }])
  const removeTicket = (i: number) => setTickets(p => p.filter((_, idx) => idx !== i))
  const updateTicket = (i: number, field: keyof TicketEntry, val: string) => {
    setTickets(p => p.map((t, idx) => idx === i ? { ...t, [field]: val } : t))
  }

  // Toggle amenity
  const toggleAmenity = (id: string) => {
    setAmenities(p => p.includes(id) ? p.filter(a => a !== id) : [...p, id])
  }

  // Validate
  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    // For hospitality, price comes from room entries; for events, from ticket entries
    if (bizType !== 'hospitality' && bizType !== 'events') {
      if (!price.trim() || isNaN(Number(price))) e.price = 'Valid price is required'
    }
    if (bizType === 'hospitality') {
      if (!location.trim()) e.location = 'Location is required'
    }
    if (bizType === 'events') {
      if (!eventDate) e.eventDate = 'Event date is required'
      if (!eventVenue.trim()) e.eventVenue = 'Venue is required'
    }
    if (bizType === 'products') {
      if (trackInventory && !stockQty.trim()) e.stockQty = 'Stock quantity is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      toast('Please fill in all required fields', {
        icon: '⚠️',
        style: { borderRadius: '12px', background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' },
      })
      return
    }

    setIsSubmitting(true)
    try {
      const businessId = user?.business_id || FALLBACK_BUSINESS_ID

      // Upload images
      let imageUrls: string[] = []
      if (previews.length > 0) {
        const token = localStorage.getItem('biznavigate_auth_token')
        if (!token) {
          toast.error('Session expired. Please log in again.')
          router.push('/auth/login')
          setIsSubmitting(false)
          return
        }
        setUploadingImages(true)
        toast.loading(`Uploading ${previews.length} image(s)…`, { id: 'img-upload' })
        try {
          const res = await apiClient.post('/s3/upload-base64-multiple', { images: previews, folder: 'inventory' })
          // S3 returns { success, data: [{ url, key }] } — apiClient unwraps one level so res = { success, data: [...] }
          const s3Items = (res.data as Array<{ url: string }>) ?? []
          imageUrls = s3Items.map(item => item.url).filter(Boolean)
          toast.success(`${imageUrls.length} image(s) uploaded`, { id: 'img-upload' })
        } catch {
          toast.error('Image upload failed', { id: 'img-upload' })
          setIsSubmitting(false)
          setUploadingImages(false)
          return
        } finally {
          setUploadingImages(false)
        }
      }

      // Build attributes (service metadata)
      const attributes: Record<string, unknown> = {}
      if (bizType === 'hospitality') {
        attributes.star_rating = starRating
        attributes.location = location
        attributes.rooms = rooms
        if (isUnitAccom) attributes.max_guests = Number(maxGuests)
        // amenities → grouped format
        const amenityList = RESORT_AMENITIES.filter(a => amenities.includes(a.id)).map(a => a.label)
        if (amenityList.length) attributes.amenities = { General: amenityList }
        // new attributes fields
        attributes.meal_plan = mealPlan
        attributes.smoking_allowed = smokingAllowed
        attributes.pets_allowed = petsAllowed
        attributes.children_allowed = childrenAllowed
        if (maxChildren) attributes.max_children = parseInt(maxChildren)
        if (highlights.trim()) attributes.highlights = highlights.split(',').map(h => h.trim()).filter(Boolean)
      } else if (bizType === 'events') {
        attributes.event_date = eventDate
        attributes.event_end_date = eventEndDate
        attributes.venue = eventVenue
        attributes.location = location
        attributes.tickets = tickets
        const campAmenityList = EVENT_AMENITIES
          .filter(a => amenities.includes(a.id)).map(a => a.label)
        if (campAmenityList.length) attributes.amenities = { General: campAmenityList }
        attributes.refund_policy = refundPolicy
        attributes.age_restriction = ageRestriction
      }

      const isServiceType = ['hospitality', 'events'].includes(bizType)
      const isHospitality = bizType === 'hospitality'

      if (isServiceType) {
        // ── Hospitality / Events → POST /inventory/services ──
        const basePrice = (bizType === 'hospitality')
          ? parseFloat(rooms[0]?.price || '0')
          : parseFloat(tickets[0]?.price || '0')

        const isRoomBased = bizType === 'hospitality'

        // capacity  → Capacity field (guests per room/unit) entered by user
        // total_units → Number of Rooms/Units field (qty) entered by user
        const serviceCapacity: number = isUnitAccom
          ? parseInt(maxGuests) || 1                         // whole-unit: max guests dropdown
          : isRoomBased
          ? parseInt(rooms[0]?.capacity) || 0               // room: Capacity field value
          : parseInt(totalCapacity) || 0                    // events: total capacity field

        const totalUnits: number = isUnitAccom
          ? 1                                               // whole-unit: always 1 unit
          : isRoomBased
          ? rooms.reduce((sum, r) => sum + (parseInt(r.qty) || 0), 0)  // room: Number of Rooms field
          : parseInt(totalCapacity) || 0                    // events: total capacity field

        const serviceType = isHospitality ? accommodationType : bizType

        await apiClient.post('/inventory/services', {
          name,
          description: description || undefined,
          type: serviceType,
          base_price: basePrice,
          capacity: serviceCapacity,
          total_units: totalUnits,
          check_in_time: checkInTime || undefined,
          check_out_time: checkOutTime || undefined,
          cancellation_policy: cancellationPolicy || undefined,
          tax_percentage: taxPercentage ? parseFloat(taxPercentage) : undefined,
          extra_guest_charge: extraGuestCharge ? parseFloat(extraGuestCharge) : undefined,
          max_adults: maxAdults ? parseInt(maxAdults) : undefined,
          image_urls: imageUrls,
          attributes,
        })
        toast.success('Service added to inventory! 🎉', {
          style: { borderRadius: '12px', background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' },
        })
        router.push('/inventory/services')
      } else {
        // ── Products → POST /products ──
        const payload: Record<string, unknown> = {
          name,
          description: description || null,
          price: parseFloat(price),
          brand: brand || null,
          category: category || null,
          track_inventory: trackInventory,
          stock_quantity: trackInventory && stockQty ? parseInt(stockQty) : 0,
          is_active: isActive,
        }
        if (imageUrls.length > 0) {
          payload.primary_image_url = imageUrls[primaryIndex]
          payload.image_urls = imageUrls
        }
        await apiClient.post('/products', payload)
        toast.success('Product added to inventory! 🎉', {
          style: { borderRadius: '12px', background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' },
        })
        router.push('/inventory/products')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Failed to add item. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Determine page meta ──────────────────────────────────────────────────

  const pageConfig = {
    hospitality: {
      title: 'Add Property Listing',
      subtitle: 'Add a new property with rooms, star rating, amenities and pricing',
      icon: Hotel,
      accent: '#0066FF',
      badge: 'Hospitality',
    },
    hotel: {
      title: 'Add Hotel Listing',
      subtitle: 'Add a new property with rooms, star rating, amenities and pricing',
      icon: Hotel,
      accent: '#0066FF',
      badge: 'Hotel',
    },
    resort: {
      title: 'Add Resort / Property',
      subtitle: 'Add a luxury property with villas, rooms, amenities and pricing',
      icon: Hotel,
      accent: '#0066FF',
      badge: 'Resort',
    },
    events: {
      title: eventsSubType === 'event' ? 'Add Event / Experience' : 'Add Camping Experience',
      subtitle: eventsSubType === 'event'
        ? 'Create an event listing with tickets, venue, and attendee details'
        : 'Add a camping or adventure package with activities and availability',
      icon: eventsSubType === 'event' ? Calendar : Tent,
      accent: eventsSubType === 'event' ? '#7C3AED' : '#EA580C',
      badge: eventsSubType === 'event' ? 'Events' : 'Camping',
    },
    camping: {
      title: 'Add Camping / Adventure Package',
      subtitle: 'Add a camp or outdoor experience with packages, activities and dates',
      icon: Tent,
      accent: '#EA580C',
      badge: 'Camping',
    },
    products: {
      title: 'Add Product',
      subtitle: 'List a new product with pricing, stock, and specifications',
      icon: Package,
      accent: '#059669',
      badge: 'Products',
    },
    education: {
      title: 'Add Course / Program',
      subtitle: 'Create a new educational offering with curriculum and scheduling',
      icon: GraduationCap,
      accent: '#D97706',
      badge: 'Education',
    },
    other: {
      title: 'Add Inventory Item',
      subtitle: 'Add a new item or service to your inventory',
      icon: Package,
      accent: '#6366F1',
      badge: 'General',
    },
    unknown: {
      title: 'Add Inventory',
      subtitle: 'Add a new item to your inventory',
      icon: Package,
      accent: '#0066FF',
      badge: 'Inventory',
    },
  }[bizType]

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-[#0066FF]/10 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#0066FF]" />
              </div>
            </div>
            <p className="text-[13px] text-[#6E6E6E] font-medium">Loading your inventory form…</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const PageIcon = pageConfig.icon

  return (
    <DashboardLayout>
      {/* Background texture */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none opacity-70" />

      <form onSubmit={handleSubmit} className="relative space-y-6 max-w-4xl mx-auto pb-12">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => router.push('/inventory/products')}
              className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E5E5] hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-[#4B4B4B]" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ background: `${pageConfig.accent}15`, color: pageConfig.accent }}
                >
                  <PageIcon className="h-3 w-3" />
                  {pageConfig.badge}
                </span>
                {/* Sub-type toggle only for Events clients */}
                {bizType === 'events' && (
                  <div className="flex items-center gap-1 rounded-full border border-[#E5E5E5] bg-white p-0.5 shadow-sm">
                    {(['event', 'camping'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setEventsSubType(t)}
                        className={cn(
                          'rounded-full px-3 py-1 text-[11px] font-bold transition-all duration-200',
                          eventsSubType === t
                            ? t === 'event' ? 'bg-[#7C3AED] text-white shadow-sm' : 'bg-[#EA580C] text-white shadow-sm'
                            : 'text-[#6E6E6E] hover:text-[#4B4B4B]',
                        )}
                      >
                        {t === 'event' ? '🎪 Event / Concert' : '🏕️ Camping / Adventure'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <h1 className="text-[26px] font-bold tracking-tight text-[#4B4B4B]">{pageConfig.title}</h1>
              <p className="text-[13px] text-[#6E6E6E] mt-0.5">{pageConfig.subtitle}</p>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-2.5 rounded-xl border border-[#E5E5E5] bg-white px-4 py-2.5 shadow-sm">
            <span className="text-[12px] font-bold text-[#4B4B4B]">Active</span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        {/* ── Photos ── */}
        <SectionCard title="Photos" subtitle="Upload high-quality photos. First image will be the cover." icon={Camera} accent={pageConfig.accent}>
          <ImageUploadGrid
            previews={previews}
            onAdd={handleAddImages} onRemove={handleRemoveImage}
            onSetPrimary={setPrimaryIndex} primaryIndex={primaryIndex}
          />
        </SectionCard>

        {/* ── Basic Info ── */}
        <SectionCard title="Basic Information" subtitle="Core details visible to your customers" icon={Info} accent={pageConfig.accent}>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <FieldLabel required>
                  {bizType === 'hospitality'
                    ? 'Property Name'
                    : bizType === 'events' ? (eventsSubType === 'camping' ? 'Camp Name' : 'Event Name')
                    : bizType === ('education' as string) ? 'Course / Program Title'
                    : 'Product Name'}
                </FieldLabel>
                <FieldInput
                  id="name" value={name} onChange={setName}
                  placeholder={
                    bizType === 'hospitality' ? 'e.g. The Grand Aravalli Resort'
                    : bizType === 'events' ? (eventsSubType === 'camping' ? 'e.g. Himalayan Base Camp Experience' : 'e.g. Sunburn Music Festival 2026')
                    : (bizType as string) === 'education' ? 'e.g. Advanced Digital Marketing Course'
                    : 'e.g. Premium Leather Wallet'
                  }
                  error={errors.name}
                />
              </div>

              {(bizType === 'hospitality' || bizType === 'events') && (
                <div className="space-y-1.5">
                  <FieldLabel required>Location</FieldLabel>
                  <FieldInput
                    id="location" value={location} onChange={setLocation}
                    placeholder={bizType === 'hospitality' ? 'e.g. Rishikesh, Uttarakhand' : 'e.g. NESCO Grounds, Mumbai'}
                    error={errors.location}
                  />
                </div>
              )}


              {(bizType as string) === 'education' && (
                <div className="space-y-1.5">
                  <FieldLabel>Instructor Name</FieldLabel>
                  <FieldInput id="instructor" value={instructor} onChange={setInstructor} placeholder="e.g. Rahul Sharma, Dr. Priya Nair" />
                </div>
              )}

              {(bizType === 'products' || (bizType as string) === 'education') && (
                <div className="space-y-1.5">
                  <FieldLabel required>Price (₹)</FieldLabel>
                  <FieldInput
                    id="price" type="number" value={price} onChange={setPrice}
                    placeholder="0.00" prefix="₹" error={errors.price}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Description</FieldLabel>
              <FieldTextarea
                id="description" value={description} onChange={setDescription} rows={4}
                placeholder={
                  bizType === 'hospitality'
                    ? 'Describe the experience — views, surroundings, what makes it special…'
                    : bizType === 'events'
                    ? 'Describe the event — lineup, highlights, what attendees can expect…'
                    : (bizType as string) === 'education'
                    ? 'Describe the course — outcomes, who it is for, and key highlights…'
                    : 'Describe the product — materials, features, and key benefits…'
                }
              />
            </div>

          </div>
        </SectionCard>


        {/* ══ HOSPITALITY SPECIFIC — Hotel & Resort ════════════════════ */}
        {bizType === 'hospitality' && (
          <>
            {/* Property Details */}
            <SectionCard
              title="Property Details"
              subtitle="Star rating, check-in/out times and total room count"
              icon={Hotel}
              accent="#0066FF"
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <FieldLabel required>Accommodation Type</FieldLabel>
                  <FieldSelect
                    value={accommodationType}
                    onChange={setAccommodationType}
                    options={['room', 'villa', 'dormitory', 'tent_site', 'cabin', 'glamping']}
                    placeholder="Select type"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <FieldLabel>Star Rating</FieldLabel>
                    <div className="flex items-center gap-1.5 h-10">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button
                          key={s} type="button" onClick={() => setStarRating(String(s))}
                          className="transition-transform hover:scale-110 active:scale-95"
                        >
                          <Star
                            className="h-7 w-7 transition-colors"
                            fill={Number(starRating) >= s ? '#F59E0B' : 'none'}
                            stroke={Number(starRating) >= s ? '#F59E0B' : '#D1D5DB'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Check-In Time</FieldLabel>
                    <FieldInput id="checkin" type="time" value={checkInTime} onChange={setCheckInTime} placeholder="" />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Check-Out Time</FieldLabel>
                    <FieldInput id="checkout" type="time" value={checkOutTime} onChange={setCheckOutTime} placeholder="" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Cancellation Policy</FieldLabel>
                  <select
                    value={cancellationPolicy}
                    onChange={e => setCancellationPolicy(e.target.value)}
                    className="h-10 w-full bg-transparent text-[13px] text-[#4B4B4B] rounded-[4px] border border-[#989898] px-3 focus:outline-none focus:ring-1 focus:ring-[#0066FF] focus:border-[#0066FF] transition-colors shadow-none appearance-none"
                  >
                    <option value="">Select policy…</option>
                    <option>Free cancellation (24 hours before)</option>
                    <option>Free cancellation (48 hours before)</option>
                    <option>Free cancellation (7 days before)</option>
                    <option>Free cancellation (14 days before)</option>
                    <option>50% refund (48 hours before)</option>
                    <option>50% refund (7 days before)</option>
                    <option>Non-refundable</option>
                    <option>No cancellation policy</option>
                  </select>
                </div>

                {/* Pricing extras */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <FieldLabel>Tax %</FieldLabel>
                    <FieldInput type="number" value={taxPercentage} onChange={setTaxPercentage} placeholder="e.g. 12.5" />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Extra Guest Charge (₹)</FieldLabel>
                    <FieldInput type="number" value={extraGuestCharge} onChange={setExtraGuestCharge} placeholder="per person/night" />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Max Adults</FieldLabel>
                    <FieldInput type="number" value={maxAdults} onChange={setMaxAdults} placeholder="e.g. 2" />
                  </div>
                </div>

                {/* Meal plan */}
                <div className="space-y-1.5">
                  <FieldLabel>Meal Plan</FieldLabel>
                  <FieldSelect value={mealPlan} onChange={setMealPlan}
                    options={['room_only', 'breakfast_included', 'all_inclusive']} />
                </div>

                {/* Guest policies */}
                <div className="space-y-2">
                  <FieldLabel>Guest Policies</FieldLabel>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { label: 'Smoking allowed', value: smokingAllowed, set: setSmokingAllowed },
                      { label: 'Pets allowed',    value: petsAllowed,    set: setPetsAllowed },
                      { label: 'Children allowed', value: childrenAllowed, set: setChildrenAllowed },
                    ].map(({ label, value, set }) => (
                      <label key={label} className="flex items-center gap-2 text-[13px] text-[#4B4B4B] cursor-pointer select-none">
                        <input type="checkbox" checked={value} onChange={e => set(e.target.checked)}
                          className="h-4 w-4 accent-[#0066FF]" />
                        {label}
                      </label>
                    ))}
                    {childrenAllowed && (
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#6E6E6E]">Max children</span>
                        <FieldInput type="number" value={maxChildren} onChange={setMaxChildren} placeholder="e.g. 2" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Highlights */}
                <div className="space-y-1.5">
                  <FieldLabel>Highlights</FieldLabel>
                  <FieldInput value={highlights} onChange={setHighlights} placeholder="Sea view, Private balcony, Jacuzzi (comma-separated)" />
                  <p className="text-[11px] text-[#989898]">Bullet points shown on the listing</p>
                </div>
              </div>
            </SectionCard>

            {/* Room Types */}
            <SectionCard
              title="Room Types & Packages"
              subtitle="Add your room categories — Standard, Deluxe, Suite, etc. — with individual pricing"
              icon={Tag}
              accent="#0066FF"
            >
              <div className="space-y-3">
                {rooms.map((room, i) => (
                  <div key={i} className="relative rounded-xl border border-[#E5E5E5] bg-slate-50/50 p-4">
                    <div className="grid gap-3 md:grid-cols-5 items-start">
                      <div className="space-y-1 md:col-span-2">
                        <FieldLabel>Room Type</FieldLabel>
                        <FieldSelect
                          value={room.type} onChange={v => updateRoom(i, 'type', v)}
                          options={ROOM_TYPES}
                        />
                      </div>
                      {isUnitAccom ? (
                        <div className="space-y-1">
                          <FieldLabel>Max Guests</FieldLabel>
                          <FieldSelect
                            value={maxGuests}
                            onChange={setMaxGuests}
                            options={['1','2','3','4','5','6','7','8','9','10','12','15','20']}
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <FieldLabel>Capacity</FieldLabel>
                          <FieldInput type="number" value={room.capacity} onChange={v => updateRoom(i, 'capacity', v)} placeholder="Guests" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <FieldLabel>Price / Night (₹)</FieldLabel>
                        <FieldInput type="number" value={room.price} onChange={v => updateRoom(i, 'price', v)} placeholder="0" />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel required={!accomCap.defaultQty}>{accomCap.label}</FieldLabel>
                        <FieldInput type="number" value={room.qty} onChange={v => updateRoom(i, 'qty', v)} placeholder={accomCap.placeholder} />
                      </div>
                    </div>
                    {rooms.length > 1 && (
                      <button type="button" onClick={() => removeRoom(i)}
                        className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button" onClick={addRoom}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E5E5E5] py-3 text-[13px] font-semibold text-[#6E6E6E] hover:border-[#0066FF] hover:text-[#0066FF] transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add Room Type
                </button>
              </div>
            </SectionCard>

            {/* Hotel Amenities */}
            <SectionCard title="Hotel Amenities" subtitle="Select all facilities available at your property" icon={Star} accent="#0066FF">
              <div className="flex flex-wrap gap-2">
                {RESORT_AMENITIES.map(a => (
                  <AmenityChip key={a.id} label={a.label} icon={a.icon} selected={amenities.includes(a.id)} onClick={() => toggleAmenity(a.id)} />
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {/* ══ EVENTS SPECIFIC ════════════════════════════════════════════ */}
        {bizType === 'events' && (
          <>
            <SectionCard title="Event Details" subtitle="Date, venue, capacity and attendee policies" icon={Calendar} accent="#7C3AED">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <FieldLabel required>Event Start Date &amp; Time</FieldLabel>
                    <FieldInput id="eventDate" type="datetime-local" value={eventDate} onChange={setEventDate} placeholder="" error={errors.eventDate} />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Event End Date &amp; Time</FieldLabel>
                    <FieldInput id="eventEndDate" type="datetime-local" value={eventEndDate} onChange={setEventEndDate} placeholder="" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <FieldLabel required>Venue Name</FieldLabel>
                    <FieldInput id="eventVenue" value={eventVenue} onChange={setEventVenue} placeholder="e.g. Jawaharlal Nehru Stadium, NESCO Grounds" error={errors.eventVenue} />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Total Capacity</FieldLabel>
                    <FieldInput id="totalCapacity" type="number" value={totalCapacity} onChange={setTotalCapacity} placeholder="Max attendees" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <FieldLabel>Age Restriction</FieldLabel>
                    <FieldInput value={ageRestriction} onChange={setAgeRestriction} placeholder="e.g. 18+ only, All ages welcome" />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Refund Policy</FieldLabel>
                    <FieldInput value={refundPolicy} onChange={setRefundPolicy} placeholder="e.g. Non-refundable, 7-day refund" />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Ticket Types" subtitle="Configure different ticket categories and pricing" icon={Ticket} accent="#7C3AED">
              <div className="space-y-3">
                {tickets.map((t, i) => (
                  <div key={i} className="rounded-xl border border-[#E5E5E5] bg-slate-50/50 p-4 relative">
                    <div className="grid gap-3 md:grid-cols-4 items-start">
                      <div className="space-y-1 md:col-span-1">
                        <FieldLabel>Ticket Type</FieldLabel>
                        <FieldSelect value={t.type} onChange={v => updateTicket(i, 'type', v)} options={TICKET_TYPES} />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel>Price (₹)</FieldLabel>
                        <FieldInput type="number" value={t.price} onChange={v => updateTicket(i, 'price', v)} placeholder="0" />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel>Qty Available</FieldLabel>
                        <FieldInput type="number" value={t.qty} onChange={v => updateTicket(i, 'qty', v)} placeholder="0" />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel>Perks / Description</FieldLabel>
                        <FieldInput value={t.description} onChange={v => updateTicket(i, 'description', v)} placeholder="What's included?" />
                      </div>
                    </div>
                    {tickets.length > 1 && (
                      <button type="button" onClick={() => removeTicket(i)}
                        className="absolute top-3 right-3 text-red-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button" onClick={addTicket}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E5E5E5] py-3 text-[13px] font-semibold text-[#6E6E6E] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add Ticket Type
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Event Facilities" subtitle="Select what's available at this event" icon={Award} accent="#7C3AED">
              <div className="flex flex-wrap gap-2">
                {EVENT_AMENITIES.map(a => (
                  <AmenityChip key={a.id} label={a.label} icon={a.icon} selected={amenities.includes(a.id)} onClick={() => toggleAmenity(a.id)} />
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {/* ══ CAMPING SPECIFIC ═════════════════════════════════════════════ */}
        {bizType === 'events' && eventsSubType === 'camping' && (
          <>
            {/* Camp Details */}
            <SectionCard
              title="Camp Details"
              subtitle="Duration, campsite capacity, dates and cancellation policy"
              icon={Tent}
              accent="#EA580C"
            >
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <FieldLabel required>Camp Start Date</FieldLabel>
                    <FieldInput id="eventDate" type="datetime-local" value={eventDate} onChange={setEventDate} placeholder="" error={errors.eventDate} />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Camp End Date</FieldLabel>
                    <FieldInput id="eventEndDate" type="datetime-local" value={eventEndDate} onChange={setEventEndDate} placeholder="" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <FieldLabel>Total Capacity</FieldLabel>
                    <FieldInput id="totalCapacity" type="number" value={totalCapacity} onChange={setTotalCapacity} placeholder="Max campers" />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Cancellation Policy</FieldLabel>
                    <select
                      value={cancellationPolicy}
                      onChange={e => setCancellationPolicy(e.target.value)}
                      className="h-10 w-full bg-transparent text-[13px] text-[#4B4B4B] rounded-[4px] border border-[#989898] px-3 focus:outline-none focus:ring-1 focus:ring-[#0066FF] focus:border-[#0066FF] transition-colors shadow-none appearance-none"
                    >
                      <option value="">Select policy…</option>
                      <option>Free cancellation (24 hours before)</option>
                      <option>Free cancellation (48 hours before)</option>
                      <option>Free cancellation (7 days before)</option>
                      <option>Free cancellation (14 days before)</option>
                      <option>50% refund (48 hours before)</option>
                      <option>50% refund (7 days before)</option>
                      <option>Non-refundable</option>
                      <option>No cancellation policy</option>
                    </select>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Camp Packages */}
            <SectionCard
              title="Camp Packages"
              subtitle="Add different sleeping / accommodation options with individual pricing"
              icon={Tag}
              accent="#EA580C"
            >
              <div className="space-y-3">
                {rooms.map((room, i) => (
                  <div key={i} className="relative rounded-xl border border-[#E5E5E5] bg-slate-50/50 p-4">
                    <div className="grid gap-3 md:grid-cols-5 items-start">
                      <div className="space-y-1 md:col-span-2">
                        <FieldLabel>Package Type</FieldLabel>
                        <FieldSelect
                          value={room.type} onChange={v => updateRoom(i, 'type', v)}
                          options={['Tent', 'Dormitory', 'Private Cabin', 'Glamping Pod', 'Treehouse', 'Luxury Safari Tent']}
                        />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel>Capacity</FieldLabel>
                        <FieldInput type="number" value={room.capacity} onChange={v => updateRoom(i, 'capacity', v)} placeholder="Persons" />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel>Price / Person (₹)</FieldLabel>
                        <FieldInput type="number" value={room.price} onChange={v => updateRoom(i, 'price', v)} placeholder="0" />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel>Units Available</FieldLabel>
                        <FieldInput type="number" value={room.qty} onChange={v => updateRoom(i, 'qty', v)} placeholder="0" />
                      </div>
                    </div>
                    {rooms.length > 1 && (
                      <button type="button" onClick={() => removeRoom(i)}
                        className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button" onClick={addRoom}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E5E5E5] py-3 text-[13px] font-semibold text-[#6E6E6E] hover:border-[#EA580C] hover:text-[#EA580C] transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add Package
                </button>
              </div>
            </SectionCard>

            {/* Camp Amenities */}
            <SectionCard title="Camp Activities & Facilities" subtitle="Select everything available at your camp" icon={Star} accent="#EA580C">
              <div className="flex flex-wrap gap-2">
                {CAMP_AMENITIES.map(a => (
                  <AmenityChip key={a.id} label={a.label} icon={a.icon} selected={amenities.includes(a.id)} onClick={() => toggleAmenity(a.id)} />
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {/* ══ RETAIL / PRODUCTS SPECIFIC ═════════════════════════════════ */}
        {bizType === 'products' && (
          <SectionCard title="Stock & Category" subtitle="Category, brand, and how many units you have available" icon={Package} accent="#059669">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <FieldLabel>Category</FieldLabel>
                  <FieldSelect value={category} onChange={setCategory} options={PRODUCT_CATEGORIES} placeholder="Select category" />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Brand</FieldLabel>
                  <FieldInput value={brand} onChange={setBrand} placeholder="e.g. Nike, Zara, Local brand" />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Stock Quantity</FieldLabel>
                  <FieldInput
                    id="stockQty" type="number" value={stockQty} onChange={setStockQty}
                    placeholder="e.g. 20" disabled={!trackInventory} error={errors.stockQty}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[#E5E5E5] bg-slate-50/60 px-4 py-3.5">
                <div>
                  <p className="text-[13px] font-bold text-[#4B4B4B]">Track Inventory</p>
                  <p className="text-[12px] text-[#6E6E6E] mt-0.5">Get alerts when stock runs low</p>
                </div>
                <Switch checked={trackInventory} onCheckedChange={setTrackInventory} />
              </div>
            </div>
          </SectionCard>
        )}

        {/* ══ EDUCATION SPECIFIC ═══════════════════════════════════════════ */}
        {(bizType as string) === 'education' && (
          <>
            <SectionCard title="Course Details" subtitle="Duration, level, delivery and capacity" icon={BookOpen} accent="#D97706">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <FieldLabel>Duration</FieldLabel>
                    <FieldInput value={duration} onChange={setDuration} placeholder="e.g. 8 weeks, 3 months" />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Level</FieldLabel>
                    <FieldSelect value={level} onChange={setLevel} options={COURSE_LEVELS} />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Seats Available</FieldLabel>
                    <FieldInput type="number" value={capacity} onChange={setCapacity} placeholder="Max students" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <FieldLabel>Delivery Mode</FieldLabel>
                    <FieldSelect value={deliveryMode} onChange={setDeliveryMode} options={DELIVERY_MODES} />
                  </div>
                  <div className="flex items-end pb-0.5">
                    <div className="flex items-center justify-between rounded-xl border border-[#E5E5E5] bg-slate-50/60 px-4 py-3.5 w-full">
                      <div>
                        <p className="text-[13px] font-bold text-[#4B4B4B]">Certificate Provided</p>
                        <p className="text-[12px] text-[#6E6E6E] mt-0.5">Issue certificate on completion</p>
                      </div>
                      <Switch checked={certificate} onCheckedChange={setCertificate} />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Prerequisites</FieldLabel>
                  <FieldTextarea value={prerequisites} onChange={setPrerequisites} rows={2} placeholder="Skills or knowledge required before joining this course…" />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Syllabus / Curriculum</FieldLabel>
                  <FieldTextarea value={syllabus} onChange={setSyllabus} rows={5} placeholder="Module 1: Introduction\nModule 2: Core Concepts\n…" />
                </div>
              </div>
            </SectionCard>
          </>
        )}

        {/* ── Submit Bar ── */}
        <div className="sticky bottom-4 z-10">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/60 bg-white/90 backdrop-blur-xl px-6 py-4 shadow-[0_8px_40px_-10px_rgba(0,0,0,0.12)]">
            <button
              type="button"
              onClick={() => router.push('/inventory/products')}
              className="flex items-center gap-2 rounded-full border border-[#E5E5E5] px-5 py-2.5 text-[13px] font-semibold text-[#4B4B4B] hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </button>

            <div className="flex items-center gap-3">
              {(isSubmitting || uploadingImages) && (
                <p className="text-[12px] text-[#6E6E6E] font-medium animate-pulse">
                  {uploadingImages ? 'Uploading images…' : 'Saving…'}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting || uploadingImages}
                className="flex items-center gap-2 rounded-full px-7 py-2.5 text-[13px] font-bold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: isSubmitting || uploadingImages
                    ? '#888'
                    : `linear-gradient(135deg, ${pageConfig.accent}, ${pageConfig.accent}cc)`,
                  boxShadow: `0 6px 20px ${pageConfig.accent}40`,
                }}
              >
                {isSubmitting || uploadingImages
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <CheckCircle2 className="h-4 w-4" />}
                {uploadingImages ? 'Uploading…' : isSubmitting ? 'Saving…' : 'Save to Inventory'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </DashboardLayout>
  )
}
