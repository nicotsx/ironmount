import { CreateVolumeForm } from "~/components/create-volume-form";
import { Card } from "~/components/ui/card";
import type { StatFs, Volume } from "~/lib/types";
import { HealthchecksCard } from "../components/healthchecks-card";
import { StorageChart } from "../components/storage-chart";

type Props = {
	volume: Volume;
	statfs: StatFs;
};

export const VolumeInfoTabContent = ({ volume, statfs }: Props) => {
	return (
		<div className="grid gap-4 xl:grid-cols-[minmax(0,_2.3fr)_minmax(320px,_1fr)]">
			<Card className="p-6">
				<CreateVolumeForm initialValues={{ ...volume, ...volume.config }} onSubmit={console.log} />
			</Card>
			<div className="flex flex-col gap-4">
				<div className="self-start w-full">
					<HealthchecksCard volume={volume} />
				</div>
				<div className="flex-1 w-full">
					<StorageChart statfs={statfs} />
				</div>
			</div>
		</div>
	);
};
