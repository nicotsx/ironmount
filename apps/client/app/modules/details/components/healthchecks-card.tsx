import { formatDistanceToNow } from "date-fns";
import { HeartIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import type { Volume } from "~/lib/types";
import { cn } from "~/lib/utils";

type Props = {
	volume: Volume;
};

export const HealthchecksCard = ({ volume }: Props) => {
	const timeAgo = formatDistanceToNow(volume.lastHealthCheck, {
		addSuffix: true,
	});

	return (
		<Card className="flex-1 flex flex-col h-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<HeartIcon className="h-4 w-4" />
					Health Checks
				</CardTitle>
				<CardDescription>Monitor and automatically remount volumes on errors to ensure availability.</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col flex-1 justify-start">
					{volume.lastError && <span className="text-sm text-red-500 ">{volume.lastError}</span>}
					{volume.status === "mounted" && <span className="text-md text-emerald-500">Healthy</span>}
					{volume.status !== "unmounted" && (
						<span className="text-xs text-muted-foreground mb-4">Checked {timeAgo || "never"}</span>
					)}

					<span className="flex justify-between items-center gap-2">
						<span className="text-sm">Remount on error</span>
						<div
							className={cn(
								"flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
								Boolean(volume.autoRemount)
									? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
									: "border-muted bg-muted/40 text-muted-foreground dark:border-muted/60 dark:bg-muted/10",
							)}
						>
							<span>{volume.autoRemount ? "Enabled" : "Paused"}</span>
							<Switch checked={Boolean(volume.autoRemount)} onCheckedChange={() => {}} />
						</div>
					</span>
				</div>
				{volume.status !== "unmounted" && (
					<div className="flex justify-center">
						<Button variant="outline" className="mt-4 self-end">
							Run Health Check
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
