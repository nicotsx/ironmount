import { getCapabilities } from "../../core/capabilities";

const getSystemInfo = async () => {
	return {
		capabilities: await getCapabilities(),
	};
};

export const systemService = {
	getSystemInfo,
};
