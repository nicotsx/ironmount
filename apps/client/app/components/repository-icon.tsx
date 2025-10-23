import type { RepositoryBackend } from "@ironmount/schemas/restic";
import { Database, HardDrive, Cloud } from "lucide-react";

type Props = {
	backend: RepositoryBackend;
	className?: string;
};

export const RepositoryIcon = ({ backend, className = "h-4 w-4" }: Props) => {
	switch (backend) {
		case "local":
			return <HardDrive className={className} />;
		case "s3":
			return <Cloud className={className} />;
		default:
			return <Database className={className} />;
	}
};
