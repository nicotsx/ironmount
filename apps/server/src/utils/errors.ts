import { ConflictError, NotFoundError } from "http-errors-enhanced";

export const handleServiceError = (error: unknown) => {
	if (error instanceof ConflictError) {
		return { message: error.message, status: 409 as const };
	}

	if (error instanceof NotFoundError) {
		return { message: error.message, status: 404 as const };
	}

	console.error("Unhandled service error:", error);
	return { message: "Internal Server Error", status: 500 as const };
};
