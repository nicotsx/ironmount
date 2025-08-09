package driver

import (
	"encoding/json"
	"log"
	"net/http"
)

func Path(w http.ResponseWriter, r *http.Request) {
	log.Printf("Received path request: %s", r.URL.Path)

	var req PathRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

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
