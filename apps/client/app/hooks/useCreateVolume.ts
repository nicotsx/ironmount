import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type } from "arktype";
import { slugify } from "~/lib/utils";

const createVolume = async (variables: { name: string }) => {
	const cleanName = slugify(variables.name);
	if (!cleanName) {
		throw new Error("Invalid volume name");
	}
	const response = await fetch("/api/volumes", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ name: cleanName }),
	});

	if (!response.ok) {
		let errorText = "Network response was not ok";

		try {
			const errorData = await response.json();
			if (errorData.error && typeof errorData.error === "string") {
				errorText = errorData.error;
			} else {
				errorText = JSON.stringify(errorData);
			}
		} catch (_) {}

		throw new Error(errorText);
	}

	return response.json();
};

const createVolumeSchema = type({
	name: "string",
});

export const useCreateVolume = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createVolume,
		onSuccess: (data) => {
			const result = createVolumeSchema(data);

			if (result instanceof type.errors) {
				console.error("Create volume response validation failed:", result);
				return { message: "Invalid data format" };
			}

			queryClient.invalidateQueries({ queryKey: ["volumes"] });
			return result;
		},
	});
};
