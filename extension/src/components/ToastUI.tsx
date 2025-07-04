import React, { useEffect, useState } from 'react';

interface ToastUIProps {
  message: string;
  level: 'success' | 'error';
  onClose: () => void;
  id: string; // Unique ID for key and potential management
}

const ToastUI: React.FC<ToastUIProps> = ({ message, level, onClose, id }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Start animation
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
      // Wait for fade-out animation to complete before calling onClose
      setTimeout(onClose, 300); // This duration should match the fade-out transition
    }, 3000); // Toast visible for 3 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const baseClasses = "fixed right-5 p-4 rounded-md shadow-lg text-white transition-all duration-300 ease-in-out transform";
  const levelClasses = level === 'success'
    ? "bg-green-600"
    : "bg-red-600";

  // For stacking, this component itself doesn't know its position relative to others.
  // The content script mounting multiple toasts would handle positioning.
  // This example assumes it's positioned by its container or a fixed known spot.
  // The `top` style here is just a placeholder if it were a single toast.
  // A better approach for stacking is in the content script that mounts these.
  const visibilityClasses = visible
    ? "opacity-100 translate-x-0"
    : "opacity-0 translate-x-full"; // Slide in from right, fade out by sliding right

  return (
    <div
      id={id}
      className={`${baseClasses} ${levelClasses} ${visibilityClasses} z-[2147483647]`}
      style={{ top: `calc(1.25rem + (${id.split('-').pop() || 0} * 4rem))` }} // Basic stacking based on ID index
      role="alert"
    >
      {message}
    </div>
  );
};

export default ToastUI;
