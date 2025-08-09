package driver

import (
	"encoding/json"
	"log"
	"net/http"
)

func List(w http.ResponseWriter, r *http.Request) {
	log.Printf("Received list request: %s", r.URL.Path)

	var vols []map[string]string
	for _, v := range volumes {
		vols = append(vols, map[string]string{
			"Name": v.Name,
		})
	}
	json.NewEncoder(w).Encode(map[string]interface{}{
		"Volumes": vols,
		"Err":     "",
	})
}
