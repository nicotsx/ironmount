import { Database, HardDrive } from "lucide-react";
import { ByteSize } from "~/components/bytes-size";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { StatFs } from "~/lib/types";

type Props = {
	statfs: StatFs;
};

export function StorageInfoCard({ statfs }: Props) {
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
