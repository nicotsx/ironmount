package core

import (
	stdlog "log"
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func init() {
	console := zerolog.ConsoleWriter{
		Out:        os.Stderr,
		TimeFormat: time.ANSIC,
	}

	logger := zerolog.New(console).With().Timestamp().Caller().Logger()

	zerolog.SetGlobalLevel(zerolog.InfoLevel)

	log.Logger = logger

	stdlog.SetFlags(0)
	stdlog.SetOutput(console)
}
