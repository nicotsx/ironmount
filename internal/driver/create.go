package driver

import (
	"encoding/json"
	"ironmount/internal/constants"
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
	volPathHost := filepath.Join(cfg.VolumeRootHost, req.Name)
	volPathLocal := filepath.Join(constants.VolumeRootLocal, req.Name)

	log.Info().Str("path", volPathLocal).Msg("Creating volume directory")
	if err := os.MkdirAll(volPathLocal, 0755); err != nil {
		log.Error().Err(err).Str("path", volPathLocal).Msg("Failed to create volume directory")
		_ = json.NewEncoder(w).Encode(map[string]string{"Err": err.Error()})
		return
	}

	db.CreateVolume(req.Name, volPathHost)

	response := map[string]string{
		"Name":       req.Name,
		"Mountpoint": volPathHost,
		"Err":        "",
	}

	_ = json.NewEncoder(w).Encode(response)
}
