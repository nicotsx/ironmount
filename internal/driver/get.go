package driver

import (
	"fmt"
	"ironmount/internal/db"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func Get(c *gin.Context) {
	var body GetRequest

	if err := c.BindJSON(&body); err != nil {
		log.Error().Err(err).Msg("Failed to bind JSON for Get request")
		c.JSON(http.StatusBadRequest, gin.H{"Err": err.Error()})
		return
	}

	vol, err := db.GetVolumeByName(body.Name)

	fmt.Println("Get volume by name:", vol.Name)

	if err != nil {
		log.Warn().Err(err).Str("name", body.Name).Msg("Failed to get volume by name")
		response := map[string]string{
			"Err": err.Error(),
		}
		c.JSON(http.StatusNotFound, response)

		return
	}

	response := map[string]any{
		"Volume": map[string]any{
			"Name":       vol.Name,
			"Mountpoint": vol.Path,
			"Status":     map[string]string{},
			// "CreatedAt":  vol.CreatedAt,
		},
		"Err": "",
	}

	c.JSON(http.StatusOK, response)
}
