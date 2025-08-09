package driver

type Volume struct {
	Name string
	Path string
}

var volumes = map[string]Volume{}
