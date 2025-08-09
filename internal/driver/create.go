package driver

import (
	"encoding/json"
	"ironmount/internal/constants"
	"net/http"
	"os"
	"path/filepath"
)

func Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name string
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	volPath := filepath.Join(constants.VolumeRoot, req.Name)
	if err := os.MkdirAll(volPath, 0755); err != nil {
		_ = json.NewEncoder(w).Encode(map[string]string{"Err": err.Error()})
		return
	}

	volumes[req.Name] = Volume{Name: req.Name, Path: volPath}
	_ = json.NewEncoder(w).Encode(map[string]string{"Err": ""})
}
