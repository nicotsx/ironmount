import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { Repository } from "~/lib/types";
import { parseError } from "~/lib/errors";
import { doctorRepositoryMutation } from "~/api-client/@tanstack/react-query.gen";
import { cn } from "~/lib/utils";

type Props = {
	repository: Repository;
};

export const RepositoryInfoTabContent = ({ repository }: Props) => {
	const [showDoctorResults, setShowDoctorResults] = useState(false);

	const doctorMutation = useMutation({
		...doctorRepositoryMutation(),
		onSuccess: (data) => {
			if (data) {
				setShowDoctorResults(true);

				if (data.success) {
					toast.success("Repository doctor completed successfully");
				} else {
					toast.warning("Doctor completed with some issues", {
						description: "Check the details for more information",
						richColors: true,
					});
				}
			}
		},
		onError: (error) => {
			toast.error("Failed to run doctor", {
				description: parseError(error)?.message,
			});
		},
	});

	const handleDoctor = () => {
		doctorMutation.mutate({ path: { name: repository.name } });
	};

	const getStepLabel = (step: string) => {
		switch (step) {
			case "unlock":
				return "Unlock Repository";
			case "check":
				return "Check Repository";
			case "repair_index":
				return "Repair Index";
			case "recheck":
				return "Re-check Repository";
			default:
				return step;
		}
	};

	return (
		<>
			<Card className="p-6">
				<div className="space-y-6">
					<div>
						<h3 className="text-lg font-semibold mb-4">Repository Information</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<div className="text-sm font-medium text-muted-foreground">Name</div>
								<p className="mt-1 text-sm">{repository.name}</p>
							</div>
							<div>
								<div className="text-sm font-medium text-muted-foreground">Backend</div>
								<p className="mt-1 text-sm">{repository.type}</p>
							</div>
							<div>
								<div className="text-sm font-medium text-muted-foreground">Compression Mode</div>
								<p className="mt-1 text-sm">{repository.compressionMode || "off"}</p>
							</div>
							<div>
								<div className="text-sm font-medium text-muted-foreground">Status</div>
								<p className="mt-1 text-sm">{repository.status || "unknown"}</p>
							</div>
							<div>
								<div className="text-sm font-medium text-muted-foreground">Created At</div>
								<p className="mt-1 text-sm">{new Date(repository.createdAt).toLocaleString()}</p>
							</div>
							<div>
								<div className="text-sm font-medium text-muted-foreground">Last Checked</div>
								<p className="mt-1 text-sm">
									{repository.lastChecked ? new Date(repository.lastChecked).toLocaleString() : "Never"}
								</p>
							</div>
						</div>
					</div>

					{repository.lastError && (
						<div>
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold text-red-500">Last Error</h3>
								<Button onClick={handleDoctor} disabled={doctorMutation.isPending} variant={"outline"} size="sm">
									{doctorMutation.isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Running Doctor...
										</>
									) : (
										"Run Doctor"
									)}
								</Button>
							</div>
							<div className="bg-red-500/10 border border-red-500/20 rounded-md p-4">
								<p className="text-sm text-red-500">{repository.lastError}</p>
							</div>
						</div>
					)}

					<div>
						<h3 className="text-lg font-semibold mb-4">Configuration</h3>
						<div className="bg-muted/50 rounded-md p-4">
							<pre className="text-sm overflow-auto">{JSON.stringify(repository.config, null, 2)}</pre>
						</div>
					</div>
				</div>
			</Card>

			<AlertDialog open={showDoctorResults} onOpenChange={setShowDoctorResults}>
				<AlertDialogContent className="max-w-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>Doctor Results</AlertDialogTitle>
						<AlertDialogDescription>
							{doctorMutation.data?.message || "Repository doctor operation completed"}
						</AlertDialogDescription>
					</AlertDialogHeader>

					{doctorMutation.data && (
						<div className="space-y-3 max-h-96 overflow-y-auto">
							{doctorMutation.data.steps.map((step) => (
								<div
									key={step.step}
									className={cn("border rounded-md p-3", {
										"bg-green-500/10 border-green-500/20": step.success,
										"bg-yellow-500/10 border-yellow-500/20": !step.success,
									})}
								>
									<div className="flex items-center justify-between mb-2">
										<span className="font-medium text-sm">{getStepLabel(step.step)}</span>
										<span
											className={cn("text-xs px-2 py-1 rounded", {
												"bg-green-500/20 text-green-500": step.success,
												"bg-yellow-500/20 text-yellow-500": !step.success,
											})}
										>
											{step.success ? "Success" : "Warning"}
										</span>
									</div>
									{step.error && <p className="text-xs text-red-500 mt-1">{step.error}</p>}
								</div>
							))}
						</div>
					)}

					<div className="flex justify-end">
						<Button onClick={() => setShowDoctorResults(false)}>Close</Button>
					</div>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};
