'use client'
import { useState, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { AvailabilitySlot } from './types'
import toast from 'react-hot-toast'
import { Loader2, Lock, Unlock, Plus, CheckCircle2 } from 'lucide-react'

const INPUT_CLS = 'h-10 w-full bg-transparent text-[13px] text-[#4B4B4B] placeholder:text-[#989898] rounded-[4px] border border-[#989898] px-3 focus:outline-none focus:ring-1 focus:ring-[#0066FF] focus:border-[#0066FF] transition-colors'

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export function AvailabilitySection({ serviceId, accent }: { serviceId: string | undefined; accent: string }) {
  if (!serviceId) return null
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(false)
  const [blocking, setBlocking] = useState<string | null>(null)
  const [showSetForm, setShowSetForm] = useState(false)
  const [setDates, setSetDates] = useState('')
  const [setSlotCount, setSetSlotCount] = useState('')
  const [setPrice, setSetPrice] = useState('')
  const [setSubmitting, setSetSubmitting] = useState(false)

  const fetchAvailability = useCallback(async () => {
    if (!from || !to) { toast('Please select both dates', { icon: '⚠️' }); return }
    setLoading(true)
    try {
      const res = await apiClient.get(`/api/v1/inventory/services/${serviceId}/availability`, { params: { from, to } })
      const raw = res.data as { data?: AvailabilitySlot[] } | AvailabilitySlot[]
      setSlots((raw as { data?: AvailabilitySlot[] }).data ?? (raw as AvailabilitySlot[]) ?? [])
    } catch {
      toast.error('Failed to load availability')
    } finally {
      setLoading(false)
    }
  }, [serviceId, from, to])

  const blockDate = async (date: string) => {
    setBlocking(date)
    try {
      await apiClient.patch(`/api/v1/inventory/services/${serviceId}/availability/block`, { date })
      toast.success(`${date} blocked`)
      setSlots(p => p.map(s => s.date === date ? { ...s, is_blocked: true } : s))
    } catch {
      toast.error('Failed to block date')
    } finally {
      setBlocking(null)
    }
  }

  const submitSetAvailability = async () => {
    const dates = setDates.split(',').map(d => d.trim()).filter(Boolean)
    if (!dates.length || !setSlotCount || !setPrice) {
      toast('Fill in all fields', { icon: '⚠️' }); return
    }
    setSetSubmitting(true)
    try {
      await apiClient.post(`/api/v1/inventory/services/${serviceId}/availability`, {
        dates,
        total_slots: Number(setSlotCount),
        effective_price: Number(setPrice),
      })
      toast.success('Availability updated!')
      setShowSetForm(false)
      setSetDates(''); setSetSlotCount(''); setSetPrice('')
      await fetchAvailability()
    } catch {
      toast.error('Failed to set availability')
    } finally {
      setSetSubmitting(false)
    }
  }

  return (
    <div className="border-t border-slate-100 pt-4 mt-2 space-y-4">
      {/* Date Range Picker */}
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <p className="text-[11px] font-bold text-[#989898]">FROM</p>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={INPUT_CLS} />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-[11px] font-bold text-[#989898]">TO</p>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className={INPUT_CLS} />
        </div>
        <button onClick={fetchAvailability} disabled={loading}
          className="h-10 px-4 rounded-[4px] text-[13px] font-bold text-white flex items-center gap-1.5 disabled:opacity-60 transition-all"
          style={{ background: accent }}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Fetch'}
        </button>
      </div>

      {/* Availability Table */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />)}
        </div>
      )}

      {!loading && slots.length > 0 && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-3 py-2.5 font-bold text-[#4B4B4B]">Date</th>
                <th className="text-center px-3 py-2.5 font-bold text-[#4B4B4B]">Avail / Total</th>
                <th className="text-right px-3 py-2.5 font-bold text-[#4B4B4B]">Price</th>
                <th className="text-center px-3 py-2.5 font-bold text-[#4B4B4B]">Status</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {slots.map(s => (
                <tr key={s.date} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="px-3 py-2.5 font-semibold text-[#4B4B4B]">{new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={s.available_slots === 0 ? 'text-red-500 font-bold' : 'text-[#4B4B4B]'}>
                      {s.available_slots}
                    </span>
                    <span className="text-[#989898]"> / {s.total_slots}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-[#4B4B4B]">{fmt(s.effective_price)}</td>
                  <td className="px-3 py-2.5 text-center">
                    {s.is_blocked
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 text-[10px] font-bold"><Lock className="h-2.5 w-2.5" />Blocked</span>
                      : <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 text-green-600 px-2 py-0.5 text-[10px] font-bold"><Unlock className="h-2.5 w-2.5" />Open</span>
                    }
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {!s.is_blocked && (
                      <button onClick={() => blockDate(s.date)} disabled={blocking === s.date}
                        className="text-[11px] font-semibold text-red-500 hover:text-red-700 disabled:opacity-50">
                        {blocking === s.date ? '…' : 'Block'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && slots.length === 0 && from && to && (
        <p className="text-[12px] text-[#989898] text-center py-4">No availability data for this range</p>
      )}

      {/* Set Availability */}
      <button onClick={() => setShowSetForm(v => !v)}
        className="flex items-center gap-1.5 text-[12px] font-bold transition-colors"
        style={{ color: accent }}>
        <Plus className="h-3.5 w-3.5" />
        Set Availability
      </button>

      {showSetForm && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
          <p className="text-[12px] font-bold text-[#4B4B4B]">Set Availability for Dates</p>
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-[#6E6E6E]">Dates <span className="font-normal">(comma-separated: YYYY-MM-DD)</span></p>
            <input value={setDates} onChange={e => setSetDates(e.target.value)}
              placeholder="2026-04-01, 2026-04-02, 2026-04-03"
              className={INPUT_CLS} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-[#6E6E6E]">Total Slots</p>
              <input type="number" value={setSlotCount} onChange={e => setSetSlotCount(e.target.value)} placeholder="e.g. 10" className={INPUT_CLS} />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-[#6E6E6E]">Effective Price (₹)</p>
              <input type="number" value={setPrice} onChange={e => setSetPrice(e.target.value)} placeholder="e.g. 5500" className={INPUT_CLS} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowSetForm(false)}
              className="flex-1 h-9 rounded-full border border-[#E5E5E5] text-[12px] font-semibold text-[#6E6E6E] hover:bg-white transition-colors">
              Cancel
            </button>
            <button onClick={submitSetAvailability} disabled={setSubmitting}
              className="flex-1 h-9 rounded-full text-[12px] font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-60 transition-all"
              style={{ background: accent }}>
              {setSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
