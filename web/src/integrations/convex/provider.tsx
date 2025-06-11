import { ClerkProvider, useAuth } from "@clerk/tanstack-react-start"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import type { ReactNode } from "react"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

export function ConvexAuthProvider({ children }: { children: ReactNode }) {
	return (
		<ClerkProvider publishableKey={clerkPubKey}>
			<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
				{children}
			</ConvexProviderWithClerk>
		</ClerkProvider>
	)
}
