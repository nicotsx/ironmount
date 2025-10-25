import { useMutation } from "@tanstack/react-query";
import { LifeBuoy } from "lucide-react";
import { Outlet, useNavigate } from "react-router";
import { toast } from "sonner";
import { logoutMutation } from "~/api-client/@tanstack/react-query.gen";
import { appContext } from "~/context";
import { authMiddleware } from "~/middleware/auth";
import type { Route } from "./+types/layout";
import { AppBreadcrumb } from "./app-breadcrumb";
import { GridBackground } from "./grid-background";
import { Button } from "./ui/button";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { AppSidebar } from "./app-sidebar";

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
			toast.error("Logout failed", { description: error.message });
		},
	});

	return (
		<SidebarProvider defaultOpen={false}>
			<AppSidebar />
			<GridBackground>
				<header className="bg-card-header border-b border-border/50">
					<div className="flex items-center justify-between py-3 sm:py-4 px-2 sm:px-8 mx-auto">
						<div className="flex items-center gap-4">
							<SidebarTrigger />
							<AppBreadcrumb />
						</div>
						{loaderData.user && (
							<div className="flex items-center gap-4">
								<span className="text-sm text-muted-foreground hidden md:inline-flex">
									Welcome,&nbsp;
									<span className="text-strong-accent">{loaderData.user?.username}</span>
								</span>
								<Button variant="default" size="sm" onClick={() => logout.mutate({})} loading={logout.isPending}>
									Logout
								</Button>
								<Button variant="default" size="sm" className="relative overflow-hidden hidden lg:inline-flex">
									<a
										href="https://github.com/nicotsx/ironmount/issues/new"
										target="_blank"
										rel="noreferrer"
										className="flex items-center gap-2"
									>
										<span className="flex items-center gap-2">
											<LifeBuoy />
											<span>Report an issue</span>
										</span>
									</a>
								</Button>
							</div>
						)}
					</div>
				</header>
				<main className="flex flex-col p-2 pt-2 sm:p-8 sm:pt-6 mx-auto">
					<Outlet />
				</main>
			</GridBackground>
		</SidebarProvider>
	);
}
