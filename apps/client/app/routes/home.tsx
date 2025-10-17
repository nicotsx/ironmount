import { useQuery } from "@tanstack/react-query";
import { Copy, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { listVolumes } from "~/api-client";
import { listVolumesOptions } from "~/api-client/@tanstack/react-query.gen";
import { CreateVolumeDialog } from "~/components/create-volume-dialog";
import { EmptyState } from "~/components/empty-state";
import { StatusDot } from "~/components/status-dot";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { VolumeIcon } from "~/components/volume-icon";
import { copyToClipboard } from "~/utils/clipboard";
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

	const hasNoVolumes = data?.volumes.length === 0;
	const hasNoFilteredVolumes = filteredVolumes.length === 0 && !hasNoVolumes;

	if (hasNoVolumes) {
		return (
			<Card className="p-0 gap-0">
				<EmptyState />
			</Card>
		);
	}

	return (
		<Card className="p-0 gap-0">
			<div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 md:justify-between p-4 bg-card-header py-4">
				<span className="flex flex-col sm:flex-row items-stretch md:items-center gap-0 flex-wrap ">
					<Input
						className="w-full lg:w-[180px] min-w-[180px] mr-[-1px] mt-[-1px]"
						placeholder="Search volumes…"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-full lg:w-[180px] min-w-[180px] mr-[-1px] mt-[-1px]">
							<SelectValue placeholder="All status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="mounted">Mounted</SelectItem>
							<SelectItem value="unmounted">Unmounted</SelectItem>
							<SelectItem value="error">Error</SelectItem>
						</SelectContent>
					</Select>
					<Select value={backendFilter} onValueChange={setBackendFilter}>
						<SelectTrigger className="w-full lg:w-[180px] min-w-[180px] mt-[-1px]">
							<SelectValue placeholder="All backends" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="directory">Directory</SelectItem>
							<SelectItem value="nfs">NFS</SelectItem>
							<SelectItem value="smb">SMB</SelectItem>
						</SelectContent>
					</Select>
					{(searchQuery || statusFilter || backendFilter) && (
						<Button onClick={clearFilters} className="w-full lg:w-auto mt-2 lg:mt-0 lg:ml-2">
							<RotateCcw className="h-4 w-4 mr-2" />
							Clear filters
						</Button>
					)}
				</span>
				<CreateVolumeDialog open={createVolumeOpen} setOpen={setCreateVolumeOpen} />
			</div>
			<div className="overflow-x-auto">
				<Table className="border-t">
					<TableHeader className="bg-card-header">
						<TableRow>
							<TableHead className="w-[100px] uppercase">Name</TableHead>
							<TableHead className="uppercase text-left">Backend</TableHead>
							<TableHead className="uppercase hidden sm:table-cell">Mountpoint</TableHead>
							<TableHead className="uppercase text-center">Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{hasNoFilteredVolumes ? (
							<TableRow>
								<TableCell colSpan={4} className="text-center py-12">
									<div className="flex flex-col items-center gap-3">
										<p className="text-muted-foreground">No volumes match your filters.</p>
										<Button onClick={clearFilters} variant="outline" size="sm">
											<RotateCcw className="h-4 w-4 mr-2" />
											Clear filters
										</Button>
									</div>
								</TableCell>
							</TableRow>
						) : (
							filteredVolumes.map((volume) => (
								<TableRow
									key={volume.name}
									className="hover:bg-accent/50 hover:cursor-pointer"
									onClick={() => navigate(`/volumes/${volume.name}`)}
								>
									<TableCell className="font-medium text-strong-accent">{volume.name}</TableCell>
									<TableCell>
										<VolumeIcon backend={volume.type} />
									</TableCell>
									<TableCell className="hidden sm:table-cell">
										<button
											type="button"
											className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity"
											onClick={(e) => {
												e.stopPropagation();
												copyToClipboard(volume.path);
												toast.success("Path copied to clipboard");
											}}
										>
											<span className="text-muted-foreground text-xs truncate bg-primary/10 rounded-md px-2 py-1">
												{volume.path}
											</span>
											<Copy size={10} />
										</button>
									</TableCell>
									<TableCell className="text-center">
										<StatusDot status={volume.status} />
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
			<div className="px-4 py-2 text-sm text-muted-foreground bg-card-header flex justify-end border-t">
				{hasNoFilteredVolumes ? (
					"No volumes match filters."
				) : (
					<span>
						<span className="text-strong-accent">{filteredVolumes.length}</span> volume
						{filteredVolumes.length > 1 ? "s" : ""}
					</span>
				)}
			</div>
		</Card>
	);
}
