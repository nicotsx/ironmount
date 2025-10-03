import { Link } from "react-router";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { useBreadcrumbs } from "~/lib/breadcrumbs";
import { cn } from "../lib/utils";

export function AppBreadcrumb() {
	const breadcrumbs = useBreadcrumbs();

	return (
		<Breadcrumb>
			<BreadcrumbLink asChild></BreadcrumbLink>
			<BreadcrumbList>
				{breadcrumbs.length === 1 && (
					<BreadcrumbItem>
						<Link to="/">Ironmount</Link>
					</BreadcrumbItem>
				)}
				{breadcrumbs.map((breadcrumb, index) => {
					const isLast = index === breadcrumbs.length - 1;

					return (
						<div key={`${breadcrumb.label}-${index}`} className="contents">
							<BreadcrumbItem className={cn({ invisible: breadcrumbs.length <= 1 })}>
								{isLast || breadcrumb.isCurrentPage ? (
									<BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
								) : breadcrumb.href ? (
									<BreadcrumbLink asChild>
										<Link to={breadcrumb.href}>{breadcrumb.label}</Link>
									</BreadcrumbLink>
								) : (
									<BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
								)}
							</BreadcrumbItem>
							{!isLast && <BreadcrumbSeparator />}
						</div>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
