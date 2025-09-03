import { useMutation } from "@tanstack/react-query";
import { useId } from "react";
import { toast } from "sonner";
import type { GetVolumeResponse } from "~/api-client";
import { updateVolumeMutation } from "~/api-client/@tanstack/react-query.gen";
import { parseError } from "~/lib/errors";
import { CreateVolumeForm } from "./create-volume-form";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";

type Props = {
	open: boolean;
	setOpen: (open: boolean) => void;
	initialValues?: Partial<GetVolumeResponse>;
};

export const EditVolumeDialog = ({ open, setOpen, initialValues }: Props) => {
	const formId = useId();

	const update = useMutation({
		...updateVolumeMutation(),
		onSuccess: () => {
			toast.success("Volume updated successfully");
			setOpen(false);
		},
		onError: (error) => {
			toast.error("Failed to update volume", {
				description: parseError(error)?.message,
			});
		},
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create volume</DialogTitle>
					<DialogDescription>Enter a name for the new volume</DialogDescription>
				</DialogHeader>
				<CreateVolumeForm
					mode="update"
					formId={formId}
					initialValues={{ ...initialValues, ...initialValues?.config }}
					onSubmit={(values) => {
						update.mutate({ body: { config: values }, path: { name: values.name } });
					}}
				/>
				<DialogFooter>
					<Button type="button" variant="secondary" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button type="submit" form={formId} disabled={update.isPending}>
						Update
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
