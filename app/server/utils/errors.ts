import { ConflictError, NotFoundError } from "http-errors-enhanced";
import { sanitizeSensitiveData } from "./sanitize";

export const handleServiceError = (error: unknown) => {
	if (error instanceof ConflictError) {
		return { message: sanitizeSensitiveData(error.message), status: 409 as const };
	}

	if (error instanceof NotFoundError) {
		return { message: sanitizeSensitiveData(error.message), status: 404 as const };
	}

	return { message: sanitizeSensitiveData(toMessage(error)), status: 500 as const };
};

export const toMessage = (err: unknown): string => {
	const message = err instanceof Error ? err.message : String(err);
	return sanitizeSensitiveData(message);
};
