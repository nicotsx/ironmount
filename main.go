package main

import (
	"ironmount/internal/constants"
	"ironmount/internal/core"
	"ironmount/internal/db"
	"ironmount/internal/modules/driver"
	"ironmount/internal/modules/volumes"

	"net"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func main() {
	db.InitDB()

	if err := os.MkdirAll("/run/docker/plugins", 0755); err != nil {
		log.Fatal().Err(err).Msg("Failed to create plugin directory")
	}

	if err := os.MkdirAll(constants.VolumeRootLocal, 0755); err != nil {
		log.Fatal().Err(err).Msg("Failed to create volume root")
	}

	if err := os.MkdirAll("/run/docker/plugins", 0755); err != nil {
		log.Fatal().Err(err).Msg("Failed to create plugin directory")
	}

	socketPath := "/run/docker/plugins/ironmount.sock"
	if err := os.RemoveAll(socketPath); err != nil {
		log.Fatal().Err(err).Msg("Failed to remove existing socket")
	}

	gin.SetMode(gin.ReleaseMode)

	router := gin.New()
	router.Use(core.GinLogger())
	router.Use(gin.Recovery())

	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	driver.SetupHandlers(router)
	volumes.SetupHandlers(router)

	unixListener, err := net.Listen("unix", socketPath)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to listen on socket")
	}

	tcpListener, err := net.Listen("tcp", ":8080")
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to listen on TCP port 8080")
	}

	unixServer := &http.Server{Handler: router}
	tcpServer := &http.Server{Handler: router}

	go func() {
		log.Info().Msg("Listening on TCP :8080")
		if err := tcpServer.Serve(tcpListener); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("TCP server error")
		}
	}()

	log.Info().Msg("Listening on UNIX " + socketPath)
	if err := unixServer.Serve(unixListener); err != nil && err != http.ErrServerClosed {
		log.Fatal().Err(err).Msg("Unix server error")
	}
}
