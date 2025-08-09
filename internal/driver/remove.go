package driver

import (
	"encoding/json"
	"net/http"
)

func Remove(w http.ResponseWriter, r *http.Request) {
	var req RemoveRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	delete(volumes, req.Name)
	_ = json.NewEncoder(w).Encode(map[string]string{"Err": ""})
}
