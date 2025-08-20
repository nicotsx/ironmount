package volumes

import (
	"fmt"
	"ironmount/internal/constants"
	"ironmount/internal/core"
	"ironmount/internal/db"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/rs/zerolog/log"
	"k8s.io/utils/mount"
)

type VolumeService struct{}

var volumeQueries = VolumeQueries{}

// CreateVolume handles the creation of a new volume.
func (v *VolumeService) CreateVolume(body VolumeCreateRequest) (*db.Volume, int, error) {
	name := core.Slugify(body.Name)
	if name == "" || name != body.Name {
		return nil, http.StatusBadRequest, fmt.Errorf("invalid volume name: %s", body.Name)
	}

	existingVol, _ := volumeQueries.QueryVolumeByName(name)

	if existingVol != nil {
		return nil, http.StatusConflict, fmt.Errorf("volume %s already exists", name)
	}

	cfg := core.LoadConfig()

	volPathHost := filepath.Join(cfg.VolumeRootHost, name, "_data")
	volPathLocal := filepath.Join(constants.VolumeRootLocal, name, "_data")

	if err := os.MkdirAll(volPathLocal, 0755); err != nil {
		return nil, http.StatusInternalServerError, fmt.Errorf("failed to create volume directory: %w", err)
	}

	switch body.Type {
	case VolumeBackendTypeNFS:
		var cfg NFSConfig
		cfg, err := core.DecodeStrict[NFSConfig](body.Config)
		if err != nil {
			return nil, http.StatusBadRequest, fmt.Errorf("invalid NFS configuration: %w", err)
		}

		mounter := mount.New("")
		source := fmt.Sprintf("%s:%s", cfg.Server, cfg.ExportPath)
		options := []string{"vers=" + cfg.Version, "port=" + fmt.Sprintf("%d", cfg.Port)}

		if err := UnmountVolume(volPathLocal); err != nil {
			return nil, http.StatusInternalServerError, fmt.Errorf("failed to unmount existing volume: %w", err)
		}

		if err := mounter.Mount(source, volPathLocal, "nfs", options); err != nil {
			return nil, http.StatusInternalServerError, fmt.Errorf("failed to mount NFS volume: %w", err)
		}

	case VolumeBackendTypeSMB:
		var _ SMBConfig

	case VolumeBackendTypeLocal:
		var cfg DirectoryConfig
		log.Debug().Str("directory_path", cfg.Path).Msg("Using local directory for volume")
	}

	bytesConfig, err := body.Config.MarshalJSON()
	if err != nil {
		return nil, http.StatusBadRequest, fmt.Errorf("failed to marshal volume configuration: %w", err)
	}
	stringConfig := string(bytesConfig)

	if err := volumeQueries.InsertVolume(name, volPathHost, stringConfig); err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			return nil, http.StatusConflict, fmt.Errorf("volume %s already exists", name)
		}

		return nil, http.StatusInternalServerError, fmt.Errorf("failed to create volume in database: %w", err)
	}

	return &db.Volume{
		Name: name,
		Path: volPathHost,
	}, http.StatusOK, nil
}

func (v *VolumeService) GetVolume(name string) (*db.Volume, error) {
	vol, err := volumeQueries.QueryVolumeByName(name)

	return vol, err
}

func (v *VolumeService) ListVolumes() []VolumeInfo {
	vols, _ := volumeQueries.QueryVolumes()
	volumes := []VolumeInfo{}

	for _, vol := range vols {
		volumes = append(volumes, VolumeInfo{
			Name:       vol.Name,
			Mountpoint: vol.Path,
			CreatedAt:  vol.CreatedAt.Format(DateFormat),
			Err:        "",
		})
	}

	return volumes
}

func (v *VolumeService) DeleteVolume(name string) (int, error) {
	vol, _ := volumeQueries.QueryVolumeByName(name)

	if vol == nil {
		return http.StatusNotFound, fmt.Errorf("volume %s not found", name)
	}

	if err := volumeQueries.RemoveVolume(name); err != nil {
		return http.StatusInternalServerError, fmt.Errorf("failed to remove volume from database: %w", err)
	}

	volPathLocal := filepath.Join(constants.VolumeRootLocal, name)
	log.Debug().Str("volume_path", volPathLocal).Msg("Deleting volume directory")
	if err := UnmountVolume(volPathLocal); err != nil {
		return http.StatusInternalServerError, fmt.Errorf("failed to unmount volume: %w", err)
	}

	os.RemoveAll(volPathLocal)

	return http.StatusOK, nil
}
