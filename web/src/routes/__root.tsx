import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"

import Header from "../components/Header"

import { ConvexAuthProvider } from "../integrations/convex/provider.tsx"

import TanStackQueryLayout from "../integrations/tanstack-query/layout.tsx"

import appCss from "../styles.css?url"

import type { QueryClient } from "@tanstack/react-query"

import { DefaultCatchBoundary } from "@/components/rs/default-catch-boundary.tsx"
import { NotFound } from "@/components/rs/not-found.tsx"
import type { TRPCRouter } from "@/integrations/trpc/router"
import { getAuth } from "@clerk/tanstack-react-start/server"
import type { ConvexQueryClient } from "@convex-dev/react-query"
import { createServerFn } from "@tanstack/react-start"
import { getWebRequest } from "@tanstack/react-start/server"
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query"
import type { ConvexReactClient } from "convex/react"

interface RsRouterContext {
	queryClient: QueryClient
	convexClient: ConvexReactClient
	convexQueryClient: ConvexQueryClient
	trpc: TRPCOptionsProxy<TRPCRouter>
}

const fetchClerkAuth = createServerFn({ method: "GET" }).handler(async () => {
	const auth = await getAuth(getWebRequest() as Request)
	const token = await auth.getToken({ template: "convex" })

	return {
		userId: auth.userId,
		token,
	}
})

export const Route = createRootRouteWithContext<RsRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "TanStack Start Starter",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),

	errorComponent: (props) => {
		return (
			<RootDocument>
				<DefaultCatchBoundary {...props} />
			</RootDocument>
		)
	},
	beforeLoad: async (ctx) => {
		const auth = await fetchClerkAuth()
		const { userId, token } = auth

		// During SSR only (the only time serverHttpClient exists),
		// set the Clerk auth token to make HTTP queries with.
		if (token) {
			ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)
		}

		return {
			userId,
			token,
		}
	},

	notFoundComponent: () => <NotFound />,

	component: () => (
		<RootDocument>
			<ConvexAuthProvider>
				<Header />

				<Outlet />
				<TanStackRouterDevtools />

				<TanStackQueryLayout />
			</ConvexAuthProvider>
		</RootDocument>
	),
})

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	)
}
