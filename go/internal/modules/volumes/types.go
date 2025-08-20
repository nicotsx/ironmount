package volumes

import (
	"encoding/json"
	"fmt"
	"strings"
)

var DateFormat = "2006-01-02T15:04:05Z"

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

type VolumeBackendType string

const (
	VolumeBackendTypeSMB   VolumeBackendType = "smb"
	VolumeBackendTypeNFS   VolumeBackendType = "nfs"
	VolumeBackendTypeLocal VolumeBackendType = "local"
)

func (vbt VolumeBackendType) String() string {
	return string(vbt)
}

func (vbt *VolumeBackendType) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return fmt.Errorf("volume backend type should be a string: %w", err)
	}

	lower := strings.ToLower(s)

	switch VolumeBackendType(lower) {
	case VolumeBackendTypeSMB, VolumeBackendTypeNFS, VolumeBackendTypeLocal:
		*vbt = VolumeBackendType(lower)
		return nil
	default:
		return fmt.Errorf("invalid volume backend type: '%s'. Allowed types are: smb, nfs, local", lower)
	}
}

type VolumeCreateRequest struct {
	Name   string            `json:"name" binding:"required"`
	Type   VolumeBackendType `json:"type" binding:"required,oneof=nfs smb directory"`
	Config json.RawMessage   `json:"config" binding:"required"`
}

type NFSConfig struct {
	Server     string `json:"server" binding:"required,hostname|ip"`
	ExportPath string `json:"exportPath" binding:"required"`
	Port       int    `json:"port" binding:"required,min=1,max=65535"`
	Version    string `json:"version" binding:"required,oneof=3 4"`
}

type SMBConfig struct {
	Server   string `json:"server" binding:"required"`
	Share    string `json:"share" binding:"required"`
	Username string `json:"username,omitempty"`
	Password string `json:"password,omitempty"`
	Domain   string `json:"domain,omitempty"`
}

type DirectoryConfig struct {
	Path string `json:"path" binding:"required"`
}
