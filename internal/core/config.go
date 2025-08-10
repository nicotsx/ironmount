package core

import (
	"github.com/go-playground/validator/v10"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

type Config struct {
	VolumeRootHost string `mapstructure:"volume_root" validate:"required"`
}

func LoadConfig() Config {
	var config Config
	viper.AutomaticEnv()

	viper.BindEnv("volume_root", "VOLUME_ROOT")

	if err := viper.Unmarshal(&config); err != nil {
		log.Error().Err(err).Msg("Failed to load configuration")
		panic("Failed to load configuration: " + err.Error())
	}

	validator := validator.New()
	if err := validator.Struct(config); err != nil {
		log.Error().Err(err).Msg("Configuration validation failed")
		panic("Configuration validation failed: " + err.Error())
	}

	log.Info().Msgf("Loaded configuration: %+v", config)

	return config
}
