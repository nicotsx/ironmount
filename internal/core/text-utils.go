package core

import (
	"regexp"
	"strings"
)

var nonAlnum = regexp.MustCompile(`[^a-z0-9_-]+`)

var hyphenRuns = regexp.MustCompile(`[-_]{2,}`)

func Slugify(input string) string {
	s := strings.ToLower(strings.TrimSpace(input))
	s = nonAlnum.ReplaceAllString(s, "-")
	s = hyphenRuns.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	return s
}
