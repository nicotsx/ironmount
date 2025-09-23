export const parseError = (error?: unknown) => {
	if (error && typeof error === "object" && "message" in error) {
		return { message: error.message as string };
	}

	if (typeof error === "string") {
		return { message: error };
	}

	return undefined;
};
