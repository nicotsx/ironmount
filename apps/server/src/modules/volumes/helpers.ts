import { VOLUME_MOUNT_BASE } from "../../core/constants";

export const getVolumePath = (name: string) => {
	return `${VOLUME_MOUNT_BASE}/${name}/_data`;
};
