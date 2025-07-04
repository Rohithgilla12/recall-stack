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
    contexts: ["all"], // More specific contexts
    id: "save-to-recall-stack"
  })
})

// Interface for bookmark data, including optional tags
interface BookmarkData {
  url: string
  title: string
  description?: string
  tags?: string[]
  // Include tabId to send toast message to the correct tab
  tabId?: number
}

// Function to handle bookmark saving, now accepts BookmarkData
async function saveBookmarkToRecallStack(data: BookmarkData) {
  console.log("Attempting to save bookmark with data:", data)

  const token = await getToken()
  if (!token) {
    console.error("User not authenticated. Cannot save bookmark.")
    // TODO: Notify the user they need to log in.
    // Potentially send a message to the content script or open a login page.
    return
  }

  if (!data.url) {
    console.error("Could not determine URL for bookmark.")
    return
  }

  console.log(
    `Preparing to save: Title: "${data.title}", URL: "${data.url}", Description: "${data.description}", Tags: "${data.tags?.join(", ")}"`
  )

  try {
    const apiUrl = "http://localhost:3000/api/bookmarks" // TODO: Configurable
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        url: data.url,
        title: data.title,
        description: data.description,
        tags: data.tags // Send tags to the API
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error(
        "Error saving bookmark via API:",
        response.status,
        errorData
      )
      // TODO: Notify the user about the error (e.g., via toast in the content script)
      if (data.tabId) {
        chrome.scripting.executeScript({
          target: { tabId: data.tabId },
          files: ["content_scripts/toast_content_script.js"] // Ensure this path is correct
        }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error injecting toast script for error:", chrome.runtime.lastError.message);
            return;
          }
          chrome.tabs.sendMessage(data.tabId!, {
            type: "showToast",
            message: `Error: ${errorData.message || "Failed to save bookmark."}`,
            level: "error"
          });
        });
      }
      return
    }

    const result = await response.json()
    console.log("Bookmark saved successfully via API:", result)

    // Notify the user of success by injecting the toast content script
    if (data.tabId) {
      chrome.scripting.executeScript(
        {
          target: { tabId: data.tabId },
          files: ["content_scripts/toast_content_script.js"] // Adjust path if necessary after creating the file
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error injecting toast script:",
              chrome.runtime.lastError.message
            )
            return
          }
          // Send a message to the newly injected script
          chrome.tabs.sendMessage(data.tabId!, {
            type: "showToast",
            message: "Page added to Recall Stack!",
            level: "success"
          })
        }
      )
    }
  } catch (error) {
    console.error("Failed to send bookmark to API:", error)
    // TODO: Notify the user about the network error (e.g., via toast)
    if (data.tabId) {
       chrome.scripting.executeScript({
          target: { tabId: data.tabId },
          files: ["content_scripts/toast_content_script.js"] // Ensure this path is correct
        }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error injecting toast script for network error:", chrome.runtime.lastError.message);
            return;
          }
          chrome.tabs.sendMessage(data.tabId!, {
            type: "showToast",
            message: "Network error. Could not save bookmark.",
            level: "error"
          });
        });
    }
  }
}

// New listener for messages from content scripts (e.g., tag input script)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "getToken") {
    // Existing token logic
    getToken()
      .then((token) => sendResponse({ token }))
      .catch((error) => {
        console.error(
          "[Background service worker] Error getting token:",
          JSON.stringify(error)
        )
        sendResponse({ token: null })
      })
    return true // Respond asynchronously
  } else if (request.type === "saveBookmarkWithTags") {
    console.log("Received saveBookmarkWithTags message:", request)
    const bookmarkData: BookmarkData = {
      url: request.url,
      title: request.title,
      description: request.description,
      tags: request.tags,
      tabId: sender.tab?.id // Get tabId from the sender
    }
    saveBookmarkToRecallStack(bookmarkData)
    // No need to sendResponse if the content script doesn't expect one for this message
    return false // Indicate synchronous processing or no response
  }
  // Keep 'return true' for other async message handlers if any are added later
  // For now, if it's not 'getToken' or 'saveBookmarkWithTags', assume no async response needed from this listener.
  // If other messages were handled by a different listener, this might need adjustment.
  // The original listener only handled getToken, so this structure should be okay.
  // If the original listener needs to be preserved exactly, this new one for 'saveBookmarkWithTags'
  // could be a separate chrome.runtime.onMessage.addListener call, but generally, one is enough.
  // For simplicity, combining them here. If issues arise, can split.
  return false; // Default to not keeping the channel open if message not handled here.
})


// Function to inject the tag input content script
function injectTagInputScript(tab: chrome.tabs.Tab, selectionText?: string) {
  if (tab.id) {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ["content_scripts/tag_input_content_script.js"] // Adjust path after creating the file
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error injecting tag input script:",
            chrome.runtime.lastError.message
          )
          return
        }
        // Send current tab info to the content script after it's injected
        // This is important because the content script needs this info to send back
        chrome.tabs.sendMessage(tab.id!, {
          type: "initTagInput",
          url: tab.url,
          title: tab.title,
          selectionText: selectionText
        })
      }
    )
  } else {
    console.error("Tab ID is missing, cannot inject script.")
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log("Context menu clicked:", info, tab)
  if (info.menuItemId === "save-to-recall-stack" && tab) {
    // Instead of saving directly, inject the tag input script
    // Pass selectionText if available from context menu
    injectTagInputScript(tab, info.selectionText)
  }
})

chrome.commands.onCommand.addListener(async (command, tab) => {
  console.log("Command received:", command, "on tab:", tab)
  if (command === "save-to-recall-stack" && tab) {
    // Inject the tag input script. Selection text is not directly available here.
    // The content script could try to get it if needed, or we rely on context menu for selection.
    injectTagInputScript(tab)
  }
})
