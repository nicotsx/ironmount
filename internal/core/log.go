package core

import (
	stdlog "log"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
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

func colorStatus(code int) string {
	switch {
	case code >= 200 && code < 300:
		// Green background
		return "\033[42m" + strconv.Itoa(code) + "\033[0m"
	case code >= 300 && code < 400:
		// Cyan background
		return "\033[46m" + strconv.Itoa(code) + "\033[0m"
	case code >= 400 && code < 500:
		// Yellow background
		return "\033[43m" + strconv.Itoa(code) + "\033[0m"
	default:
		// Red background
		return "\033[41m" + strconv.Itoa(code) + "\033[0m"
	}
}

// GinLogger is a middleware for Gin that logs HTTP requests
// using zerolog.
func GinLogger() gin.HandlerFunc {
	return func(c *gin.Context) {

		c.Next()

		code := c.Writer.Status()
		method := c.Request.Method
		path := c.Request.URL.Path

		// logPath check if the path should be logged normally or with debug
		switch {
		case code >= 200 && code < 300:
			log.Info().Str("method", method).Str("path", path).Msgf("Request status=%s", colorStatus(code))
		case code >= 300 && code < 400:
			log.Warn().Str("method", method).Str("path", path).Msgf("Request status=%s", colorStatus(code))
		case code >= 400:
			log.Error().Str("method", method).Str("path", path).Msgf("Request status=%s", colorStatus(code))
		}
	}
}
