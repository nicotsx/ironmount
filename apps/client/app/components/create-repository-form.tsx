import { arktypeResolver } from "@hookform/resolvers/arktype";
import { COMPRESSION_MODES, repositoryConfigSchema } from "@ironmount/schemas/restic";
import { type } from "arktype";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { cn, slugify } from "~/lib/utils";
import { deepClean } from "~/utils/object";
import { Button } from "./ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export const formSchema = type({
	name: "2<=string<=32",
	compressionMode: type.valueOf(COMPRESSION_MODES).optional(),
}).and(repositoryConfigSchema);
const cleanSchema = type.pipe((d) => formSchema(deepClean(d)));

export type RepositoryFormValues = typeof formSchema.inferIn;

type Props = {
	onSubmit: (values: RepositoryFormValues) => void;
	mode?: "create" | "update";
	initialValues?: Partial<RepositoryFormValues>;
	formId?: string;
	loading?: boolean;
	className?: string;
};

const defaultValuesForType = {
	local: { backend: "local" as const, compressionMode: "auto" as const },
	s3: { backend: "s3" as const, compressionMode: "auto" as const },
};

export const CreateRepositoryForm = ({
	onSubmit,
	mode = "create",
	initialValues,
	formId,
	loading,
	className,
}: Props) => {
	const form = useForm<RepositoryFormValues>({
		resolver: arktypeResolver(cleanSchema as unknown as typeof formSchema),
		defaultValues: initialValues,
		resetOptions: {
			keepDefaultValues: true,
			keepDirtyValues: false,
		},
	});

	const { watch } = form;

	const watchedBackend = watch("backend");
	const watchedName = watch("name");

	useEffect(() => {
		if (watchedBackend && watchedBackend in defaultValuesForType) {
			form.reset({ name: watchedName, ...defaultValuesForType[watchedBackend as keyof typeof defaultValuesForType] });
		}
	}, [watchedBackend, watchedName, form]);

	return (
		<Form {...form}>
			<form id={formId} onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-4", className)}>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input
									{...field}
									placeholder="Repository name"
									onChange={(e) => field.onChange(slugify(e.target.value))}
									max={32}
									min={2}
									disabled={mode === "update"}
									className={mode === "update" ? "bg-gray-50" : ""}
								/>
							</FormControl>
							<FormDescription>Unique identifier for the repository.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="backend"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Backend</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select a backend" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="local">Local</SelectItem>
									<SelectItem value="s3">S3</SelectItem>
								</SelectContent>
							</Select>
							<FormDescription>Choose the storage backend for this repository.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="compressionMode"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Compression Mode</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select compression mode" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="off">Off</SelectItem>
									<SelectItem value="auto">Auto</SelectItem>
									<SelectItem value="fastest">Fastest</SelectItem>
									<SelectItem value="better">Better</SelectItem>
									<SelectItem value="max">Max</SelectItem>
								</SelectContent>
							</Select>
							<FormDescription>Compression mode for backups stored in this repository.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{watchedBackend === "local" && (
					<FormField
						control={form.control}
						name="path"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Path</FormLabel>
								<FormControl>
									<Input placeholder="/path/to/repository" {...field} />
								</FormControl>
								<FormDescription>Local filesystem path where the repository will be stored.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}

				{watchedBackend === "s3" && (
					<>
						<FormField
							control={form.control}
							name="endpoint"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Endpoint</FormLabel>
									<FormControl>
										<Input placeholder="s3.amazonaws.com" {...field} />
									</FormControl>
									<FormDescription>S3-compatible endpoint URL.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="bucket"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Bucket</FormLabel>
									<FormControl>
										<Input placeholder="my-backup-bucket" {...field} />
									</FormControl>
									<FormDescription>S3 bucket name for storing backups.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="accessKeyId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Access Key ID</FormLabel>
									<FormControl>
										<Input placeholder="AKIAIOSFODNN7EXAMPLE" {...field} />
									</FormControl>
									<FormDescription>S3 access key ID for authentication.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="secretAccessKey"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Secret Access Key</FormLabel>
									<FormControl>
										<Input type="password" placeholder="••••••••" {...field} />
									</FormControl>
									<FormDescription>S3 secret access key for authentication.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				)}

				{mode === "update" && (
					<Button type="submit" className="w-full" loading={loading}>
						Save Changes
					</Button>
				)}
			</form>
		</Form>
	);
};
