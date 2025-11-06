'use client'

import { useState } from 'react'
import { Clock } from 'lucide-react'

interface WorkingHours {
  [day: string]: {
    open: string
    close: string
    closed: boolean
  }
}

interface WorkingHoursInputProps {
  value: WorkingHours
  onChange: (value: WorkingHours) => void
  disabled?: boolean
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

export function WorkingHoursInput({ value, onChange, disabled }: WorkingHoursInputProps) {
  const handleDayChange = (day: string, field: 'open' | 'close' | 'closed', newValue: string | boolean) => {
    onChange({
      ...value,
      [day]: {
        ...value[day],
        [field]: newValue,
      },
    })
  }

  const handleToggleClosed = (day: string) => {
    const currentClosed = value[day]?.closed ?? false
    handleDayChange(day, 'closed', !currentClosed)
  }

  return (
    <div className="border rounded-lg divide-y">
      {DAYS.map((day) => {
        const dayData = value[day] || { open: '09:00', close: '17:00', closed: false }
        const isClosed = dayData.closed

        return (
          <div key={day} className="p-3 flex items-center gap-3">
            {/* Day Name */}
            <div className="w-28 font-medium text-sm">{DAY_LABELS[day]}</div>

            {/* Closed Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isClosed}
                onChange={() => handleToggleClosed(day)}
                disabled={disabled}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Closed</span>
            </label>

            {/* Time Inputs */}
            {!isClosed && (
              <div className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <input
                    type="time"
                    value={dayData.open}
                    onChange={(e) => handleDayChange(day, 'open', e.target.value)}
                    disabled={disabled}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-gray-400">-</span>
                <input
                  type="time"
                  value={dayData.close}
                  onChange={(e) => handleDayChange(day, 'close', e.target.value)}
                  disabled={disabled}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {isClosed && (
              <div className="flex-1 text-sm text-gray-400 italic">Not available</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
