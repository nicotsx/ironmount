package db

import (
	"database/sql"

	"github.com/rs/zerolog/log"
	_ "modernc.org/sqlite"
)

type Volume struct {
	Name      string `json:"name"`
	Path      string `json:"path"`
	CreatedAt string `json:"created_at"`
}

// DB is the global database connection
var DB, err = sql.Open("sqlite", "file:ironmount.db")

// Init initializes the database and creates the volumes table if it doesn't exist
func Init() {
	if err != nil {
		panic(err)
	}

	_, err = DB.Exec(`
	CREATE TABLE IF NOT EXISTS volumes (
		name TEXT PRIMARY KEY,
		path TEXT NOT NULL,
		created_at TEXT DEFAULT (datetime('now'))
	);
	`)
	if err != nil {
		panic(err)
	}
}

func GetVolumeByName(n string) (*Volume, error) {
	var path string
	var name string

	err := DB.QueryRow("SELECT name, path FROM volumes WHERE name = ?", n).Scan(&name, &path)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &Volume{
		Name: name,
		Path: path,
	}, nil
}

func CreateVolume(name, path string) error {
	_, err := DB.Exec("INSERT INTO volumes (name, path) VALUES (?, ?)", name, path)
	if err != nil {
		return err
	}
	return nil
}

func RemoveVolume(name string) error {
	_, err := DB.Exec("DELETE FROM volumes WHERE name = ?", name)

	log.Info().Str("volume", name).Msg("Removing volume")
	if err != nil {
		log.Error().Err(err).Str("volume", name).Msg("Error removing volume")
		return err
	}
	return nil
}

func ListVolumes() ([]Volume, error) {
	rows, err := DB.Query("SELECT name, path FROM volumes")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var volumes []Volume
	for rows.Next() {
		var vol Volume
		if err := rows.Scan(&vol.Name, &vol.Path); err != nil {
			return nil, err
		}
		volumes = append(volumes, vol)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return volumes, nil
}
