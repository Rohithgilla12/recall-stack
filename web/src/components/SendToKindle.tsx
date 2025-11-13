import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useConvexAction, useConvexQuery } from "@convex-dev/react-query"
import { useMutation } from "@tanstack/react-query"
import { api } from "convex/_generated/api"
import type { Id } from "convex/_generated/dataModel"
import { BookOpen, Loader2, Send } from "lucide-react"
import React, { useState } from "react"

interface SendToKindleProps {
	selectedBookmarkIds: Id<"bookmarks">[]
	onSuccess?: () => void
}

export function SendToKindle({
	selectedBookmarkIds,
	onSuccess,
}: SendToKindleProps) {
	const [open, setOpen] = useState(false)
	const [digestTitle, setDigestTitle] = useState("")
	const [isSending, setIsSending] = useState(false)

	// Check if Kindle is configured
	const { data: settings } = useConvexQuery(
		api.userSettings.getUserSettings,
		{},
	)

	// Send digest action
	const sendDigest = useConvexAction(api.kindle.sendDigestEmail)

	const handleSend = async () => {
		if (selectedBookmarkIds.length === 0) {
			alert("Please select at least one bookmark to send")
			return
		}

		if (!settings?.kindleEmail) {
			alert("Please configure your Kindle email in settings first")
			return
		}

		setIsSending(true)
		try {
			const result = await sendDigest({
				bookmarkIds: selectedBookmarkIds,
				digestTitle: digestTitle || undefined,
			})

			if (result.success) {
				alert(
					`Successfully sent ${result.bookmarkCount} ${result.bookmarkCount === 1 ? "article" : "articles"} to your Kindle!`,
				)
				setOpen(false)
				setDigestTitle("")
				onSuccess?.()
			}
		} catch (error) {
			console.error("Failed to send digest:", error)
			alert(
				`Failed to send to Kindle: ${error instanceof Error ? error.message : "Unknown error"}`,
			)
		} finally {
			setIsSending(false)
		}
	}

	const isDisabled =
		selectedBookmarkIds.length === 0 ||
		!settings?.kindleEmail ||
		!settings?.isKindleEnabled

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="default"
					size="sm"
					disabled={isDisabled}
					title={
						!settings?.kindleEmail
							? "Configure Kindle email in settings first"
							: selectedBookmarkIds.length === 0
								? "Select bookmarks to send"
								: "Send selected bookmarks to Kindle"
					}
				>
					<Send className="mr-2 h-4 w-4" />
					Send to Kindle ({selectedBookmarkIds.length})
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Send to Kindle</DialogTitle>
					<DialogDescription>
						Send {selectedBookmarkIds.length}{" "}
						{selectedBookmarkIds.length === 1 ? "article" : "articles"} to your
						Kindle at {settings?.kindleEmail}
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="digest-title">
							Digest Title <span className="text-muted-foreground">(optional)</span>
						</Label>
						<Input
							id="digest-title"
							placeholder="My Reading Digest"
							value={digestTitle}
							onChange={(e) => setDigestTitle(e.target.value)}
							disabled={isSending}
						/>
						<p className="text-xs text-muted-foreground">
							Leave empty to use default title with today's date
						</p>
					</div>

					<div className="rounded-lg bg-muted p-3 text-sm">
						<p className="font-medium mb-1">What will be sent:</p>
						<ul className="text-xs text-muted-foreground space-y-1">
							<li>• Article titles and summaries</li>
							<li>• Full cleaned content for easy reading</li>
							<li>• Formatted for optimal Kindle display</li>
						</ul>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)} disabled={isSending}>
						Cancel
					</Button>
					<Button onClick={handleSend} disabled={isSending}>
						{isSending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Sending...
							</>
						) : (
							<>
								<BookOpen className="mr-2 h-4 w-4" />
								Send to Kindle
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
