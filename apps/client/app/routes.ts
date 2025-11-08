import { layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	route("onboarding", "./modules/auth/routes/onboarding.tsx"),
	route("login", "./modules/auth/routes/login.tsx"),
	route("download-recovery-key", "./modules/auth/routes/download-recovery-key.tsx"),
	layout("./components/layout.tsx", [
		route("/", "./routes/root.tsx"),
		route("volumes", "./modules/volumes/routes/volumes.tsx"),
		route("volumes/:name", "./modules/volumes/routes/volume-details.tsx"),
		route("backups", "./modules/backups/routes/backups.tsx"),
		route("backups/create", "./modules/backups/routes/create-backup.tsx"),
		route("backups/:id", "./modules/backups/routes/backup-details.tsx"),
		route("repositories", "./modules/repositories/routes/repositories.tsx"),
		route("repositories/:name", "./modules/repositories/routes/repository-details.tsx"),
		route("repositories/:name/:snapshotId", "./modules/repositories/routes/snapshot-details.tsx"),
		route("settings", "./modules/settings/routes/settings.tsx"),
	]),
] satisfies RouteConfig;
