import { createRouter as createTanstackRouter } from "@tanstack/react-router"
import { routerWithQueryClient } from "@tanstack/react-router-with-query"
import * as TanstackQuery from "./integrations/tanstack-query/root-provider"

// Import the generated route tree
import { routeTree } from "./routeTree.gen"

import { ConvexQueryClient } from "@convex-dev/react-query"
import {
	MutationCache,
	QueryClient,
	notifyManager,
} from "@tanstack/react-query"
import { ConvexReactClient } from "convex/react"
import "./styles.css"

// Create a new router instance
export const createRouter = () => {
	if (typeof document !== "undefined") {
		notifyManager.setScheduler(window.requestAnimationFrame)
	}

	const CONVEX_URL = import.meta.env.VITE_CONVEX_URL
	if (!CONVEX_URL) {
		console.error("missing envar CONVEX_URL")
	}

	const convex = new ConvexReactClient(CONVEX_URL, {
		unsavedChangesWarning: false,
	})

	const convexQueryClient = new ConvexQueryClient(CONVEX_URL)

	const queryClient: QueryClient = new QueryClient({
		defaultOptions: {
			queries: {
				queryKeyHashFn: convexQueryClient.hashFn(),
				queryFn: convexQueryClient.queryFn(),
			},
		},
		mutationCache: new MutationCache({
			onError: (error) => {
				console.error(error)
			},
		}),
	})

	convexQueryClient.connect(queryClient)

	const router = routerWithQueryClient(
		createTanstackRouter({
			routeTree,
			context: {
				...TanstackQuery.getContext(),
				convexClient: convex,
				convexQueryClient,
			},
			scrollRestoration: true,
			defaultPreloadStaleTime: 0,

			Wrap: (props: { children: React.ReactNode }) => {
				return <TanstackQuery.Provider>{props.children}</TanstackQuery.Provider>
			},
		}),
		TanstackQuery.getContext().queryClient,
	)

	return router
}

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof createRouter>
	}
}
