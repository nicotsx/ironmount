import { Database, HardDrive } from "lucide-react";
import { NavLink } from "react-router";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
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
		url: "/",
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
			<div className="bg-card-header border-b border-border/50 hidden md:inline-block" style={{ height: 65 }}></div>
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
													<NavLink to={item.url} end>
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
