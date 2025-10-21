import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import {
	deleteVolumeMutation,
	getVolumeOptions,
	mountVolumeMutation,
	unmountVolumeMutation,
} from "~/api-client/@tanstack/react-query.gen";
import { StatusDot } from "~/components/status-dot";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { VolumeIcon } from "~/components/volume-icon";
import { parseError } from "~/lib/errors";
import { cn } from "~/lib/utils";
import { VolumeBackupsTabContent } from "~/modules/details/tabs/backups";
import { DockerTabContent } from "~/modules/details/tabs/docker";
import { FilesTabContent } from "~/modules/details/tabs/files";
import { VolumeInfoTabContent } from "~/modules/details/tabs/info";
import { getVolume } from "../api-client";
import type { Route } from "./+types/details";

export function meta({ params }: Route.MetaArgs) {
	return [
		{ title: `Ironmount - ${params.name}` },
		{
			name: "description",
			content: "Create, manage, monitor, and automate your Docker volumes with ease.",
		},
	];
}

export const clientLoader = async ({ params }: Route.ClientLoaderArgs) => {
	const volume = await getVolume({ path: { name: params.name ?? "" } });
	if (volume.data) return volume.data;
};

export default function DetailsPage({ loaderData }: Route.ComponentProps) {
	const { name } = useParams<{ name: string }>();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = searchParams.get("tab") || "info";

	const { data } = useQuery({
		...getVolumeOptions({ path: { name: name ?? "" } }),
		initialData: loaderData,
		refetchInterval: 10000,
		refetchOnWindowFocus: true,
	});

	const deleteVol = useMutation({
		...deleteVolumeMutation(),
		onSuccess: () => {
			toast.success("Volume deleted successfully");
			navigate("/volumes");
		},
		onError: (error) => {
			toast.error("Failed to delete volume", {
				description: parseError(error)?.message,
			});
		},
	});

	const mountVol = useMutation({
		...mountVolumeMutation(),
		onSuccess: () => {
			toast.success("Volume mounted successfully");
		},
		onError: (error) => {
			toast.error("Failed to mount volume", {
				description: parseError(error)?.message,
			});
		},
	});

	const unmountVol = useMutation({
		...unmountVolumeMutation(),
		onSuccess: () => {
			toast.success("Volume unmounted successfully");
		},
		onError: (error) => {
			toast.error("Failed to unmount volume", {
				description: parseError(error)?.message,
			});
		},
	});

	const handleDeleteConfirm = (name: string) => {
		if (confirm(`Are you sure you want to delete the volume "${name}"? This action cannot be undone.`)) {
			deleteVol.mutate({ path: { name } });
		}
	};

	if (!name) {
		return <div>Volume not found</div>;
	}

	if (!data) {
		return <div>Loading...</div>;
	}

	const { volume, statfs } = data;

	return (
		<>
			<div className="flex items-center justify-between">
				<div>
					<div className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-2">
						<span className="flex items-center gap-2">
							<StatusDot status={volume.status} /> {volume.status[0].toUpperCase() + volume.status.slice(1)}
						</span>
						<VolumeIcon size={14} backend={volume?.config.backend} />
					</div>
				</div>
				<div className="flex gap-4">
					<Button
						onClick={() => mountVol.mutate({ path: { name } })}
						loading={mountVol.isPending}
						className={cn({ hidden: volume.status === "mounted" })}
					>
						Mount
					</Button>
					<Button
						variant="secondary"
						onClick={() => unmountVol.mutate({ path: { name } })}
						loading={unmountVol.isPending}
						className={cn({ hidden: volume.status !== "mounted" })}
					>
						Unmount
					</Button>
					<Button variant="destructive" onClick={() => handleDeleteConfirm(name)} disabled={deleteVol.isPending}>
						Delete
					</Button>
				</div>
			</div>
			<Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })} className="mt-4">
				<TabsList className="mb-2">
					<TabsTrigger value="info">Configuration</TabsTrigger>
					<TabsTrigger value="files">Files</TabsTrigger>
					<TabsTrigger value="docker">Docker</TabsTrigger>
					<TabsTrigger value="backups">Backups</TabsTrigger>
				</TabsList>
				<TabsContent value="info">
					<VolumeInfoTabContent volume={volume} statfs={statfs} />
				</TabsContent>
				<TabsContent value="files">
					<FilesTabContent volume={volume} />
				</TabsContent>
				<TabsContent value="docker">
					<DockerTabContent volume={volume} />
				</TabsContent>
				<TabsContent value="backups">
					<VolumeBackupsTabContent volume={volume} />
				</TabsContent>
			</Tabs>
		</>
	);
}
