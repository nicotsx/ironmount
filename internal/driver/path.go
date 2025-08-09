package driver

import (
	"encoding/json"
	"ironmount/internal/db"
	"log"
	"net/http"
)

func Path(w http.ResponseWriter, r *http.Request) {
	log.Printf("Received path request: %s", r.URL.Path)

	var req PathRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	vol, err := db.GetVolumeByName(req.Name)
	if err != nil {
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
