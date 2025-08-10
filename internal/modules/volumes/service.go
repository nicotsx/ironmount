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
)

type VolumeService struct{}

var volumeQueries = VolumeQueries{}

// CreateVolume handles the creation of a new volume.
func (v *VolumeService) CreateVolume(name string) (*db.Volume, int, error) {
	existingVol, _ := volumeQueries.QueryVolumeByName(name)

	if existingVol != nil {
		return nil, http.StatusConflict, fmt.Errorf("volume %s already exists", name)
	}

	cfg := core.LoadConfig()

	volPathHost := filepath.Join(cfg.VolumeRootHost, name)
	volPathLocal := filepath.Join(constants.VolumeRootLocal, name)

	if err := os.MkdirAll(volPathLocal, 0755); err != nil {
		return nil, http.StatusInternalServerError, fmt.Errorf("failed to create volume directory: %w", err)
	}

	if err := volumeQueries.InsertVolume(name, volPathHost); err != nil {
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

	// os.RemoveAll(vol.Path) ?? depends on whether we want to delete the actual directory

	return http.StatusOK, nil
}
