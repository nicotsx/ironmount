import { CreateVolumeForm } from "~/components/create-volume-form";
import { Card } from "~/components/ui/card";
import { HealthchecksCard } from "../components/healthchecks-card";
import type { StatFs, Volume } from "~/lib/types";
import { ByteSize } from "~/components/bytes-size";

type Props = {
	volume: Volume;
	statfs: StatFs;
};

export const VolumeInfoTabContent = ({ volume, statfs }: Props) => {
	return (
		<div className="grid gap-4 grid-cols-1 lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
			<Card className="p-6 lg:col-span-2 lg:row-span-2">
				<CreateVolumeForm initialValues={{ ...volume, ...volume.config }} onSubmit={console.log} />
			</Card>
			<HealthchecksCard volume={volume} />
			<Card className="p-6 h-full">
				<h2 className="text-lg font-medium">Volume Information</h2>
				Total: <ByteSize bytes={statfs.total} />
				<br />
				Free: <ByteSize bytes={statfs.free} />
				<br />
				Used: <ByteSize bytes={statfs.used} />
			</Card>
		</div>
	);
};
