import { useMutation, useQuery } from "@tanstack/react-query";
import { WifiIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { getVolume } from "~/api-client";
import {
	deleteVolumeMutation,
	getVolumeOptions,
	mountVolumeMutation,
	unmountVolumeMutation,
} from "~/api-client/@tanstack/react-query.gen";
import { CreateVolumeForm } from "~/components/create-volume-form";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { VolumeIcon } from "~/components/volume-icon";
import { parseError } from "~/lib/errors";
import { HealthchecksCard } from "~/modules/details/components/healthchecks-card";
import type { Route } from "./+types/details";
import { cn } from "~/lib/utils";

export const clientLoader = async ({ params }: Route.ClientLoaderArgs) => {
	const volume = await getVolume({ path: { name: params.name ?? "" } });
	if (volume.data) return volume.data;
};

export default function DetailsPage({ loaderData }: Route.ComponentProps) {
	const { name } = useParams<{ name: string }>();
	const navigate = useNavigate();

	const { data } = useQuery({
		...getVolumeOptions({ path: { name: name ?? "" } }),
		initialData: loaderData,
	});

	const deleteVol = useMutation({
		...deleteVolumeMutation(),
		onSuccess: () => {
			toast.success("Volume deleted successfully");
			navigate("/");
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

	return (
		<>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold mb-0 uppercase">Volume: {name}</h1>
					<div className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-2">
						<span className="text-green-500 flex items-center gap-2">
							<WifiIcon size={16} />
							{data.status}
						</span>
						<VolumeIcon size={14} backend={data?.config.backend} />
					</div>
				</div>
				<div className="flex gap-4">
					<Button
						variant="secondary"
						onClick={() => mountVol.mutate({ path: { name } })}
						disabled={mountVol.isPending}
						className={cn({ hidden: data.status === "mounted" })}
					>
						Mount
					</Button>
					<Button
						variant="secondary"
						onClick={() => unmountVol.mutate({ path: { name } })}
						disabled={unmountVol.isPending}
						className={cn({ hidden: data.status !== "mounted" })}
					>
						Unmount
					</Button>
					<Button variant="destructive" onClick={() => handleDeleteConfirm(name)} disabled={deleteVol.isPending}>
						Delete
					</Button>
				</div>
			</div>
			<div className="flex gap-4">
				<Card className="my-4 p-6 flex-1">
					<CreateVolumeForm initialValues={{ ...data, ...data?.config }} onSubmit={console.log} />
				</Card>
				<div className="flex flex-col my-4 gap-4">
					<HealthchecksCard volume={data} />
					<Card className="p-6 flex-1">
						<h2 className="text-lg font-medium">Volume Information</h2>
					</Card>
				</div>
			</div>
		</>
	);
}
