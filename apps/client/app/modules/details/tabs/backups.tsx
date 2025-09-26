import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import type { Volume } from "~/lib/types";
import { cn } from "~/lib/utils";

type BackupDestination = "s3" | "sftp" | "filesystem";
type BackupFrequency = "hourly" | "daily" | "weekly";
type BackupEncryption = "none" | "aes256" | "gpg";

type BackupFormValues = {
	isEnabled: boolean;
	destination: BackupDestination;
	frequency: BackupFrequency;
	dailyTime: string;
	weeklyDay: string;
	retentionCopies: string;
	retentionDays: string;
	notifyOnFailure: boolean;
	notificationWebhook: string;
	encryption: BackupEncryption;
	encryptionPassword: string;
	s3Bucket: string;
	s3Region: string;
	s3PathPrefix: string;
	sftpHost: string;
	sftpPort: string;
	sftpUsername: string;
	sftpPath: string;
	filesystemPath: string;
};

type Props = {
	volume: Volume;
};

const weeklyDays = [
	{ label: "Monday", value: "monday" },
	{ label: "Tuesday", value: "tuesday" },
	{ label: "Wednesday", value: "wednesday" },
	{ label: "Thursday", value: "thursday" },
	{ label: "Friday", value: "friday" },
	{ label: "Saturday", value: "saturday" },
	{ label: "Sunday", value: "sunday" },
];

