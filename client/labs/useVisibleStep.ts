import { useEffect, useRef } from 'react'

export function useVisibleStep(step: unknown) {
  const viewport = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = viewport.current
    const active = container?.querySelector('[data-step-focus]')
    if (!container || !active) return
    const outer = container.getBoundingClientRect()
    const inner = active.getBoundingClientRect()
    const horizontal = inner.left < outer.left ? inner.left - outer.left : Math.max(0, inner.right - outer.right)
    const vertical = inner.top < outer.top ? inner.top - outer.top : Math.max(0, inner.bottom - outer.bottom)
    if (horizontal || vertical) container.scrollBy(horizontal, vertical)
  }, [step])
  return viewport
}
