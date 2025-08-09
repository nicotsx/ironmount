package driver

import (
	"encoding/json"
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

	vol, ok := volumes[req.Name]
	if !ok {
		_ = json.NewEncoder(w).Encode(map[string]string{"Err": "volume not found"})
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]string{
		"Mountpoint": vol.Path,
		"Err":        "",
	})
}
