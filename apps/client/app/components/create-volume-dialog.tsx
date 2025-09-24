import { useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useId } from "react";
import { toast } from "sonner";
import { createVolumeMutation } from "~/api-client/@tanstack/react-query.gen";
import { parseError } from "~/lib/errors";
import { CreateVolumeForm } from "./create-volume-form";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";

type Props = {
	open: boolean;
	setOpen: (open: boolean) => void;
};

export const CreateVolumeDialog = ({ open, setOpen }: Props) => {
	const formId = useId();

	const create = useMutation({
		...createVolumeMutation(),
		onSuccess: () => {
			toast.success("Volume created successfully");
			setOpen(false);
		},
		onError: (error) => {
			toast.error("Failed to create volume", {
				description: parseError(error)?.message,
			});
		},
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="bg-blue-900 hover:bg-blue-800">
					<Plus size={16} className="mr-2" />
					Create volume
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create volume</DialogTitle>
					<DialogDescription>Enter a name for the new volume</DialogDescription>
				</DialogHeader>
				<CreateVolumeForm
					mode="create"
					formId={formId}
					onSubmit={(values) => {
						create.mutate({ body: { config: values, name: values.name } });
					}}
				/>
				<DialogFooter>
					<Button type="button" variant="secondary" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button type="submit" form={formId} disabled={create.isPending}>
						Create
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
