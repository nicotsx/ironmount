import { useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useId } from "react";
import { toast } from "sonner";
import { createVolumeMutation } from "~/api-client/@tanstack/react-query.gen";
import { parseError } from "~/client/lib/errors";
import { CreateVolumeForm } from "./create-volume-form";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";

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
				<Button>
					<Plus size={16} className="mr-2" />
					Create volume
				</Button>
			</DialogTrigger>
			<DialogContent>
				<ScrollArea className="h-[500px] p-4">
					<DialogHeader>
						<DialogTitle>Create volume</DialogTitle>
					</DialogHeader>
					<CreateVolumeForm
						className="mt-4"
						mode="create"
						formId={formId}
						onSubmit={(values) => {
							create.mutate({ body: { config: values, name: values.name } });
						}}
					/>
					<DialogFooter className="mt-4">
						<Button type="button" variant="secondary" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button type="submit" form={formId} disabled={create.isPending}>
							Create
						</Button>
					</DialogFooter>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
};
