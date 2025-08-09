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
    "plasmo-max-w-sm plasmo-w-[350px] plasmo-mr-4 plasmo-transform plasmo-transition-all plasmo-duration-300 plasmo-ease-in-out"
  const visibilityClasses = isVisible
    ? "plasmo-translate-x-0 plasmo-opacity-100"
    : "plasmo-translate-x-full plasmo-opacity-0"

  const typeClasses =
    type === "success" ? "plasmo-bg-green-500 plasmo-text-white" : "plasmo-bg-red-500 plasmo-text-white"

  return (
    <div className={`${baseClasses} ${visibilityClasses}`}>
      <div
        className={`${typeClasses} plasmo-p-4 plasmo-rounded-lg plasmo-shadow-lg plasmo-flex plasmo-items-center plasmo-justify-between`}>
        <div className="plasmo-flex plasmo-items-center">
          <div className="plasmo-flex-shrink-0">
            {type === "success" ? (
              <svg className="plasmo-h-5 plasmo-w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="plasmo-h-5 plasmo-w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div className="plasmo-ml-3">
            <p className="plasmo-text-sm plasmo-font-medium">{message}</p>
          </div>
        </div>
        <div className="plasmo-ml-4 plasmo-flex-shrink-0">
          <button
            className="plasmo-inline-flex plasmo-text-white hover:plasmo-text-gray-200 focus:plasmo-outline-none focus:plasmo-text-gray-200 plasmo-transition plasmo-ease-in-out plasmo-duration-150"
            onClick={handleClose}>
            <svg className="plasmo-h-4 plasmo-w-4" fill="currentColor" viewBox="0 0 20 20">
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
