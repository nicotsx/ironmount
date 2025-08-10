package driver

import (
	"ironmount/internal/db"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func Mount(c *gin.Context) {
	var req MountRequest
	if err := c.BindJSON(&req); err != nil {
		log.Error().Err(err).Msg("Invalid request body")

		c.JSON(http.StatusBadRequest, gin.H{"Err": "Invalid request body"})
		return
	}

	vol, err := db.GetVolumeByName(req.Name)

	if err != nil {
		log.Error().Err(err).Str("volume", req.Name).Msg("Failed to get volume")

		c.JSON(http.StatusNotFound, gin.H{"Err": err.Error()})
		return
	}

	log.Info().Str("volume", vol.Name).Str("path", vol.Path).Msg("Mounting volume")

	c.JSON(http.StatusOK, gin.H{
		"Name":       vol.Name,
		"Mountpoint": vol.Path,
		"Err":        "",
	})
}
