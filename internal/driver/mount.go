package driver

import (
	"encoding/json"
	"ironmount/internal/db"
	"net/http"

	"github.com/rs/zerolog/hlog"
	"github.com/rs/zerolog/log"
)

func Mount(w http.ResponseWriter, r *http.Request) {
	var req MountRequest
	err := json.NewDecoder(r.Body).Decode(&req)

	if err != nil {
		hlog.FromRequest(r).Error().Err(err).Msg("Invalid request body")
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	vol, err := db.GetVolumeByName(req.Name)
	if err != nil {
		log.Error().Err(err).Str("volume", req.Name).Msg("Failed to get volume")

		_ = json.NewEncoder(w).Encode(map[string]string{
			"Err": err.Error(),
		})

		return
	}

	log.Info().Str("volume", vol.Name).Str("path", vol.Path).Msg("Mounting volume")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"Mountpoint": vol.Path,
		"Err":        "",
	})
}
