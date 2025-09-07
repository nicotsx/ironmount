import { ScanHeartIcon } from "lucide-react";
import type { GetVolumeResponse } from "~/api-client";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";

type Props = {
	volume: GetVolumeResponse;
};

export const HealthchecksCard = ({ volume }: Props) => {
	return (
		<Card className="p-6 flex-1 flex flex-col">
			<div className="flex flex-col flex-1 justify-start">
				<span className="flex items-center gap-2 mb-4">
					<ScanHeartIcon size={24} />
					<h2 className="text-lg font-medium">Health Checks</h2>
				</span>
				<span className="">Status: {volume.status ?? "Unknown"}</span>
				<span className="text-sm text-muted-foreground mb-4">
					Last checked: {new Date(volume.lastHealthCheck).toLocaleString()}
				</span>
				<span className="flex items-center">
					Enable auto remount
					<Switch className="ml-auto cursor-pointer" checked={volume.autoRemount} />
				</span>
			</div>
			<Button variant="outline">Run Health Check</Button>
		</Card>
	);
};
