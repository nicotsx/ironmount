import { Database, HardDrive, Unplug } from "lucide-react";
import { ByteSize } from "~/components/bytes-size";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { StatFs } from "~/lib/types";

type Props = {
	statfs: StatFs;
};

export function StorageInfoCard({ statfs }: Props) {
	const isEmpty = !statfs.total;

	if (isEmpty) {
		return (
			<Card className="flex flex-col h-full text-sm">
				<CardHeader className="items-center pb-0">
					<CardTitle className="flex items-center gap-2">
						<Database className="h-4 w-4" />
						Storage Usage
					</CardTitle>
				</CardHeader>
				<CardContent className="flex-1 pb-10 flex flex-col items-center justify-center text-center">
					<Unplug className="mb-4 h-5 w-5 text-muted-foreground" />
					<p className="text-muted-foreground">No storage data available. Mount the volume to see usage statistics.</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="h-full text-sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Database className="h-4 w-4" />
					Storage Details
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-col h-full justify-center">
					<div className="grid gap-4 w-full">
						<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
							<div className="flex items-center gap-3">
								<HardDrive className="h-4 w-4 text-muted-foreground" />
								<span className="font-medium">Total Capacity</span>
							</div>
							<ByteSize bytes={statfs.total} className="font-mono text-sm" />
						</div>

						<div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
							<div className="flex items-center gap-3">
								<div className="h-4 w-4 rounded-full bg-blue-500" />
								<span className="font-medium">Used Space</span>
							</div>
							<div className="text-right">
								<ByteSize bytes={statfs.used} className="font-mono text-sm" />
							</div>
						</div>

						<div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
							<div className="flex items-center gap-3">
								<div className="h-4 w-4 rounded-full bg-primary" />
								<span className="font-medium">Free Space</span>
							</div>
							<div className="text-right">
								<ByteSize bytes={statfs.free} className="font-mono text-sm" />
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
