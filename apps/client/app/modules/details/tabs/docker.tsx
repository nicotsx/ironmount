import { Card } from "~/components/ui/card";
import type { Volume } from "~/lib/types";
import * as YML from "yaml";
import { CodeBlock } from "~/components/ui/code-block";

type Props = {
	volume: Volume;
};

export const DockerTabContent = ({ volume }: Props) => {
	const yamlString = YML.stringify({
		services: {
			nginx: {
				image: "nginx:latest",
				volumes: [`${volume.name}:/path/in/container`],
			},
		},
		volumes: {
			[volume.name]: {
				external: true,
			},
		},
	});

	return (
		<div className="grid gap-4 grid-cols-1 lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
			<Card className="p-6 lg:col-span-2 lg:row-span-2">
				<div className="text-sm text-muted-foreground">
					This volume can be used in your Docker Compose files by referencing it as an external volume. The example
					demonstrates how to mount the volume to a service (nginx in this case). Make sure to adjust the path inside
					the container to fit your application's needs.
				</div>
				<CodeBlock code={yamlString} language="yaml" filename="docker-compose.yml" />
				<div className="text-sm text-muted-foreground">
					Alternatively, you can use the following command to run a Docker container with the volume mounted:
				</div>
				<CodeBlock code={`docker run -v ${volume.name}:/path/in/container nginx:latest`} />
			</Card>
		</div>
	);
};
