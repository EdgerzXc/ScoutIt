'use client'
import { useEffect, useRef } from 'react'

export default function useDescentProgress() {
  const sectionRef = useRef(null)

  useEffect(() => {
    if (!sectionRef.current) return

    const section = sectionRef.current

    const calculate = () => {
      // Try cinematic-container first, fall back to window/document
      const container = document.querySelector('.cinematic-container')
      
      let scrollTop, viewportHeight, totalScroll
      
      if (container && container.scrollHeight > container.clientHeight) {
        // Container is the scroller
        scrollTop = container.scrollTop
        viewportHeight = container.clientHeight
      } else {
        // Body/window is the scroller
        scrollTop = window.scrollY || document.documentElement.scrollTop
        viewportHeight = window.innerHeight
      }

      const rect = section.getBoundingClientRect()
      
      // Progress from 0 (section just entered viewport top) 
      // to 1 (section has fully scrolled through)
      const progress = Math.max(0, Math.min(1,
        1 - (rect.bottom / viewportHeight)
      ))

      section.style.setProperty('--sp', progress.toFixed(4))
    }

    // Attach to BOTH possible scroll targets
    const container = document.querySelector('.cinematic-container')
    
    window.addEventListener('scroll', calculate, { passive: true })
    document.addEventListener('scroll', calculate, { passive: true })
    if (container) {
      container.addEventListener('scroll', calculate, { passive: true })
    }

    // Also use IntersectionObserver as a backup trigger
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(() => calculate())
      },
      { threshold: Array.from({length: 21}, (_, i) => i * 0.05) }
    )
    observer.observe(section)

    // Run immediately
    calculate()

    return () => {
      window.removeEventListener('scroll', calculate)
      document.removeEventListener('scroll', calculate)
      if (container) container.removeEventListener('scroll', calculate)
      observer.disconnect()
    }
  }, [])

  return sectionRef
}
