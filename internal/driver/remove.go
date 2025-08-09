package driver

import (
	"encoding/json"
	"ironmount/internal/db"
	"log"
	"net/http"
	"os"
)

func Remove(w http.ResponseWriter, r *http.Request) {
	log.Printf("Received remove request: %s", r.URL.Path)

	var req RemoveRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	vol, err := db.GetVolumeByName(req.Name)
	if err != nil {
		log.Printf("Error retrieving volume: %s", err.Error())
		_ = json.NewEncoder(w).Encode(map[string]string{
			"Err": err.Error(),
		})
		return
	}

	db.RemoveVolume(vol.Name)
	os.RemoveAll(vol.Path)

	_ = json.NewEncoder(w).Encode(map[string]string{"Err": ""})
}
