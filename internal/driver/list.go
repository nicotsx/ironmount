package driver

import (
	"encoding/json"
	"ironmount/internal/db"
	"log"
	"net/http"
)

func List(w http.ResponseWriter, r *http.Request) {
	log.Printf("Received list request: %s", r.URL.Path)

	volumes, err := db.ListVolumes()
	if err != nil {
		log.Printf("Error listing volumes: %s", err.Error())
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
