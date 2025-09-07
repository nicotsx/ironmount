import { index, layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	layout("./components/layout.tsx", [index("./routes/home.tsx"), route("volumes/:name", "./routes/details.tsx")]),
] satisfies RouteConfig;
