// Content script for showing toast messages

const TOAST_CONTAINER_ID_PREFIX = "recall-stack-toast-container-";
let toastCount = 0; // To give unique IDs to toasts if multiple are shown

function showToast(message: string, level: "success" | "error" = "success") {
  const toastId = `${TOAST_CONTAINER_ID_PREFIX}${toastCount++}`;
  const container = document.createElement("div");
  container.id = toastId;

  // Basic styling - can be improved with CSS classes
  container.style.position = "fixed";
  container.style.top = `${20 + (toastCount * 60)}px`; // Stack multiple toasts
  container.style.right = "20px";
  container.style.padding = "15px 20px";
  container.style.borderRadius = "5px";
  container.style.zIndex = "2147483647"; // Max z-index
  container.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.1)";
  container.style.fontFamily = "Arial, sans-serif";
  container.style.fontSize = "14px";
  container.style.transition = "opacity 0.5s ease-in-out, top 0.3s ease-in-out";
  container.style.opacity = "0"; // Start transparent for fade-in

  if (level === "success") {
    container.style.backgroundColor = "#28a745"; // Green
    container.style.color = "white";
  } else {
    container.style.backgroundColor = "#dc3545"; // Red
    container.style.color = "white";
  }

  container.textContent = message;
  document.body.appendChild(container);

  // Trigger fade-in
  setTimeout(() => {
    container.style.opacity = "1";
  }, 10); // Short delay to allow CSS transition to apply

  // Automatically remove the toast after 3 seconds
  setTimeout(() => {
    container.style.opacity = "0";
    // Remove from DOM after fade out transition
    setTimeout(() => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
      // Decrement toastCount if we want to reuse positions, but simple increment is fine for now
      // if (toastCount > 0) toastCount--; // This might lead to overlapping if not careful
    }, 500); // Matches opacity transition time
  }, 3000);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "showToast") {
    // console.log("Received showToast message:", request);
    showToast(request.message, request.level);
    // No response needed for this message type
    return false;
  }
});

// console.log("Recall Stack: Toast content script loaded.");
