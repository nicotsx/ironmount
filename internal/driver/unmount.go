package driver

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Unmount(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"Err": "",
	})
}
