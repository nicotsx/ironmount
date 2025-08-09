package driver

import (
	"encoding/json"
	"ironmount/internal/db"
	"net/http"
	"os"

	"github.com/rs/zerolog/hlog"
	"github.com/rs/zerolog/log"
)

func Remove(w http.ResponseWriter, r *http.Request) {
	var req RemoveRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	vol, err := db.GetVolumeByName(req.Name)
	if err != nil {
		hlog.FromRequest(r).Error().Err(err).Msg("Error retrieving volume")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"Err": err.Error(),
		})
		return
	}

	db.RemoveVolume(vol.Name)

	log.Info().Str("path", vol.Path).Msg("Removing volume directory")
	os.RemoveAll(vol.Path)

	_ = json.NewEncoder(w).Encode(map[string]string{"Err": ""})
}
