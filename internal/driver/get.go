package driver

import (
	"encoding/json"
	"log"
	"net/http"
)

func Get(w http.ResponseWriter, r *http.Request) {
	log.Printf("Received get request: %s", r.URL.Path)

	var req struct {
		Name string
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	vol := volumes[req.Name]

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
