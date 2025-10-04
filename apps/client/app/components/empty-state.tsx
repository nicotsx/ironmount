import { Database, HardDrive, HeartPulse, Plus } from "lucide-react";
import { CreateVolumeDialog } from "./create-volume-dialog";
import { useState } from "react";

export function EmptyState() {
	const [createVolumeOpen, setCreateVolumeOpen] = useState(false);

	return (
		<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
			<div className="relative mb-8">
				<div className="absolute inset-0 animate-pulse">
					<div className="w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
				</div>

				<div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20">
					<Database className="w-16 h-16 text-primary/70" strokeWidth={1.5} />
				</div>
			</div>

			<div className="max-w-md space-y-3 mb-8">
				<h3 className="text-2xl font-semibold text-foreground">No volumes yet</h3>
				<p className="text-muted-foreground">
					Get started by creating your first volume. Manage and monitor all your storage backends in one place with
					advanced features like automatic mounting and health checks.
				</p>
			</div>
			<CreateVolumeDialog open={createVolumeOpen} setOpen={setCreateVolumeOpen} />

			<div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-0 max-w-3xl">
				<div className="flex flex-col items-center gap-2 p-4 border bg-card-header">
					<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
						<Database className="w-5 h-5 text-primary" />
					</div>
					<h4 className="font-medium text-sm">Multiple Backends</h4>
					<p className="text-xs text-muted-foreground">Support for local, NFS, and SMB storage</p>
				</div>

				<div className="flex flex-col items-center gap-2 p-4 border border-r-0 border-l-0 bg-card-header">
					<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
						<HardDrive className="w-5 h-5 text-primary" />
					</div>
					<h4 className="font-medium text-sm">Auto Mounting</h4>
					<p className="text-xs text-muted-foreground">Automatic lifecycle management</p>
				</div>

				<div className="flex flex-col items-center gap-2 p-4 border bg-card-header">
					<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
						<HeartPulse className="w-5 h-5 text-primary" />
					</div>
					<h4 className="font-medium text-sm">Real-time Monitoring</h4>
					<p className="text-xs text-muted-foreground">Live status and health checks</p>
				</div>
			</div>
		</div>
	);
}
