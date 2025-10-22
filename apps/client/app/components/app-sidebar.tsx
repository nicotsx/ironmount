import { Database, HardDrive, Mountain } from "lucide-react";
import { Link, NavLink } from "react-router";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "~/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

const items = [
	{
		title: "Volumes",
		url: "/volumes",
		icon: HardDrive,
	},
	{
		title: "Repositories",
		url: "/repositories",
		icon: Database,
	},
];

export function AppSidebar() {
	const { state } = useSidebar();

	return (
		<Sidebar variant="inset" collapsible="icon" className="p-0">
			<SidebarHeader className="bg-card-header border-b border-border/50 hidden md:flex h-[65px] flex-row items-center p-4">
				<Link to="/volumes" className="flex items-center gap-3 font-semibold">
					<Mountain className="size-5 text-strong-accent ml-[6px]" />
					<span
						className={cn(
							"text-base transition-opacity duration-200",
							state === "collapsed" && "opacity-0 w-0 overflow-hidden",
						)}
					>
						Ironmount
					</span>
				</Link>
			</SidebarHeader>
			<SidebarContent className="p-2 border-r">
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<SidebarMenuButton asChild>
													<NavLink to={item.url}>
														{({ isActive }) => (
															<>
																<item.icon className={cn({ "text-strong-accent": isActive })} />
																<span className={cn({ "text-strong-accent": isActive })}>{item.title}</span>
															</>
														)}
													</NavLink>
												</SidebarMenuButton>
											</TooltipTrigger>
											<TooltipContent side="right" className={cn({ hidden: state !== "collapsed" })}>
												<p>{item.title}</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
