package driver

import "github.com/gin-gonic/gin"

func Capabilities(c *gin.Context) {
	c.JSON(200, gin.H{
		"Capabilities": map[string]bool{
			"Scope": true, // Indicates that the driver supports scope (local/global)
		},
	})
}
