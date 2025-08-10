package driver

import (
	"ironmount/internal/db"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func List(c *gin.Context) {
	volumes, err := db.ListVolumes()

	if err != nil {
		log.Error().Err(err).Msg("Failed to list volumes")

		c.JSON(http.StatusInternalServerError, gin.H{
			"Volumes": nil,
			"Err":     err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"Volumes": volumes,
		"Err":     "",
	})
}
