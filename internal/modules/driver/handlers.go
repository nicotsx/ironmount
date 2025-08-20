// Package driver provides the HTTP handlers for the volume driver API.
package driver

import (
	"ironmount/internal/modules/volumes"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func SetupHandlers(router *gin.Engine) {

	volumeService := volumes.VolumeService{}

	router.POST("/VolumeDriver.Capabilities", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"Capabilities": map[string]bool{
				"Scope": true, // Indicates that the driver supports scope (local/global)
			},
		})
	})

	router.POST("/Plugin.Activate", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"Implements": []string{
				"VolumeDriver",
			},
		})
	})

	router.POST("/VolumeDriver.Create", func(c *gin.Context) {
		var req CreateRequest
		if err := c.BindJSON(&req); err != nil {
			log.Error().Err(err).Msg("Invalid request body for Create")
			c.JSON(http.StatusBadRequest, gin.H{"Err": "Invalid request body"})
			return
		}

		volume, status, err := volumeService.CreateVolume(volumes.VolumeCreateRequest{
			Name: req.Name,
			Type: volumes.VolumeBackendTypeLocal,
		})

		if err != nil {
			log.Error().Err(err).Msg("Failed to create volume")
			c.JSON(status, gin.H{"Err": err.Error()})
			return
		}

		c.JSON(status, gin.H{
			"Name":       volume.Name,
			"Mountpoint": volume.Path,
			"Err":        "",
		})
	})

	router.POST("/VolumeDriver.Remove", func(c *gin.Context) {
		var req RemoveRequest

		if err := c.BindJSON(&req); err != nil {
			log.Error().Err(err).Msg("Invalid request body for Remove")
			c.JSON(http.StatusBadRequest, gin.H{"Err": "Invalid request body"})
			return
		}

		status, err := volumeService.DeleteVolume(req.Name)

		if err != nil {
			c.JSON(status, gin.H{"Err": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"Err": "",
		})
	})

	router.POST("/VolumeDriver.Mount", func(c *gin.Context) {
		var req MountRequest
		if err := c.BindJSON(&req); err != nil {
			log.Error().Err(err).Msg("Invalid request body")

			c.JSON(http.StatusBadRequest, gin.H{"Err": "Invalid request body"})
			return
		}

		volume, err := volumeService.GetVolume(req.Name)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if volume == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Volume not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"Name":       volume.Name,
			"Mountpoint": volume.Path,
			"Err":        "",
		})
	})

	// VolumeDriver.Unmount is a no-op in this implementation
	router.POST("/VolumeDriver.Unmount", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"Err": "",
		})
	})

	// VolumeDriver.Path returns the mount point of the volume
	router.POST("/VolumeDriver.Path", func(c *gin.Context) {
		var req PathRequest

		if err := c.BindJSON(&req); err != nil {
			log.Error().Err(err).Msg("Invalid request body for Path")
			c.JSON(http.StatusBadRequest, gin.H{"Err": "Invalid request body"})
			return
		}

		vol, err := volumeService.GetVolume(req.Name)

		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"Err": err.Error()})
			return
		}

		if vol == nil {
			c.JSON(http.StatusNotFound, gin.H{"Err": "Volume not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"Mountpoint": vol.Path,
			"Err":        "",
		})
	})

	router.POST("/VolumeDriver.Get", func(c *gin.Context) {
		var req GetRequest
		if err := c.BindJSON(&req); err != nil {
			log.Error().Err(err).Msg("Invalid request body for Get")
			c.JSON(http.StatusBadRequest, gin.H{"Err": "Invalid request body"})
			return
		}

		vol, err := volumeService.GetVolume(req.Name)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"Err": err.Error()})
			return
		}

		if vol == nil {
			c.JSON(http.StatusNotFound, gin.H{"Err": "Volume not found"})
			return
		}

		data := map[string]any{
			"Volume": map[string]string{
				"Name":       vol.Name,
				"Mountpoint": vol.Path,
				"CreatedAt":  vol.CreatedAt.Format(volumes.DateFormat),
			},
			"Err": "",
		}

		c.JSON(http.StatusOK, data)
	})

	router.POST("/VolumeDriver.List", func(c *gin.Context) {
		volumesList := volumeService.ListVolumes()

		c.JSON(http.StatusOK, gin.H{
			"Volumes": volumesList,
		})
	})
}
