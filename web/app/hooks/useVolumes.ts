import { useQuery } from "@tanstack/react-query";
import { type } from "arktype";

const volumesSchema = type({
	volumes: type({
		created_at: "string",
		mountpoint: "string",
		name: "string",
	}).array(),
});

const getVolumes = async () => {
	const response = await fetch("/api/volumes");
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
};

export const useVolumes = () => {
	const query = useQuery({
		queryKey: ["volumes"],
		queryFn: getVolumes,
		select: (data) => {
			const result = volumesSchema(data);

			if (result instanceof type.errors) {
				console.error("Volumes data validation failed:", result);
				return { volumes: [] };
			}

			return result;
		},
	});

	return query;
};
