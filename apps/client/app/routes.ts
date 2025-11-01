import { layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	route("onboarding", "./routes/onboarding.tsx"),
	route("login", "./routes/login.tsx"),
	layout("./components/layout.tsx", [
		route("/", "./routes/root.tsx"),
		route("volumes", "./routes/home.tsx"),
		route("volumes/:name", "./routes/details.tsx"),
		route("backup-jobs", "./routes/backup-jobs.tsx"),
		route("backup-jobs/:scheduleId", "./routes/schedule-details.tsx"),
		route("repositories", "./modules/repositories/routes/repositories.tsx"),
		route("repositories/:name", "./modules/repositories/routes/repository-details.tsx"),
		route("repositories/:name/:snapshotId", "./modules/repositories/routes/snapshot-details.tsx"),
	]),
] satisfies RouteConfig;
