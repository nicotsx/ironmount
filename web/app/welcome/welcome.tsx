import { AArrowDownIcon, Folder } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
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
import { useVolumes } from "~/hooks/useVolumes";
import { cn } from "~/lib/utils";

export function Welcome() {
	const { data } = useVolumes();

	console.log(data?.volumes.map((volume) => volume.name));

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
				<h1 className="text-2xl font-bold mb-0 uppercase">Volume Manager</h1>
				<h2 className="text-sm font-semibold mb-2 text-muted-foreground">
					Manage your Docker volume configurations and monitor their status.
				</h2>
				<div className="flex items-center gap-2 mt-4">
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
				</div>
				<Table className="mt-4 border bg-white dark:bg-secondary">
					<TableCaption>A list of your managed Docker volumes.</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[100px] uppercase">Name</TableHead>
							<TableHead className="uppercase">Backend</TableHead>
							<TableHead>Mountpoint</TableHead>
							<TableHead className="uppercase text-center">Status</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data?.volumes.map((volume) => (
							<TableRow key={volume.name}>
								<TableCell className="font-medium">{volume.name}</TableCell>
								<TableCell className="">
									<div className="flex items-center gap-2 text-purple-300 rounded-md px-2 py-1">
										<Folder size={10} />
										Dir
									</div>
								</TableCell>
								<TableCell>{volume.mountpoint}</TableCell>
								<TableCell className="">
									<span className="relative flex size-3 mx-auto">
										<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
										<span className="relative inline-flex size-3 rounded-full bg-green-500"></span>
									</span>
								</TableCell>
								<TableCell className="text-right">
									<Button variant="outline" size="sm">
										Manage
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
