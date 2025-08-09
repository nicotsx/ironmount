package driver

import (
	"encoding/json"
	"ironmount/internal/db"
	"net/http"

	"github.com/rs/zerolog/hlog"
)

func Path(w http.ResponseWriter, r *http.Request) {
	var req PathRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	vol, err := db.GetVolumeByName(req.Name)
	if err != nil {
		hlog.FromRequest(r).Error().Err(err).Msg("Error retrieving volume")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"Err": err.Error(),
		})
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]string{
		"Mountpoint": vol.Path,
		"Err":        "",
	})
}
