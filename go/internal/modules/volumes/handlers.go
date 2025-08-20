// Package volumes provides tools for managing volumes in the application.
package volumes

import (
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// SetupHandlers sets up the API routes for the application.
func SetupHandlers(router *gin.Engine) {
	volumeService := VolumeService{}

	router.GET("/api/volumes", func(c *gin.Context) {
		volumes := volumeService.ListVolumes()
		log.Debug().Msgf("Listing volumes: %v", volumes)
		c.JSON(200, gin.H{"volumes": volumes})
	})

	router.POST("/api/volumes", func(c *gin.Context) {
		var body VolumeCreateRequest

		if err := c.ShouldBindJSON(&body); err != nil {
			log.Error().Err(err).Msg("Failed to bind JSON for volume creation")
			c.JSON(400, gin.H{"error": "Invalid request body"})
			return
		}

		volume, status, err := volumeService.CreateVolume(body)
		if err != nil {
			c.JSON(status, gin.H{"error": err.Error()})
			return
		}

		c.JSON(status, volume)
	})

	router.GET("/api/volumes/:name", func(c *gin.Context) {
		volume, err := volumeService.GetVolume(c.Param("name"))
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		if volume == nil {
			c.JSON(404, gin.H{"error": "Volume not found"})
			return
		}
		c.JSON(200, gin.H{
			"name":       volume.Name,
			"mountpoint": volume.Path,
			"created_at": volume.CreatedAt.String(),
			"err":        "",
		})
	})

	router.DELETE("/api/volumes/:name", func(c *gin.Context) {
		status, err := volumeService.DeleteVolume(c.Param("name"))
		if err != nil {
			c.JSON(status, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"message": "Volume deleted successfully"})
	})
}
