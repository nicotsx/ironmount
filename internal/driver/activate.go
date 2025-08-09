package driver

import (
	"encoding/json"
	"net/http"
)

func Activate(w http.ResponseWriter, r *http.Request) {
	resp := map[string]any{
		"Implements": []string{"VolumeDriver"},
	}
	_ = json.NewEncoder(w).Encode(resp)
}
