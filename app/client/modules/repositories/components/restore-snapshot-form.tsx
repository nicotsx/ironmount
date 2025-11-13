import { arktypeResolver } from "@hookform/resolvers/arktype";
import { type } from "arktype";
import { useForm } from "react-hook-form";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/client/components/ui/form";
import { Input } from "~/client/components/ui/input";

const restoreSnapshotFormSchema = type({
	path: "string?",
	include: "string?",
	exclude: "string?",
});

export type RestoreSnapshotFormValues = typeof restoreSnapshotFormSchema.inferIn;

type Props = {
	formId: string;
	onSubmit: (values: RestoreSnapshotFormValues) => void;
	className?: string;
};

export const RestoreSnapshotForm = ({ formId, onSubmit, className }: Props) => {
	const form = useForm<RestoreSnapshotFormValues>({
		resolver: arktypeResolver(restoreSnapshotFormSchema),
		defaultValues: {
			path: "",
			include: "",
			exclude: "",
		},
	});

	const handleSubmit = (values: RestoreSnapshotFormValues) => {
		onSubmit(values);
	};

	return (
		<Form {...form}>
			<form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className={className}>
				<div className="space-y-4">
					<FormField
						control={form.control}
						name="path"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Path (Optional)</FormLabel>
								<FormControl>
									<Input placeholder="/specific/path" {...field} />
								</FormControl>
								<FormDescription>
									Restore only a specific path from the snapshot (leave empty to restore all)
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="include"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Include Patterns (Optional)</FormLabel>
								<FormControl>
									<Input placeholder="*.txt,/documents/**" {...field} />
								</FormControl>
								<FormDescription>Include only files matching these patterns (comma-separated)</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="exclude"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Exclude Patterns (Optional)</FormLabel>
								<FormControl>
									<Input placeholder="*.log,/temp/**" {...field} />
								</FormControl>
								<FormDescription>Exclude files matching these patterns (comma-separated)</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</form>
		</Form>
	);
};
