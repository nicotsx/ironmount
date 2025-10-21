import { layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	route("onboarding", "./routes/onboarding.tsx"),
	route("login", "./routes/login.tsx"),
	layout("./components/layout.tsx", [
		route("volumes", "./routes/home.tsx"),
		route("volumes/:name", "./routes/details.tsx"),
	]),
] satisfies RouteConfig;
