import React, { useCallback, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  ariaLabel?: string
  children: React.ReactNode
  size?: 'md' | 'lg' | 'xl'
  className?: string
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

/**
 * Ported from /web/windowsbuilds_app/src/components/ui/Modal.tsx, minus
 * framer-motion (not a dependency here). Its scroll-lock rationale applies
 * verbatim: overflow is hidden on BOTH <html> and <body> because the XenForo
 * page scrolls <html> — jsdom would bless a body-only lock that does nothing
 * in the real page — and hiding overflow (instead of position:fixed) keeps
 * the scroll offset where it was; the padding compensates for the scrollbar.
 */
function lockScroll(): () => void {
  const { body, documentElement } = document
  const previous = {
    htmlOverflow: documentElement.style.overflow,
    bodyOverflow: body.style.overflow,
    bodyPaddingRight: body.style.paddingRight,
  }
  const scrollbarWidth = window.innerWidth - documentElement.clientWidth

  documentElement.style.overflow = 'hidden'
  body.style.overflow = 'hidden'
  if (scrollbarWidth > 0) {
    const current = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0
    body.style.paddingRight = `${current + scrollbarWidth}px`
  }

  return () => {
    documentElement.style.overflow = previous.htmlOverflow
    body.style.overflow = previous.bodyOverflow
    body.style.paddingRight = previous.bodyPaddingRight
  }
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  ariaLabel,
  children,
  size = 'lg',
  className,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  // Escape, and a Tab trap so focus cannot wander into the page behind.
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab') return

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
    if (!focusable?.length) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement

    if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return

    restoreFocusRef.current = document.activeElement as HTMLElement | null
    const releaseScroll = lockScroll()

    // Focus the dialog itself so a screen reader announces the title before
    // the user starts tabbing through actions.
    const focusTimer = window.setTimeout(() => dialogRef.current?.focus(), 0)

    return () => {
      window.clearTimeout(focusTimer)
      releaseScroll()
      restoreFocusRef.current?.focus?.()
    }
  }, [isOpen])

  if (typeof document === 'undefined' || !isOpen) return null

  return createPortal(
    <div className="store-portal">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        style={{ zIndex: 9998 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 flex items-start justify-center overflow-y-auto p-4 pt-16 pointer-events-none"
        style={{ zIndex: 9999 }}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-label={title ? undefined : (ariaLabel ?? 'Details')}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className={clsx(
            'w-full bg-panel rounded-lg pointer-events-auto focus:outline-none',
            'shadow-[var(--shadow-depth-lg)] border border-edge',
            sizeClasses[size],
            className,
          )}
        >
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
              <h2 id={titleId} className="text-xl font-semibold font-display text-ink">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1 rounded-md text-ink2 hover:bg-panel-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
