import { arktypeResolver } from "@hookform/resolvers/arktype";
import { volumeConfigSchema } from "@ironmount/schemas";
import { type } from "arktype";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export const formSchema = type({
	name: "2<=string<=32",
}).and(volumeConfigSchema);

type FormValues = typeof formSchema.infer;
type Props = {
	open: boolean;
	setOpen: (open: boolean) => void;
	onSubmit: (values: FormValues) => void;
};

export const CreateVolumeDialog = ({ open, setOpen, onSubmit }: Props) => {
	const form = useForm<typeof formSchema.infer>({
		resolver: arktypeResolver(formSchema),
		defaultValues: {
			name: "",
			backend: "directory",
		},
	});

	const watchedBackend = form.watch("backend");

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
					<DialogDescription>Enter a name for the new volume.</DialogDescription>
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
									<FormDescription>Unique identifier for the volume.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="backend"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Backend</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a backend" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="directory">Directory</SelectItem>
											<SelectItem value="nfs">NFS</SelectItem>
										</SelectContent>
									</Select>
									<FormDescription>Choose the storage backend for this volume.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						{watchedBackend === "nfs" && (
							<>
								<FormField
									name="server"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Server</FormLabel>
											<FormControl>
												<Input placeholder="192.168.1.100" value={field.value ?? ""} onChange={field.onChange} />
											</FormControl>
											<FormDescription>NFS server IP address or hostname.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name="exportPath"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Export Path</FormLabel>
											<FormControl>
												<Input placeholder="/export/data" value={field.value ?? ""} onChange={field.onChange} />
											</FormControl>
											<FormDescription>Path to the NFS export on the server.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name="port"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Port</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="2049"
													value={field.value ?? ""}
													onChange={(e) => field.onChange(parseInt(e.target.value, 10) || undefined)}
												/>
											</FormControl>
											<FormDescription>NFS server port (default: 2049).</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name="version"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Version</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select NFS version" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="3">NFS v3</SelectItem>
													<SelectItem value="4">NFS v4</SelectItem>
													<SelectItem value="4.1">NFS v4.1</SelectItem>
												</SelectContent>
											</Select>
											<FormDescription>NFS protocol version to use.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</>
						)}
						{/* {createVolume.error && ( */}
						{/* 	<div className="text-red-500 text-sm"> */}
						{/* 		{createVolume.error.message} */}
						{/* 	</div> */}
						{/* )} */}
						<DialogFooter>
							<Button variant="secondary" onClick={() => setOpen(false)}>
								Cancel
							</Button>
							<Button
								type="submit"
								// disabled={createVolume.status === "pending" || !nameValue}
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
