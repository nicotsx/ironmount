package driver

import (
	"ironmount/internal/constants"
	"ironmount/internal/db"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func Remove(c *gin.Context) {
	var req RemoveRequest

	if err := c.BindJSON(&req); err != nil {
		log.Error().Err(err).Msg("Invalid request body for Remove")
		c.JSON(http.StatusBadRequest, gin.H{"Err": "Invalid request body"})
		return
	}

	vol, err := db.GetVolumeByName(req.Name)
	if err != nil {
		log.Error().Err(err).Str("volume", req.Name).Msg("Failed to get volume by name")

		c.JSON(http.StatusNotFound, gin.H{"Err": err.Error()})
		return
	}

	db.RemoveVolume(vol.Name)

	volPathLocal := filepath.Join(constants.VolumeRootLocal, req.Name)
	log.Info().Str("path", volPathLocal).Msg("Removing volume directory")
	os.RemoveAll(volPathLocal)

	c.JSON(http.StatusOK, gin.H{
		"Err": "",
	})
}
