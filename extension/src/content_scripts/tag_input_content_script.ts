// Content script for tag input

interface PageDetails {
  url?: string;
  title?: string;
  selectionText?: string;
}

let pageDetails: PageDetails = {};
let timerId: number | null = null;
const TAG_INPUT_CONTAINER_ID = "recall-stack-tag-input-container";

function removeTagInputUI() {
  const existingUI = document.getElementById(TAG_INPUT_CONTAINER_ID);
  if (existingUI) {
    existingUI.remove();
  }
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}

function submitTags() {
  removeTagInputUI(); // Clean up UI first

  const tagInput = document.getElementById("recall-stack-tag-input-field") as HTMLInputElement | null;
  const tags = tagInput ? tagInput.value.split(",").map(tag => tag.trim()).filter(tag => tag) : [];

  chrome.runtime.sendMessage({
    type: "saveBookmarkWithTags",
    url: pageDetails.url,
    title: pageDetails.title,
    description: pageDetails.selectionText,
    tags: tags
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error sending message to background:", chrome.runtime.lastError.message);
    } else {
      // console.log("Message sent to background, response:", response);
    }
  });
}

function createTagInputUI() {
  // Remove any existing UI first to prevent duplicates
  removeTagInputUI();

  const container = document.createElement("div");
  container.id = TAG_INPUT_CONTAINER_ID;
  // Basic styling - this should be improved with CSS classes
  container.style.position = "fixed";
  container.style.top = "20px";
  container.style.right = "20px";
  container.style.backgroundColor = "white";
  container.style.padding = "20px";
  container.style.border = "1px solid #ccc";
  container.style.zIndex = "2147483647"; // Max z-index
  container.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.2)";
  container.style.fontFamily = "Arial, sans-serif";
  container.style.fontSize = "14px";
  container.style.color = "#333";


  const titleElement = document.createElement("h3");
  titleElement.textContent = "Add Tags (optional)";
  titleElement.style.margin = "0 0 10px 0";
  titleElement.style.fontSize = "16px";


  const input = document.createElement("input");
  input.type = "text";
  input.id = "recall-stack-tag-input-field";
  input.placeholder = "Enter tags, comma-separated";
  input.style.width = "calc(100% - 22px)"; // Account for padding/border
  input.style.padding = "10px";
  input.style.marginBottom = "10px";
  input.style.border = "1px solid #ddd";
  input.style.borderRadius = "4px";

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save Bookmark";
  saveButton.style.backgroundColor = "#007bff";
  saveButton.style.color = "white";
  saveButton.style.border = "none";
  saveButton.style.padding = "10px 15px";
  saveButton.style.borderRadius = "4px";
  saveButton.style.cursor = "pointer";
  saveButton.onclick = () => {
    if (timerId) clearTimeout(timerId); // Clear timer if manually submitted
    submitTags();
  };

  const timerText = document.createElement("p");
  timerText.style.fontSize = "12px";
  timerText.style.marginTop = "10px";
  timerText.style.color = "#666";
  let countdown = 5;
  timerText.textContent = `Auto-saving in ${countdown}s...`;


  container.appendChild(titleElement);
  container.appendChild(input);
  container.appendChild(saveButton);
  container.appendChild(timerText);
  document.body.appendChild(container);

  input.focus();

  // Start 5-second timer
  timerId = window.setTimeout(() => {
    // Check if UI still exists (user might have closed tab or navigated away)
    if (document.getElementById(TAG_INPUT_CONTAINER_ID)) {
      submitTags();
    }
  }, 5000);

  // Countdown timer update
  const intervalId = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      timerText.textContent = `Auto-saving in ${countdown}s...`;
    } else {
      // timerText.textContent = `Auto-saving...`; // Or remove/hide
      clearInterval(intervalId); // Stop this interval once timer is up
    }
  }, 1000);

  // Ensure interval is cleared when UI is removed
  const observer = new MutationObserver((mutationsList, observerInstance) => {
      for(let mutation of mutationsList) {
          if (mutation.type === 'childList') {
              let removedNodes = Array.from(mutation.removedNodes);
              if (removedNodes.includes(container)) {
                  clearInterval(intervalId);
                  observerInstance.disconnect();
                  return;
              }
          }
      }
  });
  observer.observe(document.body, { childList: true });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "initTagInput") {
    // console.log("Received initTagInput message:", request);
    pageDetails = {
      url: request.url,
      title: request.title,
      selectionText: request.selectionText
    };
    createTagInputUI();
    // Content scripts cannot typically send a response to chrome.tabs.sendMessage
    // If a response is needed, the background script would need to listen for a message from here.
    // For now, no response is sent back for initTagInput.
    return false; // No async response
  }
});

// console.log("Recall Stack: Tag input content script loaded.");

// Optional: Add a listener to remove the UI if the user navigates away
// This can be tricky due to various navigation types.
// window.addEventListener('beforeunload', () => {
//   removeTagInputUI();
// });
