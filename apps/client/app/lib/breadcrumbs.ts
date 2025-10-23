import { useLocation, useParams } from "react-router";

export interface BreadcrumbItem {
	label: string;
	href?: string;
	isCurrentPage?: boolean;
}

/**
 * Generates breadcrumb items based on the current route
 * @param pathname - Current pathname from useLocation
 * @param params - Route parameters from useParams
 * @returns Array of breadcrumb items
 */
export function generateBreadcrumbs(pathname: string, params: Record<string, string | undefined>): BreadcrumbItem[] {
	const breadcrumbs: BreadcrumbItem[] = [];

	if (pathname.startsWith("/repositories")) {
		breadcrumbs.push({
			label: "Repositories",
			href: "/repositories",
			isCurrentPage: pathname === "/repositories",
		});

		if (pathname.startsWith("/repositories/") && params.name) {
			breadcrumbs.push({
				label: params.name,
				isCurrentPage: true,
			});
		}

		return breadcrumbs;
	}

	breadcrumbs.push({
		label: "Volumes",
		href: "/volumes",
		isCurrentPage: pathname === "/volumes",
	});

	if (pathname.startsWith("/volumes/") && params.name) {
		breadcrumbs.push({
			label: params.name,
			isCurrentPage: true,
		});
	}

	return breadcrumbs;
}

/**
 * Hook to get breadcrumb data for the current route
 */
export function useBreadcrumbs(): BreadcrumbItem[] {
	const location = useLocation();
	const params = useParams();

	return generateBreadcrumbs(location.pathname, params);
}
