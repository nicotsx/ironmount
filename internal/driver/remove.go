package driver

import (
	"encoding/json"
	"log"
	"net/http"
)

func Remove(w http.ResponseWriter, r *http.Request) {
	log.Printf("Received remove request: %s", r.URL.Path)

	var req RemoveRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	delete(volumes, req.Name)
	_ = json.NewEncoder(w).Encode(map[string]string{"Err": ""})
}
