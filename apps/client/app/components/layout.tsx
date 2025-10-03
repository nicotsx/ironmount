import { useMutation } from "@tanstack/react-query";
import { Outlet, useNavigate } from "react-router";
import { toast } from "sonner";
import { logoutMutation } from "~/api-client/@tanstack/react-query.gen";
import { appContext } from "~/context";
import { cn } from "~/lib/utils";
import { authMiddleware } from "~/middleware/auth";
import type { Route } from "./+types/layout";
import { AppBreadcrumb } from "./app-breadcrumb";
import { Button } from "./ui/button";

export const clientMiddleware = [authMiddleware];

export async function clientLoader({ context }: Route.LoaderArgs) {
	const ctx = context.get(appContext);
	return ctx;
}

export default function Layout({ loaderData }: Route.ComponentProps) {
	const navigate = useNavigate();

	const logout = useMutation({
		...logoutMutation(),
		onSuccess: async () => {
			navigate("/login", { replace: true });
		},
		onError: (error) => {
			console.error(error);
			toast.error("Logout failed");
		},
	});

	return (
		<div
			className={cn(
				"relative min-h-dvh w-full overflow-x-hidden",
				"[background-size:20px_20px] sm:[background-size:40px_40px]",
				"[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
				"dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
			)}
		>
			<div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-card"></div>
			<header className="relative bg-card-header border-b border-border/50">
				<div className="flex items-center justify-between py-3 sm:py-4 px-2 sm:px-4 container mx-auto">
					<AppBreadcrumb />
					{loaderData.user && (
						<div className="flex items-center gap-4">
							<span className="text-sm text-muted-foreground">
								Welcome, <span className="text-strong-accent">{loaderData.user?.username}</span>
							</span>
							<Button variant="outline" size="sm" onClick={() => logout.mutate({})} loading={logout.isPending}>
								Logout
							</Button>
						</div>
					)}
				</div>
			</header>
			<main className="relative flex flex-col pt-4 sm:pt-8 px-2 sm:px-4 pb-4 container mx-auto">
				<Outlet />
			</main>
		</div>
	);
}
