import { useMutation, useQuery } from "@tanstack/react-query";
import { Copy, Folder } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type ListVolumesResponse, listVolumes } from "~/api-client";
import { deleteVolumeMutation, listVolumesOptions } from "~/api-client/@tanstack/react-query.gen";
import { CreateVolumeDialog } from "~/components/create-volume-dialog";
import { EditVolumeDialog } from "~/components/edit-volume-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { parseError } from "~/lib/errors";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Ironmount" },
		{
			name: "description",
			content: "Create, manage, monitor, and automate your Docker volumes with ease.",
		},
	];
}

export const clientLoader = async () => {
	const volumes = await listVolumes();
	if (volumes.data) return { volumes: volumes.data.volumes };
	return { volumes: [] };
};

export default function Home({ loaderData }: Route.ComponentProps) {
	const [volumeToEdit, setVolumeToEdit] = useState<ListVolumesResponse["volumes"][number]>();
	const [createVolumeOpen, setCreateVolumeOpen] = useState(false);

	const deleteVol = useMutation({
		...deleteVolumeMutation(),
		onSuccess: () => {
			toast.success("Volume deleted successfully");
		},
		onError: (error) => {
			toast.error("Failed to delete volume", {
				description: parseError(error)?.message,
			});
		},
	});

	const handleDeleteConfirm = (name: string) => {
		if (confirm(`Are you sure you want to delete the volume "${name}"? This action cannot be undone.`)) {
			deleteVol.mutate({ path: { name } });
		}
	};

	const { data } = useQuery({
		...listVolumesOptions(),
		initialData: loaderData,
	});

	return (
		<div
			className={cn(
				"absolute inset-0",
				"[background-size:40px_40px]",
				"[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
				"dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
			)}
		>
			<div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black"></div>
			<main className="relative flex flex-col pt-16 p-4 container mx-auto">
				<h1 className="text-3xl font-bold mb-0 uppercase">Ironmount</h1>
				<h2 className="text-sm font-semibold mb-2 text-muted-foreground">
					Create, manage, monitor, and automate your volumes with ease.
				</h2>
				<div className="flex items-center gap-2 mt-4 justify-between">
					<span className="flex items-center gap-2">
						<Input className="w-[180px]" placeholder="Search volumes…" />
						<Select>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="All status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="mounted">Mounted</SelectItem>
								<SelectItem value="unmounted">Unmounted</SelectItem>
								<SelectItem value="error">Error</SelectItem>
							</SelectContent>
						</Select>
						<Select>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="All backends" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="directory">Directory</SelectItem>
								<SelectItem value="nfs">NFS</SelectItem>
								<SelectItem value="smb">SMB</SelectItem>
							</SelectContent>
						</Select>
					</span>
					<CreateVolumeDialog open={createVolumeOpen} setOpen={setCreateVolumeOpen} />
				</div>
				<Table className="mt-4 border bg-white dark:bg-secondary">
					<TableCaption>A list of your managed volumes.</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[100px] uppercase">Name</TableHead>
							<TableHead className="uppercase text-left">Backend</TableHead>
							<TableHead className="uppercase">Mountpoint</TableHead>
							<TableHead className="uppercase text-center">Status</TableHead>
							<TableHead className="uppercase text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data?.volumes.map((volume) => (
							<TableRow key={volume.name}>
								<TableCell className="font-medium">{volume.name}</TableCell>
								<TableCell>
									<span className="mx-auto flex items-center gap-2 text-purple-800 dark:text-purple-300 rounded-md px-2 py-1">
										<Folder size={10} />
										Volume
									</span>
								</TableCell>
								<TableCell>
									<span className="flex items-center gap-2">
										<span className="text-muted-foreground text-xs truncate bg-primary/10 rounded-md px-2 py-1">
											{volume.path}
										</span>
										<Copy size={10} />
									</span>
								</TableCell>
								<TableCell className="text-center">
									<span className="relative flex size-3 mx-auto">
										<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
										<span className="relative inline-flex size-3 rounded-full bg-green-500" />
									</span>
								</TableCell>
								<TableCell className="text-right">
									<div className="flex justify-end gap-2">
										<Button
											type="button"
											onClick={() => {
												setVolumeToEdit(volume);
											}}
										>
											Edit
										</Button>
										<Button type="button" variant="destructive" onClick={() => handleDeleteConfirm(volume.name)}>
											Delete
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
				<EditVolumeDialog
					open={Boolean(volumeToEdit)}
					setOpen={() => setVolumeToEdit(undefined)}
					initialValues={volumeToEdit}
				/>
			</main>
		</div>
	);
}
