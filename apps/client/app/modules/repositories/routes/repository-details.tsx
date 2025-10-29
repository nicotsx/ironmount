import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import {
	deleteRepositoryMutation,
	getRepositoryOptions,
	listSnapshotsOptions,
} from "~/api-client/@tanstack/react-query.gen";
import { Button } from "~/components/ui/button";
import { parseError } from "~/lib/errors";
import { getRepository } from "~/api-client/sdk.gen";
import type { Route } from "./+types/repository-details";
import { cn } from "~/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { RepositoryInfoTabContent } from "../tabs/info";
import { RepositorySnapshotsTabContent } from "../tabs/snapshots";
import { useEffect } from "react";

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
	const queryClient = useQueryClient();

	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = searchParams.get("tab") || "info";

	const { data } = useQuery({
		...getRepositoryOptions({ path: { name: name ?? "" } }),
		initialData: loaderData,
		refetchInterval: 10000,
		refetchOnWindowFocus: true,
	});

	useEffect(() => {
		if (name) {
			queryClient.prefetchQuery(listSnapshotsOptions({ path: { name } }));
		}
	}, [name, queryClient]);

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

	return (
		<>
			<div className="flex items-center justify-between mb-4">
				<div>
					<div className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-2">
						<span
							className={cn(
								"inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs bg-gray-500/10 text-gray-500",
								{
									"bg-green-500/10 text-green-500": data.status === "healthy",
									"bg-red-500/10 text-red-500": data.status === "error",
								},
							)}
						>
							{data.status || "unknown"}
						</span>
						<span className="text-xs bg-primary/10 rounded-md px-2 py-1">{data.type}</span>
					</div>
				</div>
				<div className="flex gap-4">
					<Button variant="destructive" onClick={() => handleDeleteConfirm(name)} disabled={deleteRepo.isPending}>
						Delete
					</Button>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })}>
				<TabsList className="mb-2">
					<TabsTrigger value="info">Configuration</TabsTrigger>
					<TabsTrigger value="snapshots">Snapshots</TabsTrigger>
				</TabsList>
				<TabsContent value="info">
					<RepositoryInfoTabContent repository={data} />
				</TabsContent>
				<TabsContent value="snapshots">
					<RepositorySnapshotsTabContent repository={data} />
				</TabsContent>
			</Tabs>
		</>
	);
}
