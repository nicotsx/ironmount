import { cn } from "~/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";

type BackupStatus = "active" | "paused" | "error";

export const BackupStatusDot = ({ enabled, hasError }: { enabled: boolean; hasError?: boolean }) => {
	let status: BackupStatus = "paused";
	if (hasError) {
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