export const VolumeBackupsTabContent = ({ volume }: Props) => {
	const form = useForm<BackupFormValues>({
		defaultValues: {
			isEnabled: true,
			destination: "s3",
			frequency: "daily",
			dailyTime: "02:00",
			weeklyDay: "sunday",
			retentionCopies: "7",
			retentionDays: "30",
			notifyOnFailure: true,
			notificationWebhook: "",
			encryption: "aes256",
			encryptionPassword: "",
			s3Bucket: "",
			s3Region: "us-east-1",
			s3PathPrefix: `${volume.name}/backups`,
			sftpHost: "",
			sftpPort: "22",
			sftpUsername: "",
			sftpPath: `/backups/${volume.name}`,
			filesystemPath: `/var/backups/${volume.name}`,
		},
	});

	const destination = form.watch("destination");
	const frequency = form.watch("frequency");
	const encryption = form.watch("encryption");
	const notifyOnFailure = form.watch("notifyOnFailure");
	const values = form.watch();

	const summary = useMemo(() => {
		const scheduleLabel =
			frequency === "hourly"
				? "Every hour"
				: frequency === "daily"
					? `Every day at ${values.dailyTime}`
					: `Every ${values.weeklyDay.charAt(0).toUpperCase()}${values.weeklyDay.slice(1)} at ${values.dailyTime}`;

		const destinationLabel = (() => {
			if (destination === "s3") {
				return `Amazon S3 → ${values.s3Bucket || "<bucket>"} (${values.s3Region})`;
			}
			if (destination === "sftp") {
				return `SFTP → ${values.sftpUsername || "user"}@${values.sftpHost || "server"}:${values.sftpPath}`;
			}
			return `Filesystem → ${values.filesystemPath}`;
		})();

		return {
			vol: volume.name,
			scheduleLabel,
			destinationLabel,
			encryptionLabel: encryption === "none" ? "Disabled" : encryption.toUpperCase(),
			retentionLabel: `${values.retentionCopies} copies \u2022 ${values.retentionDays} days`,
			notificationsLabel: notifyOnFailure
				? values.notificationWebhook
					? `Webhook to ${values.notificationWebhook}`
					: "Webhook pending configuration"
				: "Disabled",
		};
	}, [
		destination,
		encryption,
		frequency,
		notifyOnFailure,
		values.dailyTime,
		values.filesystemPath,
		values.notificationWebhook,
		values.retentionCopies,
		values.retentionDays,
		values.s3Bucket,
		values.s3Region,
		values.sftpHost,
		values.sftpPath,
		values.sftpUsername,
		values.weeklyDay,
		volume.name,
	]);

	const handleSubmit = (formValues: BackupFormValues) => {
		console.info("Backup configuration", formValues);
	};

	return (
		<div className="grid gap-4 grid-cols-1 xl:grid-cols-[minmax(0,_2fr)_minmax(260px,_1fr)]">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between gap-4">
							<div>
								<CardTitle>Backup automation</CardTitle>
								<CardDescription>Enable scheduled snapshots and off-site replication for this volume.</CardDescription>
							</div>
							<FormField
								control={form.control}
								name="isEnabled"
								render={({ field }) => (
									<FormItem className="flex flex-col items-center space-y-2">
										<FormControl>
											<div
												className={cn(
													"flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
													field.value
														? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
														: "border-muted bg-muted/40 text-muted-foreground dark:border-muted/60 dark:bg-muted/10",
												)}
											>
												<span>{field.value ? "Enabled" : "Paused"}</span>
												<Switch checked={field.value} onCheckedChange={field.onChange} />
											</div>
										</FormControl>
									</FormItem>
								)}
							/>
						</CardHeader>
						<CardContent className="grid gap-6 md:grid-cols-2">
							<FormField
								control={form.control}
								name="destination"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Destination provider</FormLabel>
										<FormControl>
											<Select onValueChange={field.onChange} value={field.value}>
												<SelectTrigger>
													<SelectValue placeholder="Select a destination" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="s3">Amazon S3</SelectItem>
													<SelectItem value="sftp">SFTP server</SelectItem>
													<SelectItem value="filesystem">Local filesystem</SelectItem>
												</SelectContent>
											</Select>
										</FormControl>
										<FormDescription>
											Choose where backups for <strong>{volume.name}</strong> will be stored.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="frequency"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Backup frequency</FormLabel>
										<FormControl>
											<Select onValueChange={field.onChange} value={field.value}>
												<SelectTrigger>
													<SelectValue placeholder="Select frequency" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="hourly">Hourly</SelectItem>
													<SelectItem value="daily">Daily</SelectItem>
													<SelectItem value="weekly">Weekly</SelectItem>
												</SelectContent>
											</Select>
										</FormControl>
										<FormDescription>Define how often snapshots should be taken.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							{frequency !== "hourly" && (
								<FormField
									control={form.control}
									name="dailyTime"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Execution time</FormLabel>
											<FormControl>
												<Input type="time" value={field.value} onChange={field.onChange} />
											</FormControl>
											<FormDescription>Time of day when the backup will run.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							{frequency === "weekly" && (
								<FormField
									control={form.control}
									name="weeklyDay"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Execution day</FormLabel>
											<FormControl>
												<Select onValueChange={field.onChange} value={field.value}>
													<SelectTrigger>
														<SelectValue placeholder="Select a day" />
													</SelectTrigger>
													<SelectContent>
														{weeklyDays.map((day) => (
															<SelectItem key={day.value} value={day.value}>
																{day.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>
											<FormDescription>Choose which day of the week to run the backup.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							<FormField
								control={form.control}
								name="retentionCopies"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Max copies to retain</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={1}
												value={field.value}
												onChange={(event) => field.onChange(event.target.value)}
											/>
										</FormControl>
										<FormDescription>Oldest backups will be pruned after this many copies.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="retentionDays"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Retention window (days)</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={1}
												value={field.value}
												onChange={(event) => field.onChange(event.target.value)}
											/>
										</FormControl>
										<FormDescription>Backups older than this window will be removed.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					{destination === "s3" && (
						<Card>
							<CardHeader>
								<CardTitle>Amazon S3 bucket</CardTitle>
								<CardDescription>
									Define the bucket and path where compressed archives will be uploaded.
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="s3Bucket"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Bucket name</FormLabel>
											<FormControl>
												<Input placeholder="ironmount-backups" value={field.value} onChange={field.onChange} />
											</FormControl>
											<FormDescription>Ensure the bucket has versioning and lifecycle rules as needed.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="s3Region"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Region</FormLabel>
											<FormControl>
												<Input placeholder="us-east-1" value={field.value} onChange={field.onChange} />
											</FormControl>
											<FormDescription>AWS region where the bucket resides.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="s3PathPrefix"
									render={({ field }) => (
										<FormItem className="md:col-span-2">
											<FormLabel>Object prefix</FormLabel>
											<FormControl>
												<Input placeholder="volume-name/backups" value={field.value} onChange={field.onChange} />
											</FormControl>
											<FormDescription>Backups will be stored under this key prefix inside the bucket.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>
					)}

					{destination === "sftp" && (
						<Card>
							<CardHeader>
								<CardTitle>SFTP target</CardTitle>
								<CardDescription>Connect to a remote host that will receive encrypted backup archives.</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="sftpHost"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Hostname</FormLabel>
											<FormControl>
												<Input placeholder="backup.example.com" value={field.value} onChange={field.onChange} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="sftpPort"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Port</FormLabel>
											<FormControl>
												<Input type="number" min={1} value={field.value} onChange={field.onChange} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="sftpUsername"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Username</FormLabel>
											<FormControl>
												<Input placeholder="backup" value={field.value} onChange={field.onChange} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="sftpPath"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Destination path</FormLabel>
											<FormControl>
												<Input placeholder="/var/backups/ironmount" value={field.value} onChange={field.onChange} />
											</FormControl>
											<FormDescription>Ensure the directory exists and has write permissions.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>
					)}

					{destination === "filesystem" && (
						<Card>
							<CardHeader>
								<CardTitle>Filesystem target</CardTitle>
								<CardDescription>Persist archives to a directory on the host running Ironmount.</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-4">
								<FormField
									control={form.control}
									name="filesystemPath"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Backup directory</FormLabel>
											<FormControl>
												<Input placeholder="/var/backups/volume-name" value={field.value} onChange={field.onChange} />
											</FormControl>
											<FormDescription>The directory must be mounted with sufficient capacity.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>
					)}

					<Card>
						<CardHeader>
							<CardTitle>Encryption & notifications</CardTitle>
							<CardDescription>Secure backups and stay informed when something goes wrong.</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-6 md:grid-cols-2">
							<FormField
								control={form.control}
								name="encryption"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Encryption</FormLabel>
										<FormControl>
											<Select onValueChange={field.onChange} value={field.value}>
												<SelectTrigger>
													<SelectValue placeholder="Select encryption" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="none">Disabled</SelectItem>
													<SelectItem value="aes256">AES-256 (managed key)</SelectItem>
													<SelectItem value="gpg">GPG (bring your own)</SelectItem>
												</SelectContent>
											</Select>
										</FormControl>
										<FormDescription>Protect backups at rest with optional encryption.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							{encryption !== "none" && (
								<FormField
									control={form.control}
									name="encryptionPassword"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Encryption secret</FormLabel>
											<FormControl>
												<Input type="password" placeholder="••••••••" value={field.value} onChange={field.onChange} />
											</FormControl>
											<FormDescription>
												Store this password securely. It will be required to restore backups.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							<FormField
								control={form.control}
								name="notifyOnFailure"
								render={({ field }) => (
									<FormItem className="flex flex-col space-y-2">
										<FormLabel>Failure alerts</FormLabel>
										<div className="flex items-center justify-between rounded-lg border px-3 py-2">
											<div className="space-y-1">
												<p className="text-sm font-medium">Webhook notifications</p>
												<p className="text-xs text-muted-foreground">Send an HTTP POST when a backup fails.</p>
											</div>
											<FormControl>
												<Switch checked={field.value} onCheckedChange={field.onChange} />
											</FormControl>
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>

							{notifyOnFailure && (
								<FormField
									control={form.control}
									name="notificationWebhook"
									render={({ field }) => (
										<FormItem className="md:col-span-2">
											<FormLabel>Webhook URL</FormLabel>
											<FormControl>
												<Input
													placeholder="https://hooks.example.com/ironmount"
													value={field.value}
													onChange={field.onChange}
												/>
											</FormControl>
											<FormDescription>Ironmount will POST a JSON payload with failure details.</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
						</CardContent>
						<CardFooter className="border-t pt-6">
							<Button type="submit" className="ml-auto" variant="default">
								Save draft configuration
							</Button>
						</CardFooter>
					</Card>
				</form>
			</Form>

			<Card className="h-full">
				<CardHeader>
					<CardTitle>Runbook summary</CardTitle>
					<CardDescription>Validate the automation before enabling it in production.</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 text-sm">
					<div>
						<p className="text-xs uppercase text-muted-foreground">Volume</p>
						<p className="font-medium">{summary.vol}</p>
					</div>
					<div>
						<p className="text-xs uppercase text-muted-foreground">Schedule</p>
						<p className="font-medium">{summary.scheduleLabel}</p>
					</div>
					<div>
						<p className="text-xs uppercase text-muted-foreground">Destination</p>
						<p className="font-medium">{summary.destinationLabel}</p>
					</div>
					<div>
						<p className="text-xs uppercase text-muted-foreground">Retention</p>
						<p className="font-medium">{summary.retentionLabel}</p>
					</div>
					<div>
						<p className="text-xs uppercase text-muted-foreground">Encryption</p>
						<p className="font-medium">{summary.encryptionLabel}</p>
					</div>
					<div>
						<p className="text-xs uppercase text-muted-foreground">Notifications</p>
						<p className="font-medium">{summary.notificationsLabel}</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};
