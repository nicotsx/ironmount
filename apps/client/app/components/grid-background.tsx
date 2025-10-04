import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

interface GridBackgroundProps {
	children: ReactNode;
	className?: string;
	containerClassName?: string;
}

export function GridBackground({ children, className, containerClassName }: GridBackgroundProps) {
	return (
		<div
			className={cn(
				"relative min-h-dvh w-full overflow-x-hidden",
				"[background-size:20px_20px] sm:[background-size:40px_40px]",
				"[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
				"dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
				containerClassName,
			)}
		>
			<div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-card" />
			<div className={cn("relative h-screen", className)}>{children}</div>
		</div>
	);
}
