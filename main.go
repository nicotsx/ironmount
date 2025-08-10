package main

import (
	"ironmount/internal/constants"
	"ironmount/internal/db"
	"ironmount/internal/driver"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/justinas/alice"
	"github.com/rs/zerolog/hlog"
	"github.com/rs/zerolog/log"
)

type Volume struct {
	Name string
	Path string
}

var volumes = map[string]Volume{}

func main() {
	db.Init()

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

	mux := http.NewServeMux()
	driver.SetupHandlers(mux)

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "Not Found", http.StatusNotFound)
	})

	listener, err := net.Listen("unix", socketPath)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to listen on socket")
	}

	chain := alice.New()
	chain = chain.Append(hlog.NewHandler(log.Logger))
	chain = chain.Append(hlog.AccessHandler(func(r *http.Request, status, size int, duration time.Duration) {
		hlog.FromRequest(r).Info().
			Str("method", r.Method).
			Str("url", r.URL.Path).
			Int("status", status).
			Msg("")
	}))

	log.Info().Str("socket", socketPath).Msg("Irounmount plugin started, listening on")
	if err := http.Serve(listener, chain.Then(mux)); err != nil {
		log.Fatal().Err(err).Msg("Server stopped")
	}
}
