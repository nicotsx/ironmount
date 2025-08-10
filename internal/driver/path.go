package driver

import (
	"ironmount/internal/db"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func Path(c *gin.Context) {
	var req PathRequest

	if err := c.BindJSON(&req); err != nil {
		log.Error().Err(err).Msg("Invalid request body for Path")
		c.JSON(http.StatusBadRequest, gin.H{"Err": "Invalid request body"})
		return
	}

	vol, err := db.GetVolumeByName(req.Name)
	if err != nil {
		log.Error().Err(err).Str("volume", req.Name).Msg("Failed to get volume by name")

		c.JSON(http.StatusNotFound, gin.H{"Err": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"Mountpoint": vol.Path,
		"Err":        "",
	})
}
