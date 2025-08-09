package driver

import (
	"encoding/json"
	"log"
	"net/http"
)

func Activate(w http.ResponseWriter, r *http.Request) {
	log.Printf("Received activation request: %s", r.URL.Path)

	resp := map[string]any{
		"Implements": []string{"VolumeDriver"},
	}
	_ = json.NewEncoder(w).Encode(resp)
}
