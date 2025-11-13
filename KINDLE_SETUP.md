# Kindle Email Integration Setup Guide

This guide explains how to set up and use the Kindle email digest feature in Recall Stack.

## Overview

The Kindle integration allows you to send your saved bookmarks/articles as formatted digests directly to your Kindle device or Kindle app. Articles are sent as HTML emails that are automatically converted to Kindle format by Amazon.

## Features

- 📧 Send bookmarks to your Kindle email address
- 📚 Select single or multiple articles
- 📅 Configure digest frequency (manual, daily, weekly, monthly)
- ✨ Cleaned and formatted content optimized for reading
- 📝 Includes summaries and full article content
- 🎨 Beautiful HTML formatting for Kindle display

## Setup Instructions

### 1. Get a Resend API Key

Resend is the email provider used for sending digests. It has a generous free tier (3,000 emails/month).

1. Sign up at [resend.com](https://resend.com)
2. Create an API key from your dashboard
3. (Optional but recommended) Add and verify your custom domain for better deliverability

### 2. Configure Convex Environment Variables

Add the following environment variables to your Convex deployment:

```bash
# Navigate to your Convex dashboard or use the CLI
npx convex env set RESEND_API_KEY "re_xxxxxxxxxxxxx"
```

Or add it in the [Convex Dashboard](https://dashboard.convex.dev):
- Go to your project settings
- Navigate to "Environment Variables"
- Add `RESEND_API_KEY` with your Resend API key

### 3. Update Email Sender Domain (Optional)

By default, emails are sent from `noreply@recallstack.app`. If you have a custom domain verified with Resend:

1. Open `/web/convex/kindle.ts`
2. Update line ~213:
   ```typescript
   from: "Recall Stack <noreply@your-domain.com>", // Update this
   ```

### 4. Configure Amazon Kindle Email Settings

#### Find Your Kindle Email Address

1. Go to [Amazon Content & Devices](https://www.amazon.com/hz/mycd/digital-console/contentlist/booksAll/dateDsc/)
2. Click "Preferences" tab
3. Scroll to "Personal Document Settings"
4. Find your Kindle email (e.g., `username_123@kindle.com`)

#### Add Approved Email Address

To receive emails on your Kindle, you must approve the sender:

1. In "Personal Document Settings"
2. Scroll to "Approved Personal Document E-mail List"
3. Click "Add a new approved e-mail address"
4. Add one of:
   - `noreply@recallstack.app` (if using default)
   - `noreply@your-domain.com` (if using custom domain)

**Important:** Amazon will reject emails from non-approved addresses!

### 5. Configure Kindle Settings in Recall Stack

1. Open the Recall Stack dashboard
2. Click "Kindle Settings" button in the header
3. Enter your Kindle email address (e.g., `username_123@kindle.com`)
4. Choose your digest frequency:
   - **Manual**: Send digests only when you explicitly choose
   - **Daily**: Automatic daily digest of new bookmarks
   - **Weekly**: Weekly digest every Monday
   - **Monthly**: Monthly digest on the 1st
5. Toggle "Enable Kindle Integration" to ON

## How to Use

### Sending Articles to Kindle

1. **Select Bookmarks**:
   - Click the checkbox icon in the top-left corner of any bookmark card
   - Selected bookmarks will show a blue checkmark
   - Select as many as you want

2. **Send to Kindle**:
   - Click "Send to Kindle" button in the header
   - The button shows the number of selected articles
   - (Optional) Enter a custom digest title
   - Click "Send to Kindle" in the dialog

3. **Receive on Kindle**:
   - Check your Kindle device or app
   - The digest will appear in your library within a few minutes
   - Syncs automatically to all your Kindle devices

### Manual vs Scheduled Digests

#### Manual Mode (Default)
- You select which articles to send
- Full control over what goes to your Kindle
- Best for curated reading lists

#### Scheduled Mode (Daily/Weekly/Monthly)
- Automatically sends new bookmarks since last digest
- No manual selection needed
- Great for staying up-to-date with saved content

## Email Format

Each digest includes:

### Header
- Custom or auto-generated title (e.g., "Recall Stack Digest - December 15, 2024")
- Article count
- Date sent

### For Each Article
- **Title**: Prominently displayed
- **Source URL**: Linked for reference
- **Summary**: AI-generated 2-3 sentence summary (if available)
- **Content**: Full cleaned article text, properly formatted

### Footer
- Link to Kindle library
- Sent from Recall Stack branding

## Troubleshooting

### Email Not Received

**Check Amazon approval list:**
- Ensure sender email is in "Approved Personal Document E-mail List"
- Verify you used the correct sender domain

**Check Resend dashboard:**
- Go to [Resend Emails](https://resend.com/emails)
- Check if email was sent successfully
- Review any error messages

**Verify Kindle email:**
- Double-check the Kindle email address in settings
- Ensure it's the Send-to-Kindle email (ends with `@kindle.com`)

### Email Received but Can't Open

- Amazon converts HTML to Kindle format automatically
- If conversion fails, the file size might be too large
- Try sending fewer articles (5-10 at a time recommended)

### "Kindle email not configured" Error

- Open Kindle Settings dialog
- Enter your Kindle email address
- Click "Save"
- Try sending again

### "RESEND_API_KEY not configured" Error

- Add the `RESEND_API_KEY` environment variable to Convex
- Redeploy your Convex functions: `npx convex dev`
- Try again

## Rate Limits & Costs

### Resend Free Tier
- **3,000 emails/month** free
- After that: **$20/month for 50,000 emails**
- Very generous for personal use

### Amazon Kindle Limits
- **50 MB** maximum attachment size per email
- **25 documents** per day maximum
- No cost for personal document delivery

## Best Practices

1. **Batch Your Sends**: Select 5-10 articles at a time for optimal reading experience
2. **Use Summaries**: Enable AI summaries for quick article overviews
3. **Archive After Reading**: Mark articles as archived to keep your library organized
4. **Custom Titles**: Use descriptive digest titles for easy identification
5. **Test First**: Send a single article first to verify everything works

## Privacy & Security

- **Email Content**: Sent via encrypted HTTPS to Resend
- **Resend**: SOC 2 Type II certified, GDPR compliant
- **Amazon**: Standard Kindle document delivery security
- **API Keys**: Stored securely in Convex environment variables
- **No Tracking**: We don't track what you read or when

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Verify all setup steps are completed
3. Check Resend and Convex dashboards for errors
4. Review browser console for JavaScript errors
5. Open an issue on GitHub with error details

## Future Enhancements

Planned features:
- [ ] EPUB format support (better than HTML for Kindle)
- [ ] Send to multiple Kindle devices
- [ ] Scheduled digest time selection
- [ ] Digest templates and customization
- [ ] Article length filtering
- [ ] Reading progress tracking

## Technical Details

### Architecture

```
User selects bookmarks
    ↓
SendToKindle component
    ↓
Convex action: sendDigestEmail
    ↓
Query: getBookmarksForDigest (fetches content)
    ↓
Format HTML for Kindle
    ↓
Resend API: send email
    ↓
Amazon Kindle: convert & deliver
    ↓
User's Kindle device/app
```

### Files Modified/Added

- `/web/convex/schema.ts` - Added `userSettings` table
- `/web/convex/userSettings.ts` - User settings mutations/queries
- `/web/convex/kindle.ts` - Email sending and digest logic
- `/web/src/components/KindleSettings.tsx` - Settings UI
- `/web/src/components/SendToKindle.tsx` - Send digest UI
- `/web/src/lib/bookmark-store.ts` - Bookmark selection state
- `/web/bookmark-dashboard.tsx` - Integrated Kindle UI
- `/web/package.json` - Added `resend` dependency

### Database Schema

```typescript
userSettings: {
  userId: Id<"users">
  kindleEmail?: string
  digestFrequency?: "manual" | "daily" | "weekly" | "monthly"
  digestTime?: string // HH:MM format
  lastDigestSent?: number // timestamp
  isKindleEnabled?: boolean
}
```

## Credits

- **Email Service**: [Resend](https://resend.com)
- **Backend**: [Convex](https://convex.dev)
- **Content Delivery**: Amazon Kindle

---

Enjoy reading your saved articles on Kindle! 📚✨
