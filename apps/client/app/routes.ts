import { layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	route("onboarding", "./routes/onboarding.tsx"),
	route("login", "./routes/login.tsx"),
	layout("./components/layout.tsx", [
		route("/", "./routes/root.tsx"),
		route("volumes", "./routes/home.tsx"),
		route("volumes/:name", "./routes/details.tsx"),
		route("repositories", "./routes/repositories.tsx"),
		route("repositories/:name", "./routes/repository-details.tsx"),
	]),
] satisfies RouteConfig;
