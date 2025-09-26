import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { CodeBlock } from "~/components/ui/code-block";
import type { Volume } from "~/lib/types";
import * as YML from "yaml";

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

	const dockerRunCommand = `docker run -v ${volume.name}:/path/in/container nginx:latest`;

	return (
		<div className="grid gap-4 xl:grid-cols-[minmax(0,_2.3fr)_minmax(320px,_1fr)]">
			<Card>
				<CardHeader>
					<CardTitle>Plug-and-play Docker integration</CardTitle>
					<CardDescription className="mt-2">
						This volume can be used in your Docker Compose files by referencing it as an external volume. The example
						demonstrates how to mount the volume to a service (nginx in this case). Make sure to adjust the path inside
						the container to fit your application's needs
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="relative space-y-6">
						<div className="space-y-4">
							<div className="flex flex-col gap-4">
								<CodeBlock code={yamlString} language="yaml" filename="docker-compose.yml" />
							</div>
							<div className="text-sm text-muted-foreground">
								Alternatively, you can use the following command to run a Docker container with the volume mounted
							</div>
							<div className="flex flex-col gap-4">
								<CodeBlock code={dockerRunCommand} filename="CLI one-liner" />
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="grid">
				<Card>
					<CardHeader>
						<CardTitle>Best practices</CardTitle>
						<CardDescription>Validate the automation before enabling it in production.</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4 text-sm"></CardContent>
				</Card>
			</div>
		</div>
	);
};
