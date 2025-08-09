package driver

import (
	"encoding/json"
	"ironmount/internal/db"
	"net/http"

	"github.com/rs/zerolog/hlog"
)

func List(w http.ResponseWriter, r *http.Request) {
	volumes, err := db.ListVolumes()
	if err != nil {
		hlog.FromRequest(r).Error().Err(err).Msg("Error listing volumes")
		json.NewEncoder(w).Encode(map[string]any{
			"Volumes": nil,
			"Err":     err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"Volumes": volumes,
		"Err":     "",
	})
}
