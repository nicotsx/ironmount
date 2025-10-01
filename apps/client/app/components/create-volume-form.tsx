import { arktypeResolver } from "@hookform/resolvers/arktype";
import { volumeConfigSchema } from "@ironmount/schemas";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { testConnectionMutation } from "~/api-client/@tanstack/react-query.gen";
import { slugify } from "~/lib/utils";
import { Button } from "./ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export const formSchema = type({
	name: "2<=string<=32",
}).and(volumeConfigSchema);

export type FormValues = typeof formSchema.inferIn;

type Props = {
	onSubmit: (values: FormValues) => void;
	mode?: "create" | "update";
	initialValues?: Partial<FormValues>;
	formId?: string;
	loading?: boolean;
};

const defaultValuesForType = {
	directory: { backend: "directory" as const },
	nfs: { backend: "nfs" as const, port: 2049, version: "4.1" as const },
	smb: { backend: "smb" as const, port: 445, vers: "3.0" as const },
	webdav: { backend: "webdav" as const, port: 80, ssl: false },
};

export const CreateVolumeForm = ({ onSubmit, mode = "create", initialValues, formId, loading }: Props) => {
	const form = useForm<FormValues>({
		resolver: arktypeResolver(formSchema),
		defaultValues: initialValues,
		resetOptions: {
			keepDefaultValues: true,
			keepDirtyValues: false,
		},
	});

	const { watch, getValues } = form;

	const watchedBackend = watch("backend");
	const watchedName = watch("name");

	useEffect(() => {
		form.reset({ name: watchedName, ...defaultValuesForType[watchedBackend as keyof typeof defaultValuesForType] });
	}, [watchedBackend, watchedName, form.reset]);

	const [testMessage, setTestMessage] = useState<string>("");

	const testBackendConnection = useMutation({
		...testConnectionMutation(),
		onMutate: () => {
			setTestMessage("");
		},
		onError: () => {
			setTestMessage("Failed to test connection. Please try again.");
		},
		onSuccess: (data) => {
			if (data?.success) {
				setTestMessage(data.message);
			} else {
				setTestMessage(data?.message || "Connection test failed");
			}
		},
	});

	const handleTestConnection = async () => {
		const formValues = getValues();

		if (formValues.backend === "nfs" || formValues.backend === "smb" || formValues.backend === "webdav") {
			testBackendConnection.mutate({
				body: { config: formValues },
			});
		}
	};

	return (
		<Form {...form}>
			<form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input
									{...field}
									placeholder="Volume name"
									onChange={(e) => field.onChange(slugify(e.target.value))}
									max={32}
									min={1}
									disabled={mode === "update"}
									className={mode === "update" ? "bg-gray-50" : ""}
								/>
							</FormControl>
							<FormDescription>Unique identifier for the volume.</FormDescription>
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
									<SelectItem value="directory">Directory</SelectItem>
									<SelectItem value="nfs">NFS</SelectItem>
									<SelectItem value="smb">SMB</SelectItem>
									<SelectItem value="webdav">WebDAV</SelectItem>
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
							control={form.control}
							name="server"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Server</FormLabel>
									<FormControl>
										<Input placeholder="192.168.1.100" {...field} />
									</FormControl>
									<FormDescription>NFS server IP address or hostname.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="exportPath"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Export Path</FormLabel>
									<FormControl>
										<Input placeholder="/export/data" {...field} />
									</FormControl>
									<FormDescription>Path to the NFS export on the server.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="port"
							defaultValue={2049}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Port</FormLabel>
									<FormControl>
										<Input type="number" placeholder="2049" {...field} />
									</FormControl>
									<FormDescription>NFS server port (default: 2049).</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="version"
							defaultValue="4.1"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Version</FormLabel>
									<Select onValueChange={field.onChange} defaultValue="4.1">
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

				{watchedBackend === "webdav" && (
					<>
						<FormField
							control={form.control}
							name="server"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Server</FormLabel>
									<FormControl>
										<Input placeholder="example.com" {...field} />
									</FormControl>
									<FormDescription>WebDAV server hostname or IP address.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="path"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Path</FormLabel>
									<FormControl>
										<Input placeholder="/webdav" {...field} />
									</FormControl>
									<FormDescription>Path to the WebDAV directory on the server.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="username"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Username (Optional)</FormLabel>
									<FormControl>
										<Input placeholder="admin" {...field} />
									</FormControl>
									<FormDescription>Username for WebDAV authentication (optional).</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password (Optional)</FormLabel>
									<FormControl>
										<Input type="password" placeholder="••••••••" {...field} />
									</FormControl>
									<FormDescription>Password for WebDAV authentication (optional).</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="port"
							defaultValue={80}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Port</FormLabel>
									<FormControl>
										<Input type="number" placeholder="80" {...field} />
									</FormControl>
									<FormDescription>WebDAV server port (default: 80 for HTTP, 443 for HTTPS).</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="ssl"
							defaultValue={false}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Use SSL/HTTPS</FormLabel>
									<FormControl>
										<div className="flex items-center space-x-2">
											<input
												type="checkbox"
												checked={field.value ?? false}
												onChange={(e) => field.onChange(e.target.checked)}
												className="rounded border-gray-300"
											/>
											<span className="text-sm">Enable HTTPS for secure connections</span>
										</div>
									</FormControl>
									<FormDescription>Use HTTPS instead of HTTP for secure connections.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				)}

				{watchedBackend === "smb" && (
					<>
						<FormField
							control={form.control}
							name="server"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Server</FormLabel>
									<FormControl>
										<Input placeholder="192.168.1.100" value={field.value ?? ""} onChange={field.onChange} />
									</FormControl>
									<FormDescription>SMB server IP address or hostname.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="share"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Share</FormLabel>
									<FormControl>
										<Input placeholder="myshare" value={field.value ?? ""} onChange={field.onChange} />
									</FormControl>
									<FormDescription>SMB share name on the server.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="username"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Username</FormLabel>
									<FormControl>
										<Input placeholder="admin" value={field.value ?? ""} onChange={field.onChange} />
									</FormControl>
									<FormDescription>Username for SMB authentication.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input type="password" placeholder="••••••••" value={field.value ?? ""} onChange={field.onChange} />
									</FormControl>
									<FormDescription>Password for SMB authentication.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="vers"
							defaultValue="3.0"
							render={({ field }) => (
								<FormItem>
									<FormLabel>SMB Version</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value || "3.0"}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select SMB version" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="1.0">SMB v1.0</SelectItem>
											<SelectItem value="2.0">SMB v2.0</SelectItem>
											<SelectItem value="2.1">SMB v2.1</SelectItem>
											<SelectItem value="3.0">SMB v3.0</SelectItem>
										</SelectContent>
									</Select>
									<FormDescription>SMB protocol version to use (default: 3.0).</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="domain"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Domain (Optional)</FormLabel>
									<FormControl>
										<Input placeholder="WORKGROUP" value={field.value} onChange={field.onChange} />
									</FormControl>
									<FormDescription>Domain or workgroup for authentication (optional).</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="port"
							defaultValue={445}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Port</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="445"
											value={field.value}
											defaultValue={445}
											onChange={(e) => field.onChange(parseInt(e.target.value, 10) || undefined)}
										/>
									</FormControl>
									<FormDescription>SMB server port (default: 445).</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				)}

				{watchedBackend === "smb" && (
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={handleTestConnection}
								disabled={testBackendConnection.isPending}
								className="flex-1"
							>
								{testBackendConnection.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{testBackendConnection.isSuccess && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
								{testBackendConnection.isError && <XCircle className="mr-2 h-4 w-4 text-red-500" />}
								{testBackendConnection.isIdle && "Test Connection"}
								{testBackendConnection.isPending && "Testing..."}
								{testBackendConnection.isSuccess && "Connection Successful"}
								{testBackendConnection.isError && "Test Failed"}
							</Button>
						</div>
						{testMessage && (
							<div
								className={`text-sm p-2 rounded-md ${
									testBackendConnection.isSuccess
										? "bg-green-50 text-green-700 border border-green-200"
										: testBackendConnection.isError
											? "bg-red-50 text-red-700 border border-red-200"
											: "bg-gray-50 text-gray-700 border border-gray-200"
								}`}
							>
								{testMessage}
							</div>
						)}
					</div>
				)}

				{watchedBackend === "nfs" && (
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={handleTestConnection}
								disabled={testBackendConnection.isPending}
								className="flex-1"
							>
								{testBackendConnection.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{testBackendConnection.isSuccess && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
								{testBackendConnection.isError && <XCircle className="mr-2 h-4 w-4 text-red-500" />}
								{testBackendConnection.isIdle && "Test Connection"}
								{testBackendConnection.isPending && "Testing..."}
								{testBackendConnection.isSuccess && "Connection Successful"}
								{testBackendConnection.isError && "Test Failed"}
							</Button>
						</div>
						{testMessage && (
							<div
								className={`text-sm p-2 rounded-md ${
									testBackendConnection.isSuccess
										? "bg-green-50 text-green-700 border border-green-200"
										: testBackendConnection.isError
											? "bg-red-50 text-red-700 border border-red-200"
											: "bg-gray-50 text-gray-700 border border-gray-200"
								}`}
							>
								{testMessage}
							</div>
						)}
					</div>
				)}

				{watchedBackend === "webdav" && (
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={handleTestConnection}
								disabled={testBackendConnection.isPending}
								className="flex-1"
							>
								{testBackendConnection.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{testBackendConnection.isSuccess && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
								{testBackendConnection.isError && <XCircle className="mr-2 h-4 w-4 text-red-500" />}
								{testBackendConnection.isIdle && "Test Connection"}
								{testBackendConnection.isPending && "Testing..."}
								{testBackendConnection.isSuccess && "Connection Successful"}
								{testBackendConnection.isError && "Test Failed"}
							</Button>
						</div>
						{testMessage && (
							<div
								className={`text-sm p-2 rounded-md ${
									testBackendConnection.isSuccess
										? "bg-green-50 text-green-700 border border-green-200"
										: testBackendConnection.isError
											? "bg-red-50 text-red-700 border border-red-200"
											: "bg-gray-50 text-gray-700 border border-gray-200"
								}`}
							>
								{testMessage}
							</div>
						)}
					</div>
				)}
				{mode === "update" && (
					<Button type="submit" className="w-full mt-4" loading={loading}>
						Save Changes
					</Button>
				)}
			</form>
		</Form>
	);
};
