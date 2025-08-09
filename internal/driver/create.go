package driver

import (
	"encoding/json"
	"ironmount/internal/core"
	"ironmount/internal/db"
	"net/http"
	"os"
	"path/filepath"

	"github.com/rs/zerolog/log"
)

func Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name string
		Opts map[string]string `json:"Opts,omitempty"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	cfg := core.LoadConfig()
	volPath := filepath.Join(cfg.VolumeRoot, req.Name)

	log.Info().Str("path", volPath).Msg("Creating volume directory")
	if err := os.MkdirAll(volPath, 0755); err != nil {
		log.Error().Err(err).Str("path", volPath).Msg("Failed to create volume directory")
		_ = json.NewEncoder(w).Encode(map[string]string{"Err": err.Error()})
		return
	}

	db.CreateVolume(req.Name, volPath)

	response := map[string]string{
		"Name":       req.Name,
		"Mountpoint": volPath,
		"Err":        "",
	}

	_ = json.NewEncoder(w).Encode(response)
}
