import { useQuery } from "@tanstack/react-query";
import { Copy, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { listVolumes } from "~/api-client";
import { listVolumesOptions } from "~/api-client/@tanstack/react-query.gen";
import { CreateVolumeDialog } from "~/components/create-volume-dialog";
import { StatusDot } from "~/components/status-dot";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { VolumeIcon } from "~/components/volume-icon";
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
	const [createVolumeOpen, setCreateVolumeOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [backendFilter, setBackendFilter] = useState("");

	const clearFilters = () => {
		setSearchQuery("");
		setStatusFilter("");
		setBackendFilter("");
	};

	const navigate = useNavigate();

	const { data } = useQuery({
		...listVolumesOptions(),
		initialData: loaderData,
		refetchInterval: 10000,
		refetchOnWindowFocus: true,
	});

	const filteredVolumes =
		data?.volumes.filter((volume) => {
			const matchesSearch = volume.name.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesStatus = !statusFilter || volume.status === statusFilter;
			const matchesBackend = !backendFilter || volume.type === backendFilter;
			return matchesSearch && matchesStatus && matchesBackend;
		}) || [];

	return (
		<>
			<h1 className="text-2xl sm:text-3xl font-bold mb-0 uppercase">Ironmount</h1>
			<h2 className="text-xs sm:text-sm font-semibold mb-2 text-muted-foreground">
				Create, manage, monitor, and automate your volumes with ease.
			</h2>
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 sm:justify-between">
				<span className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
					<Input
						className="w-full sm:w-[180px]"
						placeholder="Search volumes…"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-full sm:w-[180px]">
							<SelectValue placeholder="All status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="mounted">Mounted</SelectItem>
							<SelectItem value="unmounted">Unmounted</SelectItem>
							<SelectItem value="error">Error</SelectItem>
						</SelectContent>
					</Select>
					<Select value={backendFilter} onValueChange={setBackendFilter}>
						<SelectTrigger className="w-full sm:w-[180px]">
							<SelectValue placeholder="All backends" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="directory">Directory</SelectItem>
							<SelectItem value="nfs">NFS</SelectItem>
							<SelectItem value="smb">SMB</SelectItem>
						</SelectContent>
					</Select>
					{(searchQuery || statusFilter || backendFilter) && (
						<Button variant="outline" size="sm" onClick={clearFilters} className="w-full sm:w-auto">
							<RotateCcw className="h-4 w-4 mr-2" />
							Clear filters
						</Button>
					)}
				</span>
				<CreateVolumeDialog open={createVolumeOpen} setOpen={setCreateVolumeOpen} />
			</div>
			<div className="mt-4 overflow-x-auto">
				<Table className="border bg-white dark:bg-secondary">
					<TableCaption>A list of your managed volumes.</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[100px] uppercase">Name</TableHead>
							<TableHead className="uppercase text-left">Backend</TableHead>
							<TableHead className="uppercase hidden sm:table-cell">Mountpoint</TableHead>
							<TableHead className="uppercase text-center">Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredVolumes.map((volume) => (
							<TableRow
								key={volume.name}
								className="hover:bg-accent/50 hover:cursor-pointer"
								onClick={() => navigate(`/volumes/${volume.name}`)}
							>
								<TableCell className="font-medium">{volume.name}</TableCell>
								<TableCell>
									<VolumeIcon backend={volume.type} />
								</TableCell>
								<TableCell className="hidden sm:table-cell">
									<span className="flex items-center gap-2">
										<span className="text-muted-foreground text-xs truncate bg-primary/10 rounded-md px-2 py-1">
											{volume.path}
										</span>
										<Copy size={10} />
									</span>
								</TableCell>
								<TableCell className="text-center">
									<StatusDot status={volume.status} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</>
	);
}
