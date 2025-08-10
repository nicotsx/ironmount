package driver

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func Create(c *gin.Context) {
	log.Error().Msg("Volumes can only be created through the API, not the driver interface")
	c.JSON(http.StatusMethodNotAllowed, gin.H{
		"Err": "Volumes can only be created through the API, not the driver interface",
	})
}
