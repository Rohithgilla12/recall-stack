import { createFileRoute, redirect } from "@tanstack/react-router";
import BookmarkDashboard from "../../bookmark-dashboard";

export const Route = createFileRoute("/bookmarks")({
  component: BookmarkDashboard,
  beforeLoad: async ({ context, location }) => {
    if (!context.userId) {
      // Redirect to the login page, and pass the original target URL
      // so Clerk can redirect back after successful login.
      throw redirect({
        to: "/login",
        search: {
          // Clerk typically uses 'redirect_url' for this purpose if configured
          // or you can handle it manually in the login page if needed.
          // For now, let's assume Clerk's <SignIn redirectUrl> handles post-login redirection.
          // If Clerk's <SignIn> is set to redirect to /bookmarks, this might be sufficient.
          // However, TanStack Router's redirect often benefits from knowing where to return.
          // Let's keep it simple and rely on Clerk's configuration for now.
          // If issues arise, we can pass `redirect_url: location.href` in search params.
        },
        // replace: true, // Optional: replace history entry
      });
    }
  },
});
