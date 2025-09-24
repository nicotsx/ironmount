import { Card } from "~/components/ui/card";
import type { Volume } from "~/lib/types";
import CodeMirror from "@uiw/react-codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { copilot } from "@uiw/codemirror-theme-copilot";
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

	return (
		<div className="grid gap-4 grid-cols-1 lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
			<Card className="p-6 lg:col-span-2 lg:row-span-2">
				<CodeMirror readOnly={true} value={yamlString} height="200px" extensions={[yaml()]} theme={copilot} />
				Alternatively, you can use the following command to run a Docker container with the volume mounted:
				<CodeMirror
					readOnly={true}
					value={`docker run -v ${volume.name}:/path/in/container nginx:latest`}
					height="25px"
					extensions={[yaml()]}
					theme={copilot}
				/>
			</Card>
			<Card className="p-6 h-full lg:row-span-2">
				<h3 className="text-lg font-semibold mb-2 text-center">Using the volume with Docker</h3>
				<div className="text-sm text-muted-foreground mb-4 text-center flex h-full">
					This volume can be used in your Docker Compose files by referencing it as an external volume. The example
					demonstrates how to mount the volume to a service (nginx in this case). Make sure to adjust the path inside
					the container to fit your application's needs.
				</div>
			</Card>
		</div>
	);
};
