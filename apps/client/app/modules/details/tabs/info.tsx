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
		<div className="grid gap-3 grid-cols-1 lg:grid-cols-4 lg:grid-rows-[auto_auto]">
			<Card className="p-6 lg:col-span-2 lg:row-span-2">
				<CreateVolumeForm initialValues={{ ...volume, ...volume.config }} onSubmit={console.log} />
			</Card>
			<div className="lg:col-span-2 lg:row-span-1">
				<HealthchecksCard volume={volume} />
			</div>
			<div className="lg:col-span-2">
				<StorageChart statfs={statfs} />
			</div>
		</div>
	);
};
