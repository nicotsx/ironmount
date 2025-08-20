// Package db provides database access for the Ironmount application
package db

import (
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB, err = gorm.Open(sqlite.Open("file:ironmount.db"), &gorm.Config{})

// InitDB initializes the database and creates the volumes table if it doesn't exist
func InitDB() {
	if err != nil {
		panic(err)
	}

	err = DB.AutoMigrate(&Volume{})

	if err != nil {
		panic(err)
	}
}
