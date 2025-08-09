package driver

import (
	"encoding/json"
	"ironmount/internal/db"
	"net/http"

	"github.com/rs/zerolog/hlog"
)

func Get(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name string
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	vol, err := db.GetVolumeByName(req.Name)

	if err != nil {
		hlog.FromRequest(r).Error().Err(err).Msg("Error retrieving volume")

		response := map[string]string{
			"Err": err.Error(),
		}
		_ = json.NewEncoder(w).Encode(response)

		return
	}

	response := map[string]any{
		"Volume": map[string]any{
			"Name":       vol.Name,
			"Mountpoint": vol.Path,
			"Status":     map[string]string{},
		},
		"Err": "",
	}

	_ = json.NewEncoder(w).Encode(response)
}
