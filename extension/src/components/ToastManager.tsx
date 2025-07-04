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
    <div className="toast-container">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            position: "fixed",
            top: `${16 + index * 80}px`, // Stack toasts vertically
            right: "16px",
            zIndex: 2147483647
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
