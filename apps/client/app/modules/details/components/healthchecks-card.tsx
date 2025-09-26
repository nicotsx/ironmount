import { formatDistanceToNow } from "date-fns";
import { ScanHeartIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
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
		<Card className="p-6 flex-1 flex flex-col h-full">
			<div className="flex flex-col flex-1 justify-start">
				<span className="flex items-center gap-2 mb-4">
					<ScanHeartIcon className="h-4 w-4" />
					<h2 className="text-lg font-medium">Health Checks</h2>
				</span>
				{volume.lastError && <span className="text-md text-amber-600 ">{volume.lastError}</span>}
				{volume.status === "mounted" && <span className="text-md text-emerald-500">Healthy</span>}
				{volume.status !== "unmounted" && (
					<span className="text-xs text-muted-foreground mb-4">Checked {timeAgo || "never"}</span>
				)}

				<span className="flex justify-between items-center gap-2">
					Remount on error
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
			<Button variant="outline">Run Health Check</Button>
		</Card>
	);
};
