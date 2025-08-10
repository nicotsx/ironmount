package driver

import (
	"github.com/gin-gonic/gin"
)

func SetupHandlers(router *gin.Engine) {
	router.POST("/Plugin.Activate", Activate)
	router.POST("/VolumeDriver.Create", Create)
	router.POST("/VolumeDriver.Remove", Remove)
	router.POST("/VolumeDriver.Mount", Mount)
	router.POST("/VolumeDriver.Unmount", Unmount)
	router.POST("/VolumeDriver.Path", Path)
	router.POST("/VolumeDriver.Get", Get)
	router.POST("/VolumeDriver.List", List)
	router.POST("/VolumeDriver.Capabilities", Capabilities)
}
