import type { ListSnapshotsResponse } from "~/api-client/types.gen";
import { cn } from "~/lib/utils";
import { Card } from "~/components/ui/card";
import { ByteSize } from "~/components/bytes-size";

interface Props {
	snapshots: ListSnapshotsResponse;
	snapshotId: string;
	onSnapshotSelect: (snapshotId: string) => void;
}

export const SnapshotTimeline = (props: Props) => {
	const { snapshots, snapshotId, onSnapshotSelect } = props;

	if (snapshots.length === 0) {
		return (
			<div className="w-full bg-card border-t border-border py-4 px-4">
				<div className="flex items-center justify-center h-24">
					<p className="text-muted-foreground">No snapshots available</p>
				</div>
			</div>
		);
	}

	return (
		<Card className="p-0 pt-2">
			<div className="w-full bg-card">
				<div className="relative flex items-center">
					<div className="flex-1 overflow-hidden">
						<div className="flex gap-4 overflow-x-auto pb-2 [&>:first-child]:ml-2 [&>:last-child]:mr-2">
							{snapshots.map((snapshot, index) => {
								const date = new Date(snapshot.time);
								const isSelected = snapshotId === snapshot.short_id;
								const isLatest = index === snapshots.length - 1;

								return (
									<button
										type="button"
										key={snapshot.short_id}
										onClick={() => onSnapshotSelect(snapshot.short_id)}
										className={cn(
											"shrink-0 flex flex-col items-center gap-2 p-3 rounded-lg transition-all",
											"border-2 cursor-pointer",
											{
												"border-primary bg-primary/10 shadow-md": isSelected,
												"border-border hover:border-accent hover:bg-accent/5": !isSelected,
											},
										)}
									>
										<div className="text-xs font-semibold text-foreground">
											{date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
										</div>
										<div className="text-xs text-muted-foreground">
											{date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
										</div>
										<div className="text-xs text-muted-foreground opacity-75">
											<ByteSize bytes={snapshot.size} />
										</div>
										{isLatest && (
											<div className="text-xs font-semibold text-primary px-2 py-0.5 bg-primary/20 rounded">Latest</div>
										)}
									</button>
								);
							})}
						</div>
					</div>
				</div>

				<div className="px-4 py-2 text-xs text-muted-foreground bg-card-header border-t border-border flex justify-between">
					<span>{snapshots.length} snapshots</span>
					<span>
						{new Date(snapshots[0].time).toLocaleDateString()} -{" "}
						{new Date(snapshots.at(-1)?.time ?? 0).toLocaleDateString()}
					</span>
				</div>
			</div>
		</Card>
	);
};
