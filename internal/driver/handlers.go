package driver

import (
	"net/http"
)

func SetupHandlers(mux *http.ServeMux) {
	mux.HandleFunc("/Plugin.Activate", Activate)
	mux.HandleFunc("/VolumeDriver.Create", Create)
	mux.HandleFunc("/VolumeDriver.Remove", Remove)
	mux.HandleFunc("/VolumeDriver.Mount", Mount)
	mux.HandleFunc("/VolumeDriver.Unmount", Unmount)
	mux.HandleFunc("/VolumeDriver.Path", Path)
	mux.HandleFunc("/VolumeDriver.Get", Get)
	mux.HandleFunc("/VolumeDriver.List", List)

}
