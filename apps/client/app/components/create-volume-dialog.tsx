import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { slugify } from "~/lib/utils";
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
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";

type Props = {
	open: boolean;
	setOpen: (open: boolean) => void;
};

const formSchema = z.object({
	name: z
		.string()
		.min(2, {
			message: "Volume name must be at least 2 characters long",
		})
		.max(32, {
			message: "Volume name must be at most 32 characters long",
		}),
});

export const CreateVolumeDialog = ({ open, setOpen }: Props) => {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
		},
	});

	const nameValue = form.watch("name");
	const createVolume = useMutation({});

	const onSubmit = (values: { name: string }) => {
		createVolume.mutate(values, {
			onSuccess: () => {
				form.reset();
				setOpen(false);
			},
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="bg-blue-900 hover:bg-blue-800">
					<Plus size={16} />
					Create volume
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create volume</DialogTitle>
					<DialogDescription>
						Enter a name for the new volume.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input
											placeholder="Volume name"
											value={field.value ?? ""}
											onChange={(e) => field.onChange(slugify(e.target.value))}
											max={32}
											min={1}
										/>
									</FormControl>
									<FormDescription>
										Unique identifier for the volume.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						{createVolume.error && (
							<div className="text-red-500 text-sm">
								{createVolume.error.message}
							</div>
						)}
						<DialogFooter>
							<Button variant="secondary" onClick={() => setOpen(false)}>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={createVolume.status === "pending" || !nameValue}
							>
								Create
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
