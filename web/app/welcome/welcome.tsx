import { Copy, Folder, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { useDeleteVolume } from "~/hooks/useDeleteVolume";
import { useVolumes } from "~/hooks/useVolumes";
import { cn } from "~/lib/utils";

export function Welcome() {
	const { data } = useVolumes();
	const deleteVolume = useDeleteVolume();

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
					Create, manage, monitor, and automate your Docker volumes with ease.
				</h2>
				<div className="flex items-center gap-2 mt-4 justify-between">
					<span className="flex items-center gap-2">
						<Input className="w-[180px]" placeholder="Search volumes..." />
						<Select>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="All status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="light">Mounted</SelectItem>
								<SelectItem value="dark">Unmounted</SelectItem>
								<SelectItem value="system">Error</SelectItem>
							</SelectContent>
						</Select>
						<Select>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="All backends" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="light">Directory</SelectItem>
								<SelectItem value="dark">NFS</SelectItem>
								<SelectItem value="system">SMB</SelectItem>
							</SelectContent>
						</Select>
					</span>
					<Button className="bg-blue-900 hover:bg-blue-800">
						<Plus size={16} />
						Create volume
					</Button>
				</div>
				<Table className="mt-4 border bg-white dark:bg-secondary">
					<TableCaption>A list of your managed Docker volumes.</TableCaption>
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
								<TableCell className="">
									<span className="mx-auto flex items-center gap-2 text-purple-800 dark:text-purple-300 rounded-md px-2 py-1">
										<Folder size={10} />
										Dir
									</span>
								</TableCell>
								<TableCell>
									<span className="flex items-center gap-2">
										<span className="text-muted-foreground text-xs truncate bg-primary/10 rounded-md px-2 py-1">
											{volume.mountpoint}
										</span>
										<Copy size={10} />
									</span>
								</TableCell>
								<TableCell className="">
									<span className="relative flex size-3 mx-auto">
										<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
										<span className="relative inline-flex size-3 rounded-full bg-green-500"></span>
									</span>
								</TableCell>
								<TableCell className="text-right">
									<Button
										variant="destructive"
										onClick={() => deleteVolume.mutate({ name: volume.name })}
									>
										Delete
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</main>
		</div>
	);
}
