package driver

import (
	"encoding/json"
	"net/http"
)

func Unmount(w http.ResponseWriter, r *http.Request) {
	_ = json.NewEncoder(w).Encode(map[string]string{"Err": ""})
}
