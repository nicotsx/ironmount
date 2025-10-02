import type { GetMeResponse, GetVolumeResponse } from "~/api-client";

export type Volume = GetVolumeResponse["volume"];
export type StatFs = GetVolumeResponse["statfs"];
export type VolumeStatus = Volume["status"];

export type User = GetMeResponse["user"];
