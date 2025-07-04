import React from "react";
import * as ReactDOMClient from "react-dom/client";
import ToastUI from "~components/ToastUI"; // Using ~ alias for src

// Attempt to import Tailwind CSS (same approach as tag_input_content_script.ts)
import tailwindStyleText from "data-text:../../style.css";

interface ToastInstance {
  id: string;
  root: ReactDOMClient.Root;
  shadowHost: HTMLDivElement;
}

// Keep track of active toasts to manage them
const activeToasts = new Map<string, ToastInstance>();
let toastCounter = 0;

function unmountToast(toastId: string) {
  const instance = activeToasts.get(toastId);
  if (instance) {
    instance.root.unmount();
    instance.shadowHost.remove();
    activeToasts.delete(toastId);
  }
}

function mountToast(message: string, level: "success" | "error") {
  const toastId = `recall-stack-toast-${toastCounter++}`;

  const shadowHost = document.createElement("div");
  // Note: The ToastUI component itself is fixed position.
  // The shadowHost doesn't need specific positioning itself, just needs to be in the body.
  // The ToastUI component will handle its own fixed positioning and stacking appearance via its `id` prop.
  document.body.appendChild(shadowHost);

  const shadow = shadowHost.attachShadow({ mode: "open" });

  const styleElement = document.createElement("style");
  styleElement.textContent = tailwindStyleText;
  shadow.appendChild(styleElement);

  const reactMountPoint = document.createElement("div");
  shadow.appendChild(reactMountPoint);

  const root = ReactDOMClient.createRoot(reactMountPoint);
  root.render(
    React.createElement(ToastUI, {
      id: toastId,
      message,
      level,
      onClose: () => {
        unmountToast(toastId);
      },
    })
  );

  activeToasts.set(toastId, { id: toastId, root, shadowHost });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "showToast") {
    mountToast(request.message, request.level || "success");
    return false; // No response needed
  }
});

// Clean up all toasts if the script is reloaded or page unloads (best effort)
// window.addEventListener("beforeunload", () => {
//   activeToasts.forEach(instance => unmountToast(instance.id));
// });

console.log("Recall Stack: Toast content script (React version) loaded.");
