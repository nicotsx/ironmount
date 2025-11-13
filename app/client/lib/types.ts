import type {
	GetBackupScheduleResponse,
	GetMeResponse,
	GetRepositoryResponse,
	GetVolumeResponse,
	ListSnapshotsResponse,
} from "../api-client";

export type Volume = GetVolumeResponse["volume"];
export type StatFs = GetVolumeResponse["statfs"];
export type VolumeStatus = Volume["status"];

export type User = GetMeResponse["user"];

export type Repository = GetRepositoryResponse;

export type BackupSchedule = GetBackupScheduleResponse;

export type Snapshot = ListSnapshotsResponse[number];
