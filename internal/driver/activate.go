package driver

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Activate(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"Implements": []string{
			"VolumeDriver",
		},
	})
}
