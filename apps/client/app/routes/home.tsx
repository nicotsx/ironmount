import { Welcome } from "../welcome/welcome";
import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Ironmount" },
		{ name: "description", content: "Welcome to React Router!" },
	];
}

export default function Home() {
	return <Welcome />;
}
