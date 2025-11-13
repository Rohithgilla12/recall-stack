import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { api } from "convex/_generated/api"
import { BookOpen, Loader2 } from "lucide-react"
import React, { useEffect, useState } from "react"

export function KindleSettings() {
	const [open, setOpen] = useState(false)
	const [kindleEmail, setKindleEmail] = useState("")
	const [frequency, setFrequency] = useState<
		"manual" | "daily" | "weekly" | "monthly"
	>("manual")
	const [isEnabled, setIsEnabled] = useState(true)

	// Query user settings
	const { data: settings, isLoading } = useConvexQuery(
		api.userSettings.getUserSettings,
		{},
	)

	// Mutations
	const updateEmailMutation = useConvexMutation(
		api.userSettings.updateKindleEmail,
	)
	const updateFrequencyMutation = useConvexMutation(
		api.userSettings.updateDigestFrequency,
	)
	const toggleEnabledMutation = useConvexMutation(
		api.userSettings.toggleKindleEnabled,
	)

	// Update form when settings load
	useEffect(() => {
		if (settings) {
			setKindleEmail(settings.kindleEmail || "")
			setFrequency(settings.digestFrequency || "manual")
			setIsEnabled(settings.isKindleEnabled ?? true)
		}
	}, [settings])

	const handleSaveEmail = async () => {
		if (!kindleEmail) return

		try {
			await updateEmailMutation.mutateAsync({ kindleEmail })
			alert("Kindle email saved successfully!")
		} catch (error) {
			console.error("Failed to save Kindle email:", error)
			alert(
				`Failed to save email: ${error instanceof Error ? error.message : "Unknown error"}`,
			)
		}
	}

	const handleUpdateFrequency = async (
		newFrequency: "manual" | "daily" | "weekly" | "monthly",
	) => {
		try {
			await updateFrequencyMutation.mutateAsync({ frequency: newFrequency })
			setFrequency(newFrequency)
		} catch (error) {
			console.error("Failed to update frequency:", error)
			alert(
				`Failed to update frequency: ${error instanceof Error ? error.message : "Unknown error"}`,
			)
		}
	}

	const handleToggleEnabled = async (enabled: boolean) => {
		try {
			await toggleEnabledMutation.mutateAsync({ enabled })
			setIsEnabled(enabled)
		} catch (error) {
			console.error("Failed to toggle Kindle:", error)
			alert(
				`Failed to toggle Kindle: ${error instanceof Error ? error.message : "Unknown error"}`,
			)
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<BookOpen className="mr-2 h-4 w-4" />
					Kindle Settings
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[525px]">
				<DialogHeader>
					<DialogTitle>Kindle Settings</DialogTitle>
					<DialogDescription>
						Configure your Kindle email to receive article digests directly to
						your Kindle device.
					</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin" />
					</div>
				) : (
					<div className="grid gap-6 py-4">
						{/* Enable/Disable Toggle */}
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label htmlFor="enabled">Enable Kindle Integration</Label>
								<p className="text-sm text-muted-foreground">
									Turn Kindle digest delivery on or off
								</p>
							</div>
							<Switch
								id="enabled"
								checked={isEnabled}
								onCheckedChange={handleToggleEnabled}
							/>
						</div>

						{/* Kindle Email */}
						<div className="grid gap-2">
							<Label htmlFor="kindle-email">
								Kindle Email Address
								<span className="text-muted-foreground text-xs ml-2">
									(e.g., username@kindle.com)
								</span>
							</Label>
							<div className="flex gap-2">
								<Input
									id="kindle-email"
									type="email"
									placeholder="your-kindle@kindle.com"
									value={kindleEmail}
									onChange={(e) => setKindleEmail(e.target.value)}
									disabled={!isEnabled}
								/>
								<Button
									onClick={handleSaveEmail}
									disabled={!kindleEmail || !isEnabled}
								>
									Save
								</Button>
							</div>
							<p className="text-xs text-muted-foreground">
								Find your Kindle email at{" "}
								<a
									href="https://www.amazon.com/hz/mycd/digital-console/contentlist/booksAll/dateDsc/"
									target="_blank"
									rel="noopener noreferrer"
									className="underline"
								>
									Amazon Content & Devices
								</a>
							</p>
						</div>

						{/* Digest Frequency */}
						<div className="grid gap-2">
							<Label htmlFor="frequency">Digest Frequency</Label>
							<Select
								value={frequency}
								onValueChange={(value) =>
									handleUpdateFrequency(
										value as "manual" | "daily" | "weekly" | "monthly",
									)
								}
								disabled={!isEnabled || !settings?.kindleEmail}
							>
								<SelectTrigger id="frequency">
									<SelectValue placeholder="Select frequency" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="manual">
										Manual (Send when you choose)
									</SelectItem>
									<SelectItem value="daily">Daily</SelectItem>
									<SelectItem value="weekly">Weekly</SelectItem>
									<SelectItem value="monthly">Monthly</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								{frequency === "manual"
									? "You'll manually select articles to send"
									: `A digest will be sent ${frequency} with your new bookmarks`}
							</p>
						</div>

						{/* Setup Instructions */}
						<div className="rounded-lg bg-muted p-4 space-y-2">
							<h4 className="text-sm font-medium">Setup Instructions:</h4>
							<ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
								<li>
									Find your Kindle email address in your Amazon account settings
								</li>
								<li>Enter your Kindle email above and click Save</li>
								<li>
									Add{" "}
									<code className="px-1 py-0.5 rounded bg-background">
										noreply@recallstack.app
									</code>{" "}
									to your{" "}
									<a
										href="https://www.amazon.com/hz/mycd/myx#/home/settings/payment"
										target="_blank"
										rel="noopener noreferrer"
										className="underline"
									>
										approved email list
									</a>
								</li>
								<li>
									Select bookmarks and click "Send to Kindle" to create a digest
								</li>
							</ol>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}
