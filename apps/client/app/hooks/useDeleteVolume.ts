import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type } from "arktype";

const volumesSchema = type({
	message: "string",
});

const deleteVolume = async (variables: { name: string }) => {
	const response = await fetch(`/api/volumes/${variables.name}`, {
		method: "DELETE",
	});

	if (!response.ok) {
		throw new Error("Network response was not ok");
	}

	return response.json();
};

export const useDeleteVolume = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteVolume,
		onSuccess: (data) => {
			const result = volumesSchema(data);

			if (result instanceof type.errors) {
				console.error("Volumes data validation failed:", result);
				return { message: "Invalid data format" };
			}

			queryClient.invalidateQueries({ queryKey: ["volumes"] });

			return result;
		},
	});
};
