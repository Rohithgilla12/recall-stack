import React, { useEffect, useState } from "react"

import { Toast, type ToastType } from "./Toast"

export interface ToastMessage {
  id: string
  message: string
  type: ToastType
  duration?: number
}

export interface ToastManagerProps {
  toasts: ToastMessage[]
  onRemoveToast: (id: string) => void
}

export const ToastManager: React.FC<ToastManagerProps> = ({
  toasts,
  onRemoveToast
}) => {
  return (
    <div className="plasmo-fixed plasmo-top-0 plasmo-right-0 plasmo-z-[2147483647]">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="plasmo-relative"
          style={{
            marginTop: index === 0 ? "16px" : "12px"
          }}>
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => onRemoveToast(toast.id)}
          />
        </div>
      ))}
    </div>
  )
}

// Hook for managing toast state
export const useToasts = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (message: string, type: ToastType, duration?: number) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newToast: ToastMessage = {
      id,
      message,
      type,
      duration
    }
    setToasts((prev) => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const showSuccess = (message: string, duration?: number) => {
    addToast(message, "success", duration)
  }

  const showError = (message: string, duration?: number) => {
    addToast(message, "error", duration)
  }

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError
  }
}
