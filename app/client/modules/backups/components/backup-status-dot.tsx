import { StatusDot } from "~/client/components/status-dot";

export const BackupStatusDot = ({
	enabled,
	hasError,
	isInProgress,
}: {
	enabled: boolean;
	hasError?: boolean;
	isInProgress?: boolean;
}) => {
	let variant: "success" | "neutral" | "error" | "info";
	let label: string;

	if (isInProgress) {
		variant = "info";
		label = "Backup in progress";
	} else if (hasError) {
		variant = "error";
		label = "Error";
	} else if (enabled) {
		variant = "success";
		label = "Active";
	} else {
		variant = "neutral";
		label = "Paused";
	}

	return <StatusDot variant={variant} label={label} />;
};
