import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { updateVolumeMutation } from "~/api-client/@tanstack/react-query.gen";
import { CreateVolumeForm, type FormValues } from "~/components/create-volume-form";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Card } from "~/components/ui/card";
import type { StatFs, Volume } from "~/lib/types";
import { HealthchecksCard } from "../components/healthchecks-card";
import { StorageChart } from "../components/storage-chart";

type Props = {
	volume: Volume;
	statfs: StatFs;
};

export const VolumeInfoTabContent = ({ volume, statfs }: Props) => {
	const updateMutation = useMutation({
		...updateVolumeMutation(),
		onSuccess: (_) => {
			toast.success("Volume updated successfully");
			setOpen(false);
			setPendingValues(null);
		},
		onError: (error) => {
			toast.error("Failed to update volume", { description: error.message });
			setOpen(false);
			setPendingValues(null);
		},
	});

	const [open, setOpen] = useState(false);
	const [pendingValues, setPendingValues] = useState<FormValues | null>(null);

	const handleSubmit = (values: FormValues) => {
		console.log({ values });
		setPendingValues(values);
		setOpen(true);
	};

	const confirmUpdate = () => {
		if (pendingValues) {
			updateMutation.mutate({
				path: { name: volume.name },
				body: { config: pendingValues },
			});
		}
	};

	return (
		<>
			<div className="grid gap-4 xl:grid-cols-[minmax(0,_2.3fr)_minmax(320px,_1fr)]">
				<Card className="p-6">
					<CreateVolumeForm
						initialValues={{ ...volume, ...volume.config }}
						onSubmit={handleSubmit}
						mode="update"
						loading={updateMutation.isPending}
					/>
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
			<AlertDialog open={open} onOpenChange={setOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Update Volume Configuration</AlertDialogTitle>
						<AlertDialogDescription>
							Editing the volume will remount it with the new config immediately. This may temporarily disrupt access to
							the volume. Continue?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmUpdate}>Update</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};
