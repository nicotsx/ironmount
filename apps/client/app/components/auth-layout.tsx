import { Mountain } from "lucide-react";
import type { ReactNode } from "react";

type AuthLayoutProps = {
	title: string;
	description: string;
	children: ReactNode;
};

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
	return (
		<div className="flex min-h-screen">
			<div className="flex flex-1 items-center justify-center bg-background p-8">
				<div className="w-full max-w-md space-y-8">
					<div className="flex items-center gap-3">
						<Mountain className="size-5 text-strong-accent" />
						<span className="text-lg font-semibold">Ironmount</span>
					</div>

					<div className="space-y-2">
						<h1 className="text-3xl font-bold tracking-tight">{title}</h1>
						<p className="text-sm text-muted-foreground">{description}</p>
					</div>

					{children}
				</div>
			</div>
			<div
				className="hidden lg:block lg:flex-1 dither-xl bg-cover bg-center"
				style={{ backgroundImage: "url(/images/background.jpg)" }}
			/>
		</div>
	);
}
