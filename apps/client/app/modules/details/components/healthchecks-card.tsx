import { formatDistanceToNow } from "date-fns";
import { HeartIcon } from "lucide-react";
import { OnOff } from "~/components/onoff";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { Volume } from "~/lib/types";

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
						<OnOff isOn={volume.autoRemount} toggle={() => {}} enabledLabel="Enabled" disabledLabel="Paused" />
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
