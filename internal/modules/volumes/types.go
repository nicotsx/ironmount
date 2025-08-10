package volumes

var DateFormat = "2006-01-02T15:04:05Z"

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
	CreatedAt  string `json:"created_at,omitempty"`
}

type ListVolumesResponse struct {
	Volumes []VolumeInfo `json:"volumes"`
	Err     string       `json:"err,omitempty"`
}
