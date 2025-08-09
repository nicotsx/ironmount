package driver

import (
	"encoding/json"
	"log"
	"net/http"
)

func Unmount(w http.ResponseWriter, r *http.Request) {
	log.Printf("Received unmount request: %s", r.URL.Path)

	_ = json.NewEncoder(w).Encode(map[string]string{"Err": ""})
}
