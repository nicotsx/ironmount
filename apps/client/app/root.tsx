import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { Toaster } from "~/components/ui/sonner";

import type { Route } from "./+types/root";
import "./app.css";
import { client } from "./api-client/client.gen";
import { useServerEvents } from "./hooks/use-server-events";

client.setConfig({
	baseUrl: "/",
});

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Google+Sans+Code:ital,wght@0,300..800;1,300..800&display=swap",
	},
];

const queryClient = new QueryClient({
	mutationCache: new MutationCache({
		onSuccess: () => {
			queryClient.invalidateQueries();
		},
		onError: (error) => {
			console.error("Mutation error:", error);
			queryClient.invalidateQueries();
		},
	}),
});

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" style={{ colorScheme: "dark" }} className="dark">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
				<link rel="icon" type="image/png" href="/images/favicon/favicon-96x96.png" sizes="96x96" />
				<link rel="icon" type="image/svg+xml" href="/images/favicon/favicon.svg" />
				<link rel="shortcut icon" href="/images/favicon/favicon.ico" />
				<link rel="apple-touch-icon" sizes="180x180" href="/images/favicon/apple-touch-icon.png" />
				<meta name="apple-mobile-web-app-title" content="Ironmount" />
				<link rel="manifest" href="/images/favicon/site.webmanifest" />
				<Meta />
				<Links />
			</head>
			<QueryClientProvider client={queryClient}>
				<body>
					{children}
					<Toaster />
					<ScrollRestoration />
					<Scripts />
				</body>
			</QueryClientProvider>
		</html>
	);
}

export default function App() {
	useServerEvents();

	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-4 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
