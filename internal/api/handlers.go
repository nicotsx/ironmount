package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// SetupHandlers sets up the API routes for the application.
func SetupHandlers(router *gin.Engine) {
	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	router.GET("/api/volumes", ListVolumes)
	router.POST("/api/volumes", CreateVolume)
	router.GET("/api/volumes/:name", GetVolume)
	router.DELETE("/api/volumes/:name", DeleteVolume)
}
