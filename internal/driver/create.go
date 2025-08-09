package driver

import (
	"encoding/json"
	"ironmount/internal/constants"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

func Create(w http.ResponseWriter, r *http.Request) {
	log.Printf("Received create request: %s", r.URL.Path)

	var req struct {
		Name string
		Opts map[string]string `json:"Opts,omitempty"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	volPath := filepath.Join(constants.VolumeRoot, req.Name)
	if err := os.MkdirAll(volPath, 0755); err != nil {
		_ = json.NewEncoder(w).Encode(map[string]string{"Err": err.Error()})
		return
	}

	response := map[string]string{
		"Name":       req.Name,
		"Mountpoint": volPath,
		"Err":        "",
	}

	volumes[req.Name] = Volume{Name: req.Name, Path: volPath}
	_ = json.NewEncoder(w).Encode(response)
}
