package driver

import (
	"encoding/json"
	"ironmount/internal/db"
	"log"
	"net/http"
)

func Mount(w http.ResponseWriter, r *http.Request) {
	log.Printf("Received mount request: %s", r.URL.Path)

	var req MountRequest
	err := json.NewDecoder(r.Body).Decode(&req)

	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	vol, err := db.GetVolumeByName(req.Name)
	if err != nil {
		log.Printf("Error retrieving volume: %s", err.Error())
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
