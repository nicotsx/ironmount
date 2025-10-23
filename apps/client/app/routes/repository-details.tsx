import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { deleteRepositoryMutation, getRepositoryOptions } from "~/api-client/@tanstack/react-query.gen";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { parseError } from "~/lib/errors";
import { getRepository } from "~/api-client/sdk.gen";
import type { Route } from "./+types/repository-details";
import { cn } from "~/lib/utils";

export function meta({ params }: Route.MetaArgs) {
	return [
		{ title: `Ironmount - ${params.name}` },
		{
			name: "description",
			content: "Manage your restic backup repositories with ease.",
		},
	];
}

export const clientLoader = async ({ params }: Route.ClientLoaderArgs) => {
	const repository = await getRepository({ path: { name: params.name ?? "" } });
	if (repository.data) return repository.data;
};

export default function RepositoryDetailsPage({ loaderData }: Route.ComponentProps) {
	const { name } = useParams<{ name: string }>();
	const navigate = useNavigate();

	const { data } = useQuery({
		...getRepositoryOptions({ path: { name: name ?? "" } }),
		initialData: loaderData,
		refetchInterval: 10000,
		refetchOnWindowFocus: true,
	});

	const deleteRepo = useMutation({
		...deleteRepositoryMutation(),
		onSuccess: () => {
			toast.success("Repository deleted successfully");
			navigate("/repositories");
		},
		onError: (error) => {
			toast.error("Failed to delete repository", {
				description: parseError(error)?.message,
			});
		},
	});

	const handleDeleteConfirm = (name: string) => {
		if (
			confirm(
				`Are you sure you want to delete the repository "${name}"? This action cannot be undone and will remove all backup data.`,
			)
		) {
			deleteRepo.mutate({ path: { name } });
		}
	};

	if (!name) {
		return <div>Repository not found</div>;
	}

	if (!data) {
		return <div>Loading...</div>;
	}

	const { repository } = data;

	return (
		<>
			<div className="flex items-center justify-between mb-4">
				<div>
					<div className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-2">
						<span
							className={cn(
								"inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs bg-gray-500/10 text-gray-500",
								{
									"bg-green-500/10 text-green-500": repository.status === "healthy",
									"bg-red-500/10 text-red-500": repository.status === "error",
								},
							)}
						>
							{repository.status || "unknown"}
						</span>
						<span className="text-xs bg-primary/10 rounded-md px-2 py-1">{repository.type}</span>
					</div>
				</div>
				<div className="flex gap-4">
					<Button variant="destructive" onClick={() => handleDeleteConfirm(name)} disabled={deleteRepo.isPending}>
						Delete
					</Button>
				</div>
			</div>

			<Card className="p-6">
				<div className="space-y-6">
					<div>
						<h3 className="text-lg font-semibold mb-4">Repository Information</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<div className="text-sm font-medium text-muted-foreground">Name</div>
								<p className="mt-1 text-sm">{repository.name}</p>
							</div>
							<div>
								<div className="text-sm font-medium text-muted-foreground">Backend</div>
								<p className="mt-1 text-sm">{repository.type}</p>
							</div>
							<div>
								<div className="text-sm font-medium text-muted-foreground">Compression Mode</div>
								<p className="mt-1 text-sm">{repository.compressionMode || "off"}</p>
							</div>
							<div>
								<div className="text-sm font-medium text-muted-foreground">Status</div>
								<p className="mt-1 text-sm">{repository.status || "unknown"}</p>
							</div>
							<div>
								<div className="text-sm font-medium text-muted-foreground">Created At</div>
								<p className="mt-1 text-sm">{new Date(repository.createdAt).toLocaleString()}</p>
							</div>
							<div>
								<div className="text-sm font-medium text-muted-foreground">Last Checked</div>
								<p className="mt-1 text-sm">
									{repository.lastChecked ? new Date(repository.lastChecked).toLocaleString() : "Never"}
								</p>
							</div>
						</div>
					</div>

					{repository.lastError && (
						<div>
							<h3 className="text-lg font-semibold mb-4 text-red-500">Last Error</h3>
							<div className="bg-red-500/10 border border-red-500/20 rounded-md p-4">
								<p className="text-sm text-red-500">{repository.lastError}</p>
							</div>
						</div>
					)}

					<div>
						<h3 className="text-lg font-semibold mb-4">Configuration</h3>
						<div className="bg-muted/50 rounded-md p-4">
							<pre className="text-sm overflow-auto">{JSON.stringify(repository.config, null, 2)}</pre>
						</div>
					</div>
				</div>
			</Card>
		</>
	);
}
