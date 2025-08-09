# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Plasmo-based Chrome extension for the Recall Stack application. The extension allows users to save bookmarks from their browser to the Recall Stack backend service, with authentication handled through Clerk.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server with hot reload
pnpm dev

# Build production bundle
pnpm build

# Package extension for distribution
pnpm package
```

## Architecture

### Core Technologies
- **Plasmo Framework**: Chrome extension framework providing hot reload, TypeScript support, and manifest generation
- **React 18.2**: UI components for popup and content scripts
- **Clerk Authentication**: User authentication and session management
- **Tailwind CSS**: Styling with custom Plasmo-prefixed classes
- **React Router**: Navigation within the popup interface

### Key Components

1. **Background Worker** (`src/background/index.ts`):
   - Manages Clerk authentication tokens
   - Handles context menu for "Save to Recall Stack"
   - Processes keyboard shortcuts (Ctrl/Cmd+Shift+S)
   - Communicates with backend API at `http://localhost:3000/api/bookmarks`
   - Sends toast notifications to content scripts

2. **Popup Interface** (`src/popup/`):
   - Memory-based routing with React Router
   - Authentication flow (sign-in, sign-up)
   - Settings page
   - Protected routes with Clerk's SignedIn/SignedOut components

3. **Content Script** (`src/content.tsx`):
   - Injects on all URLs (`<all_urls>`)
   - Displays toast notifications from background worker
   - Handles Shadow DOM styling with rem-to-px conversion

### Environment Variables

Required in `.env.development`:
- `PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk authentication key
- `PLASMO_PUBLIC_CLERK_SYNC_HOST`: Clerk sync host URL
- `CLERK_FRONTEND_API`: Clerk frontend API URL
- `CRX_PUBLIC_KEY`: Chrome extension public key

### Extension Permissions

The manifest includes:
- `cookies`, `storage`: For session management
- `activeTab`: For accessing current tab information
- `contextMenus`: For right-click menu integration
- `commands`: For keyboard shortcuts
- Host permissions for localhost, Clerk domains, and all HTTPS sites

### Build Output

Development builds are created in `build/chrome-mv3-dev/` and should be loaded as an unpacked extension in Chrome for testing.

## Key Implementation Details

1. **Toast System**: Background worker communicates with content scripts via `chrome.runtime.onMessage` to display success/error toasts.

2. **Bookmark Saving**: The `saveBookmarkToRecallStack` function handles:
   - Authentication check via Clerk token
   - URL and title extraction from tab/context data
   - POST request to backend API with Bearer token
   - Error handling with user-friendly toast messages

3. **Shadow DOM Styling**: Content script converts rem units to pixels to ensure consistent styling within the Shadow DOM environment.

4. **Routing**: Uses memory router (not browser router) as required for Chrome extension popups.