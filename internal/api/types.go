package api

type CreateVolumeBody struct {
	Name string `json:"name" binding:"required"`
}

type CreateVolumeResponse struct {
	Name       string `json:"name"`
	Mountpoint string `json:"mountpoint"`
	Err        string `json:"err,omitempty"`
}

type GetVolumeResponse struct {
	Name       string `json:"name"`
	Mountpoint string `json:"mountpoint"`
	Err        string `json:"err,omitempty"`
}

type VolumeInfo struct {
	Name       string `json:"name"`
	Mountpoint string `json:"mountpoint"`
	Err        string `json:"err,omitempty"`
}

type ListVolumesResponse struct {
	Volumes []VolumeInfo `json:"volumes"`
	Err     string       `json:"err,omitempty"`
}
