import { Card } from "./ui/card";

type EmptyStateProps = {
	title?: string;
	description?: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	button?: React.ReactNode;
};

export function EmptyState(props: EmptyStateProps) {
	const { title, description, icon: Cicon, button } = props;

	return (
		<Card className="p-0 gap-0">
			<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
				<div className="relative mb-8">
					<div className="absolute inset-0 animate-pulse">
						<div className="w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
					</div>
					<div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20">
						<Cicon className="w-16 h-16 text-primary/70" strokeWidth={1.5} />
					</div>
				</div>
				<div className="max-w-md space-y-3 mb-8">
					<h3 className="text-2xl font-semibold text-foreground">{title}</h3>
					<p className="text-muted-foreground text-sm">{description}</p>
				</div>
				{button}
			</div>
		</Card>
	);
}
