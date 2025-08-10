package db

import (

	"gorm.io/gorm"
)

type Volume struct {
	gorm.Model
	Name string `json:"name"`
	Path string `json:"path"`
}
