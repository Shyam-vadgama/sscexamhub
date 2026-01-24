'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 w-full max-w-lg mx-4">
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn(
      "relative bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto",
      className
    )}>
      {children}
    </div>
  )
}

export function DialogHeader({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn("p-6 pb-4", className)}>
      {children}
    </div>
  )
}

export function DialogTitle({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <h2 className={cn("text-2xl font-semibold text-gray-900", className)}>
      {children}
    </h2>
  )
}

export function DialogDescription({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <p className={cn("text-sm text-gray-600 mt-2", className)}>
      {children}
    </p>
  )
}

export function DialogBody({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn("px-6", className)}>
      {children}
    </div>
  )
}

export function DialogFooter({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn("p-6 pt-4 flex items-center justify-end space-x-3", className)}>
      {children}
    </div>
  )
}

export function DialogClose({ 
  onClose 
}: { 
  onClose: () => void 
}) {
  return (
    <button
      onClick={onClose}
      className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <X className="w-5 h-5 text-gray-500" />
    </button>
  )
}
