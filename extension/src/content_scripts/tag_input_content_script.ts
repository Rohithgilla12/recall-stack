import React from "react";
import * as ReactDOMClient from "react-dom/client";
import TagInputUI from "~components/TagInputUI"; // Using ~ alias for src

// Attempt to import Tailwind CSS. This path might need adjustment based on Plasmo's build output.
// If style.css is in src/ and includes Tailwind.
// For this to work, Plasmo needs to correctly process `data-text:` imports in regular TS files,
// or this CSS needs to be made available another way (e.g. web_accessible_resources and fetch).
// As a fallback, Tailwind classes in TagInputUI.tsx will work if the page itself uses Tailwind,
// but Shadow DOM encapsulation is better.
// Assuming `src/style.css` is the main CSS file with Tailwind.
import tailwindStyleText from "data-text:../../style.css";


interface PageDetails {
  url?: string;
  title?: string;
  selectionText?: string;
}

const CONTAINER_ID = "recall-stack-tag-input-react-container";
let root: ReactDOMClient.Root | null = null;
let shadowHost: HTMLDivElement | null = null;

function unmountUI() {
  if (root) {
    root.unmount();
    root = null;
  }
  if (shadowHost) {
    shadowHost.remove();
    shadowHost = null;
  }
  // Remove the main container if it exists (though shadowHost.remove() should handle it)
  const existingContainer = document.getElementById(CONTAINER_ID);
  if (existingContainer) {
    existingContainer.remove();
  }
}

function mountUI(pageDetails: PageDetails) {
  // Remove any existing UI first
  unmountUI();

  shadowHost = document.createElement("div");
  shadowHost.id = CONTAINER_ID; // The outer host for the shadow DOM
  document.body.appendChild(shadowHost);

  const shadow = shadowHost.attachShadow({ mode: "open" });

  // Inject Tailwind styles into Shadow DOM
  const styleElement = document.createElement("style");
  styleElement.textContent = tailwindStyleText; // Use imported Tailwind CSS
  shadow.appendChild(styleElement);

  const reactMountPoint = document.createElement("div");
  reactMountPoint.id = "recall-stack-react-mount-point"; // Actual mount point for React app
  shadow.appendChild(reactMountPoint);

  root = ReactDOMClient.createRoot(reactMountPoint);
  root.render(
    React.createElement(TagInputUI, {
      initialPageDetails: pageDetails,
      onSubmit: (tags, submittedPageDetails) => {
        chrome.runtime.sendMessage({
          type: "saveBookmarkWithTags",
          url: submittedPageDetails.url,
          title: submittedPageDetails.title,
          description: submittedPageDetails.selectionText,
          tags: tags,
        });
        // unmountUI(); // TagInputUI calls onClose which triggers this
      },
      onClose: () => {
        unmountUI();
      },
    })
  );
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "initTagInput") {
    const details: PageDetails = {
      url: request.url,
      title: request.title,
      selectionText: request.selectionText,
    };
    mountUI(details);
    // No response needed
    return false;
  }
});

// Clean up if the script is somehow re-injected or page unloads (best effort)
// window.addEventListener("beforeunload", unmountUI);

console.log("Recall Stack: Tag input content script (React version) loaded.");
