import type { GetVolumeResponse } from "~/api-client";

export type Volume = GetVolumeResponse;
export type VolumeStatus = Volume["status"];
