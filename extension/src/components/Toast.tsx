import React, { useEffect, useState } from "react"

export type ToastType = "success" | "error"

export interface ToastProps {
  message: string
  type: ToastType
  duration?: number
  onClose?: () => void
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 4000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => {
        onClose?.()
      }, 300) // Allow fade out animation to complete
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose?.()
    }, 300)
  }

  const baseClasses =
    "fixed top-4 right-4 max-w-sm w-full z-[2147483647] transform transition-all duration-300 ease-in-out"
  const visibilityClasses = isVisible
    ? "translate-x-0 opacity-100"
    : "translate-x-full opacity-0"

  const typeClasses =
    type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"

  return (
    <div className={`${baseClasses} ${visibilityClasses}`}>
      <div
        className={`${typeClasses} p-4 rounded-lg shadow-lg flex items-center justify-between`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {type === "success" ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{message}</p>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            className="inline-flex text-white hover:text-gray-200 focus:outline-none focus:text-gray-200 transition ease-in-out duration-150"
            onClick={handleClose}>
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
