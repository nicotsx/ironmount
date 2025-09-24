import { CreateVolumeForm } from "~/components/create-volume-form";
import { Card } from "~/components/ui/card";
import { HealthchecksCard } from "../components/healthchecks-card";
import type { Volume } from "~/lib/types";

type Props = {
	volume: Volume;
};

export const VolumeInfoTabContent = ({ volume }: Props) => {
	return (
		<div className="grid gap-4 grid-cols-1 lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
			<Card className="p-6 lg:col-span-2 lg:row-span-2">
				<CreateVolumeForm initialValues={{ ...volume, ...volume.config }} onSubmit={console.log} />
			</Card>
			<HealthchecksCard volume={volume} />
			<Card className="p-6 h-full">
				<h2 className="text-lg font-medium">Volume Information</h2>
			</Card>
		</div>
	);
};
