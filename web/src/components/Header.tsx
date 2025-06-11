import { Link } from "@tanstack/react-router"

import { Bookmark } from "lucide-react"
import ClerkHeader from "../integrations/clerk/header-user.tsx"

export default function Header() {
	return (
		<header className="p-2 flex gap-2 bg-white text-black justify-between">
			<nav className="flex flex-row">
				<div className="px-2 font-bold">
					<Link to="/">
						<div className="flex items-center space-x-2">
							<Bookmark className="h-8 w-8 text-blue-600" />
							<h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
								Recall Stack
							</h1>
						</div>
					</Link>
				</div>

				<div className="px-2 font-bold">
					<Link to="/demo/clerk">Clerk</Link>
				</div>

				<div className="px-2 font-bold">
					<Link to="/demo/convex">Convex</Link>
				</div>

				<div className="px-2 font-bold">
					<Link to="/demo/form/simple">Simple Form</Link>
				</div>

				<div className="px-2 font-bold">
					<Link to="/demo/form/address">Address Form</Link>
				</div>

				<div className="px-2 font-bold">
					<Link to="/demo/start/server-funcs">Start - Server Functions</Link>
				</div>

				<div className="px-2 font-bold">
					<Link to="/demo/start/api-request">Start - API Request</Link>
				</div>

				<div className="px-2 font-bold">
					<Link to="/demo/store">Store</Link>
				</div>

				<div className="px-2 font-bold">
					<Link to="/demo/table">TanStack Table</Link>
				</div>

				<div className="px-2 font-bold">
					<Link to="/demo/tanstack-query">TanStack Query</Link>
				</div>
			</nav>

			<div>
				<ClerkHeader />
			</div>
		</header>
	)
}
