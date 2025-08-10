package driver

import (
	"ironmount/internal/constants"
	"ironmount/internal/core"
	"ironmount/internal/db"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func Create(c *gin.Context) {
	var body CreateRequest

	if err := c.BindJSON(&body); err != nil {
		log.Error().Err(err).Msg("Failed to bind JSON for Create request")
		c.JSON(http.StatusBadRequest, gin.H{"Err": err.Error()})
		return
	}

	cfg := core.LoadConfig()

	volPathHost := filepath.Join(cfg.VolumeRootHost, body.Name)
	volPathLocal := filepath.Join(constants.VolumeRootLocal, body.Name)

	log.Info().Str("path", volPathLocal).Msg("Creating volume directory")
	if err := os.MkdirAll(volPathLocal, 0755); err != nil {
		log.Error().Err(err).Str("path", volPathLocal).Msg("Failed to create volume directory")

		c.JSON(http.StatusInternalServerError, gin.H{"Err": err.Error()})
		return
	}

	db.CreateVolume(body.Name, volPathHost)

	response := map[string]string{
		"Name":       body.Name,
		"Mountpoint": volPathHost,
		"Err":        "",
	}

	c.JSON(http.StatusOK, response)
}
