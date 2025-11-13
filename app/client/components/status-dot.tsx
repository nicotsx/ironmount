import type { VolumeStatus } from "~/client/lib/types";
import { cn } from "~/client/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export const StatusDot = ({ status }: { status: VolumeStatus }) => {
	const statusMapping = {
		mounted: {
			color: "bg-green-500",
			colorLight: "bg-emerald-400",
			animated: true,
		},
		unmounted: {
			color: "bg-gray-500",
			colorLight: "bg-gray-400",
			animated: false,
		},
		error: {
			color: "bg-red-500",
			colorLight: "bg-amber-700",
			animated: true,
		},
		unknown: {
			color: "bg-yellow-500",
			colorLight: "bg-yellow-400",
			animated: true,
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
					<span
						aria-label={status}
						className={cn("relative inline-flex size-3 rounded-full", `${statusMapping.color}`)}
					/>
				</span>
			</TooltipTrigger>
			<TooltipContent>
				<p className="capitalize">{status}</p>
			</TooltipContent>
		</Tooltip>
	);
};
