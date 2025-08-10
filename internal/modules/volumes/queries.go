package volumes

import (
	"context"
	"ironmount/internal/db"

	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

type VolumeQueries struct{}

func (q *VolumeQueries) QueryVolumeByName(n string) (*db.Volume, error) {
	ctx := context.Background()

	volume, err := gorm.G[*db.Volume](db.DB).Where("name = ?", n).First(ctx)

	if err != nil {
		if (err.Error() == "record not found") || (err == gorm.ErrRecordNotFound) {
			log.Warn().Str("name", n).Msg("Volume not found")
			return nil, nil
		}

		return nil, err
	}

	return volume, nil
}

func (q *VolumeQueries) InsertVolume(name, path string) error {
	ctx := context.Background()
	err := gorm.G[db.Volume](db.DB).Create(ctx, &db.Volume{Name: name, Path: path})

	if err != nil {
		return err
	}

	return nil
}

func (q *VolumeQueries) RemoveVolume(name string) error {
	ctx := context.Background()

	log.Info().Str("volume", name).Msg("Removing volume")
	_, err := gorm.G[db.Volume](db.DB).Where("name = ?", name).Delete(ctx)

	if err != nil {
		log.Error().Err(err).Str("volume", name).Msg("Error removing volume")
		return err
	}
	return nil
}

func (q *VolumeQueries) QueryVolumes() ([]db.Volume, error) {
	rows, err := gorm.G[db.Volume](db.DB).Select("name", "path", "created_at").Find(context.Background())

	if err != nil {
		return []db.Volume{}, err
	}

	return rows, nil
}
