package api

import (
	"fmt"
	"ironmount/internal/constants"
	"ironmount/internal/core"
	"ironmount/internal/db"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// CreateVolume handles the creation of a new volume.
func CreateVolume(c *gin.Context) {
	var body CreateVolumeBody
	if err := c.BindJSON(&body); err != nil {
		log.Error().Err(err).Msg("Failed to bind JSON for CreateVolume request")
		c.JSON(http.StatusBadRequest, gin.H{"err": "Invalid request body"})
		return
	}

	cfg := core.LoadConfig()

	volPathHost := filepath.Join(cfg.VolumeRootHost, body.Name)
	volPathLocal := filepath.Join(constants.VolumeRootLocal, body.Name)

	log.Info().Str("path", volPathLocal).Msg("Creating volume directory")

	if err := os.MkdirAll(volPathLocal, 0755); err != nil {
		log.Error().Err(err).Str("path", volPathLocal).Msg("Failed to create volume directory")

		c.JSON(http.StatusInternalServerError, gin.H{"err": err.Error()})
		return
	}

	if err := db.CreateVolume(body.Name, volPathHost); err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			log.Warn().Err(err).Str("name", body.Name).Msg("Volume already exists")
			c.JSON(http.StatusConflict, gin.H{"err": fmt.Sprintf("Volume %s already exists", body.Name)})
			return
		}

		log.Error().Err(err).Str("name", body.Name).Msg("Failed to create volume in database")
		c.JSON(http.StatusInternalServerError, gin.H{"Err": err.Error()})
		return
	}

	// Create with docker volume driver

	c.JSON(200, CreateVolumeResponse{
		Name:       body.Name,
		Mountpoint: volPathHost,
		Err:        "",
	})
}

func GetVolume(c *gin.Context) {
	vol, err := db.GetVolumeByName(c.Param("name"))
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, GetVolumeResponse{
		Name:       vol.Name,
		Mountpoint: vol.Path,
		Err:        "",
	})
}

func ListVolumes(c *gin.Context) {
	vols, err := db.ListVolumes()

	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
	}

	volumes := []VolumeInfo{}

	for _, vol := range vols {
		volumes = append(volumes, VolumeInfo{
			Name:       vol.Name,
			Mountpoint: vol.Path,
			Err:        "",
		})
	}

	c.JSON(200, ListVolumesResponse{
		Volumes: volumes,
		Err:     "",
	})
}

func DeleteVolume(c *gin.Context) {
	if err := db.RemoveVolume(c.Param("name")); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	vol, _ := db.GetVolumeByName(c.Param("name"))
	if vol == nil {
		c.JSON(404, gin.H{"error": "Volume not found"})
		return
	}

	c.JSON(200, gin.H{"message": "Volume deleted successfully"})
}
