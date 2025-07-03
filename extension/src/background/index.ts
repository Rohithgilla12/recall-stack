import { createClerkClient } from "@clerk/chrome-extension/background"

const publishableKey = process.env.PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error(
    "Please add the PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY to the .env.development file"
  )
}

// Use `createClerkClient()` to create a new Clerk instance
// and use `getToken()` to get a fresh token for the user
async function getToken() {
  const clerk = await createClerkClient({
    publishableKey
  })

  // If there is no valid session, then return null. Otherwise proceed.
  if (!clerk.session) {
    return null
  }

  // Return the user's session
  return await clerk.session?.getToken()
}

// Create a listener to listen for messages from content scripts
// It must return true, in order to keep the connection open and send a response later.
// NOTE: A runtime listener cannot be async.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // This example sends the token back to the content script
  // but you could also use the token to perform actions on behalf of the user
  getToken()
    .then((token) => sendResponse({ token }))
    .catch((error) => {
      console.error("[Background service worker] Error:", JSON.stringify(error))
      // If there is no token then send a null response
      sendResponse({ token: null })
    })
  return true // REQUIRED: Indicates that the listener responds asynchronously.
})

chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    title: "Save to Recall Stack", // Updated title
    contexts: ["page", "selection", "link", "image"], // More specific contexts
    id: "save-to-recall-stack"
  })
})

// Refactored function to handle bookmark saving
async function saveBookmarkToRecallStack(tabInfo: chrome.tabs.Tab, additionalInfo?: chrome.contextMenus.OnClickData) {
  console.log("Attempting to save bookmark for tab:", tabInfo, "Additional info:", additionalInfo)

  const token = await getToken()
  if (!token) {
    console.error("User not authenticated. Cannot save bookmark.")
    // TODO: Notify the user they need to log in.
    return
  }

  const bookmarkUrl = additionalInfo?.pageUrl || tabInfo.url
  let bookmarkTitle = tabInfo.title || "Untitled Bookmark"
  let description = additionalInfo?.selectionText

  // If triggered by context menu on a link, use link URL and potentially link text
  if (additionalInfo?.linkUrl) {
    // Heuristic: If there's selected text, it might be more relevant than the tab title for a link.
    // Or, often for links, there isn't a good "title" other than the link text itself,
    // which isn't directly available here unless it was part of selectionText.
    // For simplicity, we'll prioritize page title, but this could be refined.
    // bookmarkTitle = additionalInfo.selectionText || tabInfo.title || "Link"; // Example refinement
  }

  if (!bookmarkUrl) {
    console.error("Could not determine URL for bookmark.")
    return;
  }

  console.log(`Preparing to save: Title: "${bookmarkTitle}", URL: "${bookmarkUrl}", Description: "${description}"`)

  try {
    // TODO: Make this URL configurable (e.g., via environment variable for the extension)
    const apiUrl = "http://localhost:4321/api/bookmarks"
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        url: bookmarkUrl,
        title: bookmarkTitle,
        description: description, // Pass selectionText as description
        // imageUrl: additionalInfo?.srcUrl, // If saving an image context
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error saving bookmark via API:", response.status, errorData)
      // TODO: Notify the user about the error.
      return
    }

    const result = await response.json()
    console.log("Bookmark saved successfully via API:", result)
    // TODO: Notify the user of success.
  } catch (error) {
    console.error("Failed to send bookmark to API:", error)
    // TODO: Notify the user about the network error.
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-to-recall-stack" && tab) {
    saveBookmarkToRecallStack(tab, info)
  }
})

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === "save-to-recall-stack" && tab) {
    // Note: 'tab' here might be the currently active tab when the command is issued.
    // If the command should always operate on the active tab, this is fine.
    // chrome.tabs.query({ active: true, currentWindow: true }) could also be used if 'tab' is not reliably passed.
    saveBookmarkToRecallStack(tab)
  }
})
