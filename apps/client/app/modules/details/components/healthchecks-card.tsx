import { formatDistanceToNow } from "date-fns";
import { ScanHeartIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import type { Volume } from "~/lib/types";

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
				{volume.lastError && <span className="text-md text-red-600 ">{volume.lastError}</span>}
				{volume.status === "mounted" && <span className="text-md text-green-600">Healthy</span>}
				{volume.status !== "unmounted" && (
					<span className="text-xs text-muted-foreground mb-4">Checked {timeAgo || "never"}</span>
				)}
				<span className="flex items-center gap-2">
					Remount on error
					<Switch className="ml-auto cursor-pointer" checked={Boolean(volume.autoRemount)} />
				</span>
			</div>
			<Button variant="outline">Run Health Check</Button>
		</Card>
	);
};
