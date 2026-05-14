'use client'

import { useEffect, useState } from 'react'

interface TypingTextProps {
  text: string
  speed?: number
  className?: string
}

export function TypingText({ text, speed = 18, className }: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    setDisplayedText('')
    let index = 0
    const interval = window.setInterval(() => {
      index += 1
      setDisplayedText(text.slice(0, index))
      if (index >= text.length) {
        window.clearInterval(interval)
      }
    }, speed)

    return () => window.clearInterval(interval)
  }, [speed, text])

  return (
    <p className={className}>
      {displayedText}
      <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-[#0066FF]" />
    </p>
  )
}
