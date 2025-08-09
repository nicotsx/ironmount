package main

import (
	"ironmount/internal/db"
	"ironmount/internal/driver"
	"log"
	"net"
	"net/http"
	"os"
)

const volumeRoot = "/tmp/ironmount"

type Volume struct {
	Name string
	Path string
}

var volumes = map[string]Volume{}

func main() {
	db.Init()

	if err := os.MkdirAll("/run/docker/plugins", 0755); err != nil {
		log.Fatalf("Failed to create plugin directory: %v", err)
	}

	if err := os.MkdirAll(volumeRoot, 0755); err != nil {
		log.Fatalf("Failed to create volume root: %v", err)
	}

	if err := os.MkdirAll("/run/docker/plugins", 0755); err != nil {
		log.Fatalf("Failed to create plugin directory: %v", err)
	}

	socketPath := "/run/docker/plugins/ironmount.sock"
	if err := os.RemoveAll(socketPath); err != nil {
		log.Fatalf("Failed to remove existing socket: %v", err)
	}

	http.HandleFunc("/Plugin.Activate", driver.Activate)
	http.HandleFunc("/VolumeDriver.Create", driver.Create)
	http.HandleFunc("/VolumeDriver.Remove", driver.Remove)
	http.HandleFunc("/VolumeDriver.Mount", driver.Mount)
	http.HandleFunc("/VolumeDriver.Unmount", driver.Unmount)
	http.HandleFunc("/VolumeDriver.Path", driver.Path)
	http.HandleFunc("/VolumeDriver.Get", driver.Get)
	http.HandleFunc("/VolumeDriver.List", driver.List)

	// Catch all other paths to return an error
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Received unknown request: %s", r.URL.Path)
		http.Error(w, "Not Found", http.StatusNotFound)
	})

	listener, err := net.Listen("unix", socketPath)
	if err != nil {
		log.Fatalf("Failed to listen on socket: %v", err)
	}

	log.Printf("Irounmount plugin started, listening on %s", socketPath)
	log.Fatal(http.Serve(listener, nil))
}
