import { ConflictError, NotFoundError } from "http-errors-enhanced";

export const handleServiceError = (error: unknown) => {
	if (error instanceof ConflictError) {
		return { message: error.message, status: 409 as const };
	}

	if (error instanceof NotFoundError) {
		return { message: error.message, status: 404 as const };
	}

	return { message: toMessage(error), status: 500 as const };
};

export const toMessage = (err: unknown): string => {
	return err instanceof Error ? err.message : String(err);
};
