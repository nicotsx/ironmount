import { cn } from "~/client/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/client/components/ui/tooltip";

type BackupStatus = "active" | "paused" | "error" | "in_progress";

export const BackupStatusDot = ({
	enabled,
	hasError,
	isInProgress,
}: {
	enabled: boolean;
	hasError?: boolean;
	isInProgress?: boolean;
}) => {
	let status: BackupStatus = "paused";
	if (isInProgress) {
		status = "in_progress";
	} else if (hasError) {
		status = "error";
	} else if (enabled) {
		status = "active";
	}

	const statusMapping = {
		active: {
			color: "bg-green-500",
			colorLight: "bg-emerald-400",
			animated: true,
			label: "Active",
		},
		paused: {
			color: "bg-gray-500",
			colorLight: "bg-gray-400",
			animated: false,
			label: "Paused",
		},
		error: {
			color: "bg-red-500",
			colorLight: "bg-red-400",
			animated: true,
			label: "Error",
		},
		in_progress: {
			color: "bg-blue-500",
			colorLight: "bg-blue-400",
			animated: true,
			label: "Backup in progress",
		},
	}[status];

	return (
		<Tooltip>
			<TooltipTrigger>
				<span className="relative flex size-3 mx-auto">
					{statusMapping.animated && (
						<span
							className={cn(
								"absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
								`${statusMapping.colorLight}`,
							)}
						/>
					)}
					<span className={cn("relative inline-flex size-3 rounded-full", `${statusMapping.color}`)} />
				</span>
			</TooltipTrigger>
			<TooltipContent>
				<p>{statusMapping.label}</p>
			</TooltipContent>
		</Tooltip>
	);
};
