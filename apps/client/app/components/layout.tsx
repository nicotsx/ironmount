import { Outlet } from "react-router";
import { cn } from "~/lib/utils";
import { AppBreadcrumb } from "./app-breadcrumb";

export default function Layout() {
	return (
		<div
			className={cn(
				"relative min-h-dvh w-full",
				"[background-size:40px_40px]",
				"[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
				"dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
			)}
		>
			<div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black"></div>
			<main className="relative flex flex-col pt-8 p-4 container mx-auto">
				<AppBreadcrumb />
				<Outlet />
			</main>
		</div>
	);
}
